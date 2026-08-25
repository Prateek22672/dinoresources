// study-buddy — the Study-With-AI tutor.
//
// RETRIEVAL FIRST, MODEL SECOND. Every answer starts by searching the Q&A the
// team has actually written for this subject (search_subject_qa). Whatever
// comes back is the answer's only permitted source of fact. The model's own
// knowledge is used ONLY when retrieval genuinely finds nothing — a question
// outside the syllabus — and that answer is labelled as such all the way to
// the UI, so a student always knows whether they are reading their course
// material or general knowledge.
//
// Grounding is measured, not assumed: `coverage` is the fraction of the
// student's own content words that appear in the retrieved passages, combined
// with Postgres's own ts_rank. Three bands come out of it — notes / mixed /
// beyond — and each gets a different system prompt.
//
// ACCESS: retrieval runs through the caller's JWT, so search_subject_qa
// withholds `answer_md` for anything they have not unlocked. Locked material
// can never reach the prompt, let alone the reply.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getAuthUser } from "../_shared/razorpay.ts";
import { groqChat as groqCall, groqKeyCount, groqStream } from "../_shared/groq.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const GROQ_KEYS = groqKeyCount("GROQ_API_KEY_STUDY");
// Same reasoning as help-bot: on the free tier tokens-per-minute is the binding
// constraint, and a tutor that always answers beats a smarter one that is
// "overloaded" every other message. Override with GROQ_MODEL_STUDY.
const MODEL = Deno.env.get("GROQ_MODEL_STUDY") ?? Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-20b";

const groq = (payload: unknown, extra: { userId?: string } = {}) =>
  groqCall(payload, { preferredEnv: "GROQ_API_KEY_STUDY", label: "study-buddy", timeoutMs: 30_000, ...extra });

/**
 * Record a fault that is NOT a provider HTTP error, so it still reaches
 * Admin → AI Health. _shared/groq.ts logs non-2xx responses; a 200 carrying an
 * empty completion logs nothing anywhere, which is precisely the case that left
 * "the tutor is busy" unexplainable.
 */
async function logIssue(code: string, message: string, userId?: string) {
  try {
    await adminClient().from("bot_error_log").insert({
      fn: "study-buddy",
      code,
      message: message.slice(0, 500),
      key_index: 0,
      key_count: 0,
      user_id: userId ?? null,
    });
  } catch { /* telemetry must never break the reply */ }
}

