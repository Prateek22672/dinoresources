/**
 * Shared contract for the Study-With-AI tutor.
 *
 * The tutor is retrieval-first: the `study-buddy` edge function searches the
 * Q&A the team wrote for this subject and answers from it. `grounding` says
 * which of those two things actually happened, and the UI always shows it —
 * a student should never have to guess whether they're reading their own
 * course material or the model's general knowledge.
 */
import { supabase } from "@/integrations/supabase/client";
import { invokeFn } from "@/integrations/supabase/revamp";

/** Which face of the tutor is showing. */
export type TutorMode = "chat" | "drill" | "recall";

/**
 * A proactive offer from Rex, shown next to the launcher.
 *
 * Deliberately small and easy to ignore: it appears when a student has just
 * opened a long answer (the moment help is actually wanted), never interrupts,
 * and dismissing it buys silence rather than just hiding one bubble.
 */
export interface TutorNudge {
  /** Stable per trigger, so the same prompt is never queued twice. */
  id: string;
  text: string;
  actions: { label: string; seed?: string; mode?: TutorMode }[];
}

/** Where the answer's facts came from. */
export type Grounding = "notes" | "mixed" | "beyond" | "locked" | "empty";

/**
 * Shortest answer worth calling an answer.
 *
 * Contributors sometimes add a question as a placeholder ("Check out PYQ's and
 * Materials") with no real body. The UI used to count those as readable while
 * retrieval discarded them, so Rex would announce he had read a unit's answers
 * and then have nothing to quote — and fall through to inventing content.
 * Both sides now agree by using this one threshold.
 */
export const MIN_ANSWER_CHARS = 80;

export const hasUsableAnswer = (q: { answer_md: string | null }) =>
  (q.answer_md ?? "").trim().length >= MIN_ANSWER_CHARS;

export interface TutorSource {
  id: string;
  question: string;
  unit: number;
  topic: string | null;
}

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
  grounding?: Grounding;
  sources?: TutorSource[];
  followups?: string[];
  searched?: number;
  degraded?: boolean;
  /** Set on the newest reply so it types itself in once, then stays put. */
  fresh?: boolean;
}

export interface DrillQuestion {
  id: string;
  q: string;
  options: string[];
  answer: number;
  why: string;
  source_id: string | null;
  source_q: string | null;
  unit: number | null;
}

export interface GradeResult {
  score: number;
  verdict: string;
  hits: string[];
  misses: string[];
  tip: string;
  model_answer: string;
  degraded: boolean;
}

/** What the tutor knows about the page the student is looking at. */
export interface TutorContext {
  subjectId: string;
  subjectName: string;
  /** Unit currently open, or null on the syllabus / PYQ sections. */
  unit: number | null;
  /** Title of the topic filter the student has applied, if any. */
  topic: string | null;
  hasAccess: boolean;
  qa: TutorQa[];
  topics: { id: string; title: string }[];
}

export interface TutorQa {
  id: string;
  question: string;
  unit_number: number;
  answer_md: string | null;
  is_free: boolean;
  topic_id?: string | null;
}

export const GROUNDING_LABEL: Record<Grounding, { label: string; hint: string; tone: string }> = {
  notes: {
    label: "From your notes",
    hint: "Answered from this subject's own Study-With-AI material.",
    tone: "emerald",
  },
  mixed: {
    label: "Notes + context",
    hint: "Mostly your notes, with anything extra marked in the answer.",
    tone: "accent",
  },
  beyond: {
    label: "Beyond your syllabus",
    hint: "Your notes don't cover this — answered from general knowledge.",
    tone: "amber",
  },
  locked: {
    label: "Locked material",
    hint: "The full answer to this is in the subject you haven't unlocked.",
    tone: "zinc",
  },
  empty: {
    label: "No notes here yet",
    hint: "This unit has no Study-With-AI answers written up yet, so nothing below comes from your syllabus.",
    tone: "amber",
  },
};