// ── Rate limit (in-memory sliding window, same shape as help-bot) ──────────
const hits = new Map<string, number[]>();
function rateLimited(uid: string, max: number): boolean {
  const now = Date.now();
  const arr = (hits.get(uid) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(uid, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

// ── Text utilities ─────────────────────────────────────────────────────────
const STOP = new Set([
  "the", "and", "for", "are", "but", "not", "you", "your", "with", "that", "this",
  "from", "have", "has", "what", "why", "how", "when", "which", "does", "did",
  "can", "could", "would", "should", "will", "its", "it's", "about", "into",
  "them", "they", "there", "then", "than", "explain", "tell", "give", "make",
  "please", "some", "more", "most", "also", "any", "all", "one", "two", "using",
  "used", "use", "between", "over", "under", "each", "just", "like", "want",
]);

/**
 * A greeting or an acknowledgement, not a question.
 *
 * These carry no content words, so retrieval has nothing to match and any
 * grounding claim about them is vacuous. Answering one costs a search and a
 * completion to say "hello" — and used to badge that hello "From your notes".
 * Matched exactly, so a real question is never swallowed by it.
 */
const SMALL_TALK =
  /^\s*(hi+|hey+|he+llo+|yo|helo|namaste|good\s*(morning|afternoon|evening|night)|thanks?|thank\s*you|thx|ty|ok(ay)?|k|kk|cool|nice|great|awesome|perfect|bye|byee?|gn|gm|sup|hola)[\s!.,?]*$/i;

function terms(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((w) => w.length > 2 && !STOP.has(w));
}

interface QaRow {
  id: string;
  unit_number: number;
  topic_id: string | null;
  topic_title: string | null;
  question: string;
  answer_md: string | null;
  is_free: boolean;
  rank: number;
}

interface Passage {
  qaId: string;
  unit: number;
  topic: string | null;
  question: string;
  heading: string;
  text: string;
  score: number;
}

const MAX_PASSAGE = 1100;

/**
 * Split one answer into passages on its markdown headings, then on blank lines
 * if a section is still too long. Retrieval at passage level keeps the prompt
 * small enough for the free tier while staying on-topic — feeding four whole
 * 4KB answers would blow the per-minute token budget for one question.
 */
function toPassages(row: QaRow): Passage[] {
  const md = (row.answer_md ?? "").trim();
  if (!md) return [];

  const sections: { heading: string; body: string }[] = [];
  let heading = "";
  let buf: string[] = [];
  const flush = () => {
    if (buf.join("\n").trim()) sections.push({ heading, body: buf.join("\n").trim() });
    buf = [];
  };
  for (const line of md.split("\n")) {
    const h = line.match(/^#{2,4}\s+(.+?)\s*$/);
    if (h) { flush(); heading = h[1]; } else buf.push(line);
  }
  flush();

  const out: Passage[] = [];
  const push = (h: string, text: string) => {
    const t = text.trim();
    if (t.length > 24) {
      out.push({ qaId: row.id, unit: row.unit_number, topic: row.topic_title, question: row.question, heading: h, text: t, score: 0 });
    }
  };
  for (const s of sections) {
    if (s.body.length <= MAX_PASSAGE) { push(s.heading, s.body); continue; }
    // long section — break on paragraph boundaries, never mid-sentence
    let acc = "";
    for (const para of s.body.split(/\n\s*\n/)) {
      if ((acc + "\n\n" + para).length > MAX_PASSAGE && acc) { push(s.heading, acc); acc = para; }
      else acc = acc ? `${acc}\n\n${para}` : para;
    }
    push(s.heading, acc);
  }
  return out;
}

interface Retrieved {
  passages: Passage[];
  rows: QaRow[];
  coverage: number;
  bestRank: number;
  contextText: string;
  /** Rows whose answer is withheld because the student hasn't unlocked them. */
  lockedCount: number;
  /** True when the search RPC itself errored — a different thing from "found
   *  nothing", and the difference is the whole diagnosis when a reply fails. */
  failed?: boolean;
}

const CONTEXT_BUDGET = 6500;

/** Rank passages against the student's own words and fill the prompt budget. */
function selectPassages(rows: QaRow[], query: string): Retrieved {
  const qTerms = [...new Set(terms(query))];
  const all: Passage[] = [];
  for (const r of rows) all.push(...toPassages(r));

  const rankOf = new Map(rows.map((r) => [r.id, Number(r.rank) || 0]));
  for (const p of all) {
    const hay = `${p.question} ${p.heading} ${p.text}`.toLowerCase();
    let hitCount = 0;
    for (const t of qTerms) if (hay.includes(t)) hitCount++;
    const coverage = qTerms.length ? hitCount / qTerms.length : 0;
    const headingHit = qTerms.some((t) => `${p.question} ${p.heading}`.toLowerCase().includes(t)) ? 0.18 : 0;
    // Postgres already judged the parent answer's relevance — keep that signal
    // so a passage from a strongly-matching answer outranks a stray keyword hit.
    p.score = coverage + headingHit + Math.min(rankOf.get(p.qaId) ?? 0, 0.5) * 0.5;
  }
  all.sort((a, b) => b.score - a.score);

  const picked: Passage[] = [];
  let used = 0;
  for (const p of all) {
    if (used + p.text.length > CONTEXT_BUDGET) continue;
    picked.push(p);
    used += p.text.length;
    if (picked.length >= 8) break;
  }

  // Coverage of the *selected* context is what decides grounding.
  const blob = picked.map((p) => `${p.question} ${p.heading} ${p.text}`).join(" ").toLowerCase();
  const found = qTerms.filter((t) => blob.includes(t)).length;
  // No content words means nothing was matched, so there is no evidence of
  // grounding — the old fallback of 1 asserted the opposite and was how a bare
  // "hi" came back badged "From your notes · searched 6 answers".
  const coverage = qTerms.length ? found / qTerms.length : 0;

  const contextText = picked
    .map((p, i) => `[S${i + 1}] Unit ${p.unit}${p.topic ? ` · ${p.topic}` : ""} — ${p.question}${p.heading ? `\n(${p.heading})` : ""}\n${p.text}`)
    .join("\n\n---\n\n");

  return {
    passages: picked,
    rows,
    coverage,
    bestRank: rows.reduce((m, r) => Math.max(m, Number(r.rank) || 0), 0),
    contextText,
    lockedCount: rows.filter((r) => !r.answer_md).length,
  };
}

type Grounding = "notes" | "mixed" | "beyond" | "locked" | "empty" | "chat";

function bandOf(r: Retrieved): Grounding {
  if (r.passages.length === 0) {
    if (r.lockedCount > 0) return "locked";
    // Rows came back but none carried a usable answer: the unit exists and has
    // question placeholders, but nothing has been written up. That is a very
    // different thing from a question being off-syllabus, and answering it as
    // though it were off-syllabus is how Rex ends up inventing a syllabus.
    if (r.rows.length > 0) return "empty";
    return "beyond";
  }
  if (r.coverage >= 0.55 || r.bestRank >= 0.12) return "notes";
  if (r.coverage >= 0.28 || r.bestRank >= 0.04) return "mixed";
  return "beyond";
}

/** Sources shown as chips under the reply — deduped to one per Q&A row. */
function sourceList(r: Retrieved) {
  const seen = new Set<string>();
  const out: { id: string; question: string; unit: number; topic: string | null }[] = [];
  for (const p of r.passages) {
    if (seen.has(p.qaId)) continue;
    seen.add(p.qaId);
    out.push({ id: p.qaId, question: p.question, unit: p.unit, topic: p.topic });
    if (out.length >= 4) break;
  }
  return out;
}

/** A name is user-controlled text that lands in a prompt — keep it to a name. */
function safeName(raw: string | null | undefined): string {
  const n = String(raw ?? "").replace(/[^\p{L}\p{M}' -]/gu, "").trim().split(/\s+/)[0] ?? "";
  return n.slice(0, 24);
}

async function studentName(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): Promise<string> {
  try {
    const { data } = await adminClient().from("profiles")
      .select("full_name, username").eq("id", user.id).maybeSingle();
    const n = safeName(data?.full_name) || safeName(data?.username);
    if (n) return n;
  } catch { /* profile lookup must never break the tutor */ }
  const meta = safeName(user.user_metadata?.full_name as string | undefined);
  return meta || safeName(user.email?.split("@")[0]) || "there";
}

// ── Prompts ────────────────────────────────────────────────────────────────
const VOICE = `You are Rex, the TeamDino study tutor — a sharp senior who has read the student's course material and explains it the night before an exam.
Voice: warm, direct, second person, no filler, no "great question". Short paragraphs. Indian college context.
Format: markdown. **Bold** the terms that matter, use bullets for lists and a small table when comparing things. Keep it under ~250 words unless the student asks you to go deep.
Never say "context", "the provided documents", "source material" or "based on the excerpt". Say "your notes", "Unit 3", "your syllabus".
Finish with ONE short line — either a check of understanding or the obvious next step. Never more than one.`;

function chatSystem(band: Grounding, name: string, scope: string, context: string, outline: string) {
  const who = `You are talking to ${name}. They are studying ${scope}.`;

  if (band === "notes") {
    return `${VOICE}\n\n${who}\n\nTHEIR NOTES (the only facts you may state):\n${context}\n\nRULES\n- Answer ONLY from their notes above. This is the exact material their exam is set from, so it beats anything you remember.\n- Do not add facts, examples or definitions that are not in the notes. If the notes cover only part of the question, answer that part and say in one line what their notes do not cover.\n- Keep their notes' own terminology and their own examples — that is what the examiner will recognise.\n- Explain it, do not just quote it: restructure, simplify, and give the intuition.`;
  }

  if (band === "mixed") {
    return `${VOICE}\n\n${who}\n\nTHEIR NOTES (partially relevant):\n${context}\n\nSYLLABUS OUTLINE:\n${outline}\n\nRULES\n- Lead with what their notes DO cover, in their notes' own terms.\n- If you must add anything beyond the notes to make the answer complete, mark that sentence with "(beyond your notes)" so they know it is not examinable material from their unit.\n- Do not invent details about their specific syllabus.`;
  }

  if (band === "empty") {
    return `${VOICE}\n\n${who}\n\nThis unit has question placeholders but NO written Study-With-AI answers yet — there is genuinely nothing of theirs to quote.\nRULES\n- Open with one honest line saying this unit's answers haven't been written up yet, so what follows is general knowledge and not their syllabus.\n- Then give a short, genuinely useful explanation (about 120 words).\n- Do NOT describe what "their notes" or "their syllabus" contain. You do not know, and guessing invents a course that may not exist. Never present a made-up unit outline, reading list or set of topics as theirs.\n- Point them at the unit's Resources and PYQs tabs, which may well have material even though the Q&A doesn't.`;
  }

  if (band === "locked") {
    return `${VOICE}\n\n${who}\n\nThe answers for this question exist in their subject but are locked — they have not unlocked this subject yet.\nRULES\n- Give a short, genuinely useful explanation from general knowledge (about 120 words) so they still learn something.\n- Then tell them, in one friendly line, that the full worked answer for this exact question is in their subject's Study-With-AI and unlocks with the subject. No pressure, no sales language.`;
  }

  return `${VOICE}\n\n${who}\n\nSYLLABUS OUTLINE (what their notes actually cover):\n${outline}\n\nRULES\n- Their notes do NOT cover this question. Open with one short line saying so plainly, e.g. "This one's outside your unit, but here's the short version:".\n- Then answer it correctly from your own knowledge, briefly.\n- Close by connecting it back to the closest thing that IS in their syllabus outline above, so the detour earns its place.\n- Do not pretend anything here came from their notes.`;
}

// ── Handlers ───────────────────────────────────────────────────────────────
async function retrieve(
  db: ReturnType<typeof createClient>,
  subjectId: string,
  query: string,
  unit: number | null,
  limit: number,
): Promise<Retrieved> {
  const { data, error } = await db.rpc("search_subject_qa", {
    _subject_id: subjectId,
    _query: query.slice(0, 500),
    _unit: unit,
    _limit: limit,
  });
  if (error) {
    // Console logs aren't reachable from the admin UI, and a silently empty
    // result is indistinguishable from "your notes don't cover this" — which is
    // exactly how a permissions or schema problem disguises itself as a model
    // problem. Record it where Admin → AI Health will show it.
    console.error("study-buddy retrieval failed:", error.message);
    try {
      await adminClient().from("bot_error_log").insert({
        fn: "study-buddy",
        code: "retrieval_failed",
        message: String(error.message ?? "").slice(0, 500),
        key_index: 0,
        key_count: 0,
      });
    } catch { /* telemetry must never break the reply */ }
    return { passages: [], rows: [], coverage: 0, bestRank: 0, contextText: "", lockedCount: 0, failed: true };
  }
  return selectPassages((data ?? []) as QaRow[], query);
}

/** Outline of what the subject actually covers — cheap, and keeps "beyond"
 *  answers from drifting away from the student's course. */
function outlineOf(rows: QaRow[]): string {
  const byUnit = new Map<number, string[]>();
  for (const r of rows) {
    const arr = byUnit.get(r.unit_number) ?? [];
    if (arr.length < 6) arr.push(r.question);
    byUnit.set(r.unit_number, arr);
  }
  return [...byUnit.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([u, qs]) => `Unit ${u}: ${qs.join("; ")}`)
    .join("\n") || "(no outline available)";
}

/** Follow-up chips built from real neighbouring questions — always sensible,
 *  and they cost no tokens. */
function followupsFrom(r: Retrieved, band: Grounding): string[] {
  const out: string[] = [];
  // The first source is the one just answered from — offer the neighbours.
  for (const s of sourceList(r).slice(1)) {
    if (out.length >= 2) break;
    out.push(s.question.length > 62 ? `${s.question.slice(0, 60)}…` : s.question);
  }
  out.push("Explain it simpler");
  out.push(band === "beyond" ? "Back to my syllabus" : "Write it as an exam answer");
  return out.slice(0, 4);
}

/**
 * Forward a Groq stream to the browser as SSE.
 *
 * Retrieval has already finished by the time this is called, so `meta` goes out
 * on the first frame: the student sees "From your notes · searched 6" and the
 * citations while the first sentence is still being written, which is the whole
 * point of streaming a retrieval answer.
 *
 * The buffered path's safety net is kept intact. If the model streams nothing
 * at all — gpt-oss can spend its whole budget on reasoning and emit no visible
 * token — the best retrieved passage is sent as the answer instead, exactly as
 * the non-streaming path does, rather than leaving an empty bubble.
 */
function sseChat(
  upstream: Response,
  meta: Record<string, unknown>,
  fallbackText: string | null,
  followups: string[],
): Response {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const frame = (ctl: ReadableStreamDefaultController, obj: unknown) =>
    ctl.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

  const body = new ReadableStream({
    async start(ctl) {
      frame(ctl, { type: "meta", ...meta });
      let got = "";
      try {
        const reader = upstream.body!.getReader();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          // Frames are newline-delimited; the tail may be a partial line, so
          // it is held back until the rest of it arrives.
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const s = line.trim();
            if (!s.startsWith("data:")) continue;
            const chunk = s.slice(5).trim();
            if (!chunk || chunk === "[DONE]") continue;
            try {
              const t = JSON.parse(chunk)?.choices?.[0]?.delta?.content;
              if (t) { got += t; frame(ctl, { type: "delta", t }); }
            } catch { /* keep-alive or a frame split across reads */ }
          }
        }
      } catch (e) {
        console.error("study-buddy stream broke", e);
      }

      if (!got.trim()) {
        if (fallbackText) {
          frame(ctl, { type: "delta", t: fallbackText });
          frame(ctl, { type: "done", followups, degraded: true });
        } else {
          frame(ctl, { type: "error", error: "The tutor is busy right now — too many questions at once. Give it a few seconds and ask again." });
        }
        ctl.close();
        return;
      }

      frame(ctl, { type: "done", followups, degraded: false });
      ctl.close();
    },
  });

  return new Response(body, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

function shuffleOptions(opts: string[], answer: number, seed: number) {
  const idx = opts.map((_, i) => i);
  // deterministic per-question shuffle — models overwhelmingly put the correct
  // option first, and a fixed position teaches students the wrong reflex
  for (let i = idx.length - 1; i > 0; i--) {
    const j = (seed * (i + 7) + 13) % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return { options: idx.map((i) => opts[i]), answer: idx.indexOf(answer) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const mode = String(body?.mode ?? "chat");
    const subjectId = String(body?.subject_id ?? "");
    if (!subjectId) return jsonResponse({ error: "subject_id is required" }, 400);
    if (rateLimited(user.id, mode === "chat" ? 20 : 10)) {
      return jsonResponse({ error: "You're going fast — give me a few seconds and ask again." }, 429);
    }

    const subjectName = String(body?.subject_name ?? "this subject").slice(0, 120);
    const unit = Number.isInteger(body?.unit) ? Number(body.unit) : null;
    const topic = body?.topic ? String(body.topic).slice(0, 120) : null;
    const scope = `${subjectName}${unit ? ` — Unit ${unit}` : ""}${topic ? ` (${topic})` : ""}`;

    // Retrieval runs as the STUDENT, so locked answers stay withheld.
    const authHeader = req.headers.get("Authorization") ?? "";
    const db = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    // ── GRADE — score a written recall answer against the real answer ──────
    if (mode === "grade") {
      const question = String(body?.question ?? "").slice(0, 600);
      const written = String(body?.answer ?? "").trim().slice(0, 4000);
      if (!question || written.length < 2) return jsonResponse({ error: "Nothing to grade" }, 400);

      // Retrieve on the QUESTION alone. Folding the student's own answer into
      // the query skewed retrieval toward whatever they happened to write, so a
      // wrong answer pulled up the wrong reference and was then graded against
      // it — worst feedback exactly when they needed it to be right.
      const sourceId = body?.source_id ? String(body.source_id) : null;
      const r = await retrieve(db, subjectId, question, unit, 6);
      const exact = sourceId ? r.passages.filter((p) => p.qaId === sourceId) : [];
      const reference = (exact.length ? exact : r.passages)
        .slice(0, 4).map((p) => p.text).join("\n\n").slice(0, 5000);

      if (!reference) return jsonResponse({ error: "That question's answer isn't unlocked yet." }, 403);

      if (GROQ_KEYS) {
        const res = await groq({
          model: MODEL,
          temperature: 0.2,
          max_tokens: 700,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You grade a student's written exam answer against the official answer. Be fair but honest — this is exam practice, not encouragement.
Reply ONLY with JSON:
{"score":0-100,"verdict":"one short sentence, second person","hits":["point they got right"],"misses":["point they missed that the official answer makes"],"tip":"one concrete thing to do next"}
Judge on substance, not wording or length. Ignore spelling. 2-4 items per list. If they wrote nothing meaningful, score it low and say so kindly.`,
            },
            {
              role: "user",
              content: `QUESTION\n${question}\n\nOFFICIAL ANSWER\n${reference}\n\nSTUDENT'S ANSWER\n${written}`,
            },
          ],
        }, { userId: user.id });

        const raw = res?.choices?.[0]?.message?.content ?? "";
        try {
          const j = JSON.parse(raw);
          return jsonResponse({
            score: Math.max(0, Math.min(100, Math.round(Number(j.score) || 0))),
            verdict: String(j.verdict ?? "").slice(0, 300),
            hits: (Array.isArray(j.hits) ? j.hits : []).slice(0, 5).map((s: unknown) => String(s).slice(0, 200)),
            misses: (Array.isArray(j.misses) ? j.misses : []).slice(0, 5).map((s: unknown) => String(s).slice(0, 200)),
            tip: String(j.tip ?? "").slice(0, 240),
            model_answer: reference.slice(0, 4000),
            degraded: false,
          });
        } catch { /* fall through to the deterministic grader */ }
      }

      // No model (or unparseable) — term overlap is crude but honest, and it
      // keeps the drill usable rather than dead-ending the student.
      const ref = new Set(terms(reference));
      const got = new Set(terms(written));
      let overlap = 0;
      for (const t of ref) if (got.has(t)) overlap++;
      const score = ref.size ? Math.min(100, Math.round((overlap / ref.size) * 145)) : 0;
      return jsonResponse({
        score,
        verdict: score >= 70 ? "Solid — you covered most of the key terms." : score >= 40 ? "Half there — you're missing several key points." : "Thin — read the answer below and try again.",
        hits: [], misses: [],
        tip: "Compare yours against the answer below and note what you left out.",
        model_answer: reference.slice(0, 4000),
        degraded: true,
      });
    }

    // ── QUIZ — MCQs generated strictly from retrieved material ─────────────
    if (mode === "quiz") {
      const count = Math.max(3, Math.min(Number(body?.count) || 5, 10));
      const difficulty = ["easy", "mixed", "hard"].includes(String(body?.difficulty)) ? String(body.difficulty) : "mixed";
      const r = await retrieve(db, subjectId, topic ?? String(body?.focus ?? ""), unit, 8);

      if (!r.passages.length) {
        return jsonResponse({
          error: r.lockedCount > 0
            ? "Unlock this subject to get quizzes from its answers."
            : "There's no material in this unit to build a quiz from yet.",
        }, r.lockedCount > 0 ? 403 : 404);
      }
      if (!GROQ_KEYS) return jsonResponse({ error: "The quiz generator isn't configured yet — try Recall mode." }, 503);

      const allowed = new Set(r.passages.map((p) => p.qaId));
      const idList = [...allowed].map((id, i) => `${id} = S${i + 1}`).join(", ");

      const res = await groq({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 2200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You write exam-practice MCQs from a student's own course material. Every question, every option and every explanation must come from the MATERIAL — never from outside knowledge.
Reply ONLY with JSON:
{"questions":[{"q":"...","options":["A","B","C","D"],"answer":0,"why":"one or two sentences explaining why, in the material's own terms","source":"<the source id this came from>"}]}
Rules:
- Exactly 4 options. Exactly one correct. Wrong options must be plausible and drawn from nearby ideas in the material — never silly, never "all of the above".
- Test understanding (compare, apply, distinguish), not word-matching.
- Difficulty: ${difficulty}.
- "source" must be one of these ids: ${idList}
- Write ${count} questions. No preamble, no markdown.`,
          },
          { role: "user", content: `MATERIAL (${scope})\n\n${r.contextText}` },
        ],
      }, { userId: user.id });

      const raw = res?.choices?.[0]?.message?.content ?? "";
      let parsed: unknown[] = [];
      try {
        const j = JSON.parse(raw);
        parsed = Array.isArray(j?.questions) ? j.questions : Array.isArray(j) ? j : [];
      } catch { parsed = []; }

      const byId = new Map(r.passages.map((p) => [p.qaId, p]));
      const questions = parsed
        // deno-lint-ignore no-explicit-any
        .filter((q: any) => q && typeof q.q === "string" && Array.isArray(q.options) && q.options.length === 4)
        // deno-lint-ignore no-explicit-any
        .map((q: any, i: number) => {
          const answer = Math.max(0, Math.min(3, Number(q.answer) || 0));
          const opts = q.options.map((o: unknown) => String(o).slice(0, 240));
          const s = shuffleOptions(opts, answer, i + 1);
          const sourceId = allowed.has(String(q.source)) ? String(q.source) : null;
          return {
            id: `q${i + 1}`,
            q: String(q.q).slice(0, 400),
            options: s.options,
            answer: s.answer,
            why: String(q.why ?? "").slice(0, 400),
            source_id: sourceId,
            source_q: sourceId ? byId.get(sourceId)?.question ?? null : null,
            unit: sourceId ? byId.get(sourceId)?.unit ?? unit : unit,
          };
        })
        .slice(0, count);

      if (!questions.length) return jsonResponse({ error: "Couldn't build a quiz just now — try again, or use Recall mode." }, 502);
      return jsonResponse({ questions, scope, grounding: "notes" as Grounding });
    }

    // ── CHAT — RAG first, model's own knowledge only as a labelled fallback ─
    // deno-lint-ignore no-explicit-any
    const msgs: any[] = Array.isArray(body?.messages) ? body.messages.slice(-8) : [];
    const userTurns = msgs.filter((m) => m?.role === "user").map((m) => String(m.content ?? ""));
    const last = userTurns.at(-1) ?? "";
    if (!last.trim()) return jsonResponse({ error: "No question" }, 400);

    // Small talk: answer it directly. No search, no completion, and crucially
    // no grounding badge — there is nothing to be grounded in.
    if (SMALL_TALK.test(last)) {
      const who = await studentName(user);
      return jsonResponse({
        reply: `Hey ${who}! I've read the Study-With-AI answers for ${scope}. Ask me anything from it — or say **quiz me** and I'll test you on it instead.`,
        grounding: "chat" as Grounding,
        sources: [],
        followups: ["What are the main topics here?", "Quiz me on this unit", "What should I revise first?"],
        searched: 0,
      });
    }

    // Query rewrite: a follow-up like "explain that simpler" carries no content
    // words of its own, so fold in the previous turn and the open topic.
    const searchQuery = [last, userTurns.at(-2) ?? "", topic ?? ""].join(" ").slice(0, 500);
    const r = await retrieve(db, subjectId, searchQuery, unit, 6);
    const band = bandOf(r);
    const name = await studentName(user);
    const outline = outlineOf(r.rows);
    const sources = band === "notes" || band === "mixed" ? sourceList(r) : [];

    if (!GROQ_KEYS) {
      // No model configured — retrieval alone is still genuinely useful.
      const top = r.passages[0];
      if (top) {
        return jsonResponse({
          reply: `Here's what your notes say on this — from **Unit ${top.unit}${top.topic ? ` · ${top.topic}` : ""}**:\n\n${top.text}`,
          grounding: "notes", sources, followups: followupsFrom(r, "notes"), searched: r.rows.length, degraded: true,
        });
      }
      return jsonResponse({ error: "The tutor isn't configured yet." }, 503);
    }

    const system = chatSystem(band, name, scope, r.contextText, outline);
    const history = msgs.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, 2000),
    }));

    // The passage handed over when the model says nothing usable — identical
    // in the streaming and buffered paths, so a degraded answer reads the same
    // either way.
    const top = r.passages[0];
    const passageFallback = top
      ? `I couldn't reach the model just now, but your notes cover this. From **Unit ${top.unit}${top.topic ? ` · ${top.topic}` : ""}**:\n\n${top.text}`
      : null;

    // ── Streaming ──────────────────────────────────────────────────────────
    // Opt-in per request. Anything that goes wrong before the first token
    // simply falls through to the buffered path below, so an older client, a
    // proxy that buffers, or an exhausted key never costs the student an answer.
    if (body?.stream === true) {
      const upstream = await groqStream({
        model: MODEL,
        temperature: band === "beyond" ? 0.5 : 0.3,
        max_tokens: 2000,
        stream: true,
        messages: [{ role: "system", content: system }, ...history],
      }, { userId: user.id });

      if (upstream?.body) {
        return sseChat(
          upstream,
          { grounding: band, sources, searched: r.rows.length, locked: r.lockedCount },
          passageFallback,
          followupsFrom(r, band),
        );
      }
      void logIssue("stream_unavailable", "groqStream returned no body; falling back to buffered", user.id);
    }

    const ask = (maxTokens: number, turns: typeof history) => groq({
      model: MODEL,
      temperature: band === "beyond" ? 0.5 : 0.3,
      // Headroom on purpose. gpt-oss counts its reasoning against this budget,
      // and Rex's prompts carry retrieved passages, so a tight cap can be spent
      // entirely on reasoning and return an empty completion on a 200.
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, ...turns],
    }, { userId: user.id });

    let res = await ask(2000, history);
    let reply = res?.choices?.[0]?.message?.content?.trim();

    // One retry before giving up. An empty completion is usually the reasoning
    // budget being spent before any visible token is emitted, so retry with more
    // room and only the last exchange — a shorter prompt leaves more of the
    // budget for the answer itself. This is also the case that shows up under
    // load, where a student would otherwise just see an error.
    if (!reply) {
      const choice = res?.choices?.[0];
      void logIssue(
        res ? "empty_completion_retry" : "no_provider_response_retry",
        res
          ? `finish_reason=${choice?.finish_reason ?? "?"} usage=${JSON.stringify(res?.usage ?? {})}`
          : "groqChat returned null; retrying",
        user.id,
      );
      res = await ask(3000, history.slice(-2));
      reply = res?.choices?.[0]?.message?.content?.trim();
    }
    if (!reply) {
      // A 200 with no content. gpt-oss models bill their reasoning against
      // max_tokens and return it in a separate field, so a long prompt can
      // exhaust the budget before a single visible token is emitted — the call
      // "succeeds" and says nothing. Record what actually came back.
      const choice = res?.choices?.[0];
      void logIssue(
        res ? "empty_completion" : "no_provider_response",
        res
          ? `finish_reason=${choice?.finish_reason ?? "?"} reasoning_len=${String(choice?.message?.reasoning ?? "").length} usage=${JSON.stringify(res?.usage ?? {})}`
          : "groqChat returned null after exhausting every key",
        user.id,
      );
      // Model unavailable — hand back the best passage verbatim rather than an
      // apology. The student still gets their answer.
      if (passageFallback) {
        return jsonResponse({
          reply: passageFallback,
          grounding: "notes", sources, followups: followupsFrom(r, "notes"), searched: r.rows.length, degraded: true,
        });
      }
      return jsonResponse({
        error: r.failed
          ? "I can't reach your notes right now — that's on our side, not your question. Try again in a moment."
          : "The tutor is busy right now — too many questions at once. Give it a few seconds and ask again.",
      }, 502);
    }

    return jsonResponse({
      reply,
      grounding: band,
      sources,
      followups: followupsFrom(r, band),
      searched: r.rows.length,
      locked: r.lockedCount,
      degraded: false,
    });
  } catch (err) {
    console.error("study-buddy error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