/**
 * Jump the page behind the panel to a cited Q&A and open it. The tutor citing
 * a source is only half the trick — being able to tap it and land on the real
 * answer is what makes the citation worth showing.
 */
export function jumpToSource(qaId: string) {
  try {
    window.dispatchEvent(new CustomEvent("td:tutor-jump", { detail: { qaId } }));
  } catch { /* non-critical */ }
}

export interface ChatReply {
  reply: string;
  grounding: Grounding;
  sources: TutorSource[];
  followups: string[];
  searched: number;
  degraded?: boolean;
}

export async function askTutor(
  ctx: TutorContext,
  messages: { role: string; content: string }[],
): Promise<{ data: ChatReply | null; error: string | null }> {
  return invokeFn<ChatReply>("study-buddy", {
    mode: "chat",
    subject_id: ctx.subjectId,
    subject_name: ctx.subjectName,
    unit: ctx.unit ?? undefined,
    topic: ctx.topic ?? undefined,
    messages,
  });
}

// client.ts is generated ("do not edit directly"), so the endpoint is named
// again here rather than exported from it — an edit there would be lost on the
// next regeneration. The Vite vars win when present, so pointing a fork at a
// different project needs no code change. The anon key is public by design and
// already ships in the bundle.
const FN_BASE =
  (import.meta.env?.VITE_SUPABASE_URL as string | undefined) ||
  "https://yidbijzsfrwqskjzawqq.supabase.co";
const FN_ANON =
  (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpZGJpanpzZnJ3cXNranphd3FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjkyNTAsImV4cCI6MjA3NjMwNTI1MH0.8Q_wm2Z37GafNi9yFOu845PrxgtdJnMT7nQHDchdyU4";

export interface StreamHandlers {
  /** Grounding and citations, known from retrieval before the first word. */
  onMeta?: (m: { grounding: Grounding; sources: TutorSource[]; searched: number }) => void;
  onDelta?: (t: string) => void;
}

/**
 * Streaming twin of `askTutor`.
 *
 * Retrieval finishes before the model starts, so the grounding badge and the
 * source chips land immediately and the answer writes itself in underneath —
 * the student sees what Rex found while he is still explaining it, instead of
 * watching a spinner for the whole completion.
 *
 * Resolves with the same shape `askTutor` returns, so callers store the result
 * exactly as before. Any transport failure falls back to the buffered path
 * rather than costing an answer: a proxy that buffers SSE, a deployment without
 * the stream branch, or a signed-out session all still work. `data` and `error`
 * both null means the caller aborted deliberately.
 */
export async function askTutorStream(
  ctx: TutorContext,
  messages: { role: string; content: string }[],
  handlers: StreamHandlers = {},
  signal?: AbortSignal,
): Promise<{ data: ChatReply | null; error: string | null }> {
  let token: string | undefined;
  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  } catch { /* fall through */ }
  if (!token) return askTutor(ctx, messages);

  let res: Response;
  try {
    res = await fetch(`${FN_BASE}/functions/v1/study-buddy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: FN_ANON,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "chat",
        stream: true,
        subject_id: ctx.subjectId,
        subject_name: ctx.subjectName,
        unit: ctx.unit ?? undefined,
        topic: ctx.topic ?? undefined,
        messages,
      }),
      signal,
    });
  } catch {
    if (signal?.aborted) return { data: null, error: null };
    return askTutor(ctx, messages);
  }

  // The function still answers JSON when it declines to stream at all — a rate
  // limit, an empty question, no key configured. Those are real answers, not
  // transport faults, so they pass straight through.
  const ctype = res.headers.get("content-type") ?? "";
  if (!res.ok || !ctype.includes("text/event-stream") || !res.body) {
    if (ctype.includes("application/json")) {
      const j = await res.json().catch(() => null) as (ChatReply & { error?: string }) | null;
      if (j?.error) return { data: null, error: j.error };
      if (j?.reply) return { data: j, error: null };
    }
    return askTutor(ctx, messages);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let reply = "";
  let meta: { grounding: Grounding; sources: TutorSource[]; searched: number } | null = null;
  let followups: string[] = [];
  let degraded = false;
  let refused: string | null = null;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith("data:")) continue;
        const chunk = s.slice(5).trim();
        if (!chunk) continue;
        let ev: { type?: string; t?: string; error?: string; followups?: string[]; degraded?: boolean }
          & Partial<{ grounding: Grounding; sources: TutorSource[]; searched: number }>;
        try { ev = JSON.parse(chunk); } catch { continue; }
        if (ev.type === "meta") {
          meta = { grounding: ev.grounding ?? "notes", sources: ev.sources ?? [], searched: ev.searched ?? 0 };
          handlers.onMeta?.(meta);
        } else if (ev.type === "delta" && ev.t) {
          reply += ev.t;
          handlers.onDelta?.(ev.t);
        } else if (ev.type === "done") {
          followups = ev.followups ?? [];
          degraded = !!ev.degraded;
        } else if (ev.type === "error") {
          refused = ev.error ?? "The tutor is busy right now.";
        }
      }
    }
  } catch {
    if (signal?.aborted) return { data: null, error: null };
    // Broke mid-answer. Whatever already streamed is real and worth keeping;
    // only retry from scratch if nothing arrived at all.
    if (!reply.trim()) return askTutor(ctx, messages);
  }

  if (signal?.aborted) return { data: null, error: null };
  if (refused) return { data: null, error: refused };
  if (!reply.trim()) return askTutor(ctx, messages);

  return {
    data: {
      reply,
      grounding: meta?.grounding ?? "notes",
      sources: meta?.sources ?? [],
      followups,
      searched: meta?.searched ?? 0,
      degraded,
    },
    error: null,
  };
}

export async function buildDrill(
  ctx: TutorContext,
  opts: { unit: number | null; topic: string | null; count: number; difficulty: string },
): Promise<{ data: { questions: DrillQuestion[] } | null; error: string | null }> {
  return invokeFn<{ questions: DrillQuestion[] }>("study-buddy", {
    mode: "quiz",
    subject_id: ctx.subjectId,
    subject_name: ctx.subjectName,
    unit: opts.unit ?? undefined,
    topic: opts.topic ?? undefined,
    count: opts.count,
    difficulty: opts.difficulty,
  });
}

export async function gradeAnswer(
  ctx: TutorContext,
  payload: { question: string; answer: string; sourceId: string | null; unit: number | null },
): Promise<{ data: GradeResult | null; error: string | null }> {
  return invokeFn<GradeResult>("study-buddy", {
    mode: "grade",
    subject_id: ctx.subjectId,
    subject_name: ctx.subjectName,
    unit: payload.unit ?? undefined,
    question: payload.question,
    answer: payload.answer,
    source_id: payload.sourceId ?? undefined,
  });
}

/**
 * The revamp RPCs aren't in the generated Supabase types yet. Reach them
 * through a narrow structural type rather than casting the client to `any`,
 * so the call site still gets a checked shape back.
 */
type LooseRpc = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};
export const callRpc = (fn: string, args: Record<string, unknown>) =>
  (supabase as unknown as LooseRpc).rpc(fn, args);

export interface MasteryRow {
  unit_number: number | null;
  attempts: number;
  pct: number;
  last_at: string;
}

/** Score band shown on drill and recall results. Mirrors lib/readiness bands. */
export function scoreBand(pct: number): { label: string; color: string; line: string } {
  if (pct >= 85) return { label: "Exam ready", color: "#34d399", line: "You could sit this paper today." };
  if (pct >= 65) return { label: "Nearly there", color: "var(--td-accent)", line: "Solid grip — patch the gaps below." };
  if (pct >= 40) return { label: "Getting there", color: "#f59e0b", line: "The shape is right, the detail isn't yet." };
  return { label: "Needs a revisit", color: "#f87171", line: "Read the unit once more, then drill again." };
}
