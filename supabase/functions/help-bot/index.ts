// help-bot v2 — agentic TeamDino assistant.
// The model returns a strict {reply, actions[]} envelope. Every action is
// validated server-side against whitelists + the live catalog before it ever
// reaches the client; create_ticket is EXECUTED here (service role).
// Resilience: per-user rate limit, 20s timeout + retry, JSON-repair fallback —
// bad model output degrades to plain text, never a crash.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getAuthUser } from "../_shared/razorpay.ts";

const GROQ_KEY = Deno.env.get("GROQ_API_KEY_HELP") ?? Deno.env.get("GROQ_API_KEY") ?? "";
const MODEL = "llama-3.3-70b-versatile";

const TICKET_CATEGORIES = [
  "paid_not_granted", "payment_deducted_failed", "subject_not_opening",
  "materials_missing", "website_not_working", "login_account", "other",
];
const NAV_RE = /^(\/store|\/cart|\/library|\/purchases|\/sgpa-calc|\/attendance-calc|\/calc|\/jobs|\/dashboard|\/about|\/setup\?edit=true|\/subject\/[a-z0-9-]+)$/;
const ACCENTS = ["violet", "emerald", "blue", "amber", "rose"];

// In-memory sliding-window rate limit (no DB writes needed for chat).
const hits = new Map<string, number[]>();
function rateLimited(uid: string): boolean {
  const now = Date.now();
  const arr = (hits.get(uid) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(uid, arr);
  if (hits.size > 5000) hits.clear(); // memory backstop
  return arr.length > 10;
}

async function groqChat(payload: unknown): Promise<any | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20_000);
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctl.signal,
      });
      if (res.ok) return await res.json();
      if (res.status < 500) { console.error("groq", res.status, await res.text()); return null; }
    } catch (e) {
      console.error("groq attempt failed", e);
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

function parseEnvelope(text: string): { reply: string; actions: any[] } {
  try { const j = JSON.parse(text); if (j && typeof j.reply === "string") return { reply: j.reply, actions: Array.isArray(j.actions) ? j.actions : [] }; } catch { /* fall through */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try { const j = JSON.parse(m[0]); if (j && typeof j.reply === "string") return { reply: j.reply, actions: Array.isArray(j.actions) ? j.actions : [] }; } catch { /* fall through */ }
  }
  return { reply: text, actions: [] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!GROQ_KEY) return jsonResponse({ reply: "The assistant isn't configured yet — please raise a ticket instead.", actions: [] });

    const body = await req.json().catch(() => ({}));

    // ── Phase 2: user tapped "Confirm & raise" — deterministic insert, no LLM ──
    if (body?.confirm_ticket && typeof body.confirm_ticket === "object") {
      const ct = body.confirm_ticket;
      if (!TICKET_CATEGORIES.includes(ct.category) || typeof ct.message !== "string" || ct.message.trim().length < 10) {
        return jsonResponse({ reply: "That ticket looks incomplete — tell me the issue again and I'll redo it.", actions: [] });
      }
      const dbc = adminClient();
      // dedupe: identical open ticket in the last 10 minutes
      const tenMinAgo = new Date(Date.now() - 600_000).toISOString();
      const { data: dup } = await dbc.from("support_tickets").select("id")
        .eq("user_id", user.id).eq("category", ct.category).gte("created_at", tenMinAgo).limit(1);
      if (dup && dup.length) {
        return jsonResponse({ reply: `You already have a fresh ${ct.category.replaceAll("_", " ")} ticket (#${String(dup[0].id).slice(0, 8)}) — the team is on it. I won't duplicate it.`, actions: [] });
      }
      const { data: t, error } = await dbc.from("support_tickets").insert({
        user_id: user.id, category: ct.category, message: ct.message.trim().slice(0, 2000), contact: user.email ?? null,
      }).select("id").single();
      if (error || !t) return jsonResponse({ reply: "Couldn't file the ticket just now — please try again or use the manual form below.", actions: [] });
      const shortId = String(t.id).slice(0, 8);
      return jsonResponse({
        reply: `✅ Ticket #${shortId} is filed. The team replies within 24 hours — ask me anytime for its status.`,
        actions: [{ type: "ticket_created", id: shortId, label: `Ticket #${shortId} filed` }],
      });
    }
    const history = (Array.isArray(body?.messages) ? body.messages : [])
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
      .slice(-8);
    if (!history.length) return jsonResponse({ error: "No message" }, 400);

    const db = adminClient();

    // ── Rate limit: protect the key + absorb load spikes gracefully ──
    if (rateLimited(user.id)) {
      return jsonResponse({ reply: "You're going fast! ⚡ Give me a few seconds and ask again.", actions: [] });
    }

    // ── Live context: brain, catalog (with ids), flags, user's tickets ──
    const [{ data: settings }, { data: years }, { data: subjects }, { data: flags }, { data: tickets }] = await Promise.all([
      db.from("app_settings").select("helpbot_prompt").maybeSingle(),
      db.from("years").select("id, name, combo_price_paise").eq("active", true).order("order_index"),
      db.from("subjects").select("id, name, slug, price_paise, year_id").eq("active", true).order("order_index"),
      db.from("feature_flags").select("key, enabled"),
      db.from("support_tickets").select("id, category, status, created_at").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(3),
    ]);
    if ((flags ?? []).some((f: any) => f.key === "helpbot" && f.enabled === false)) {
      return jsonResponse({ error: "Help bot is currently disabled" }, 403);
    }

    const subjList = (subjects ?? []) as any[];
    const yearList = (years ?? []) as any[];
    const subjIds = new Set(subjList.map((s) => s.id));
    const yearIds = new Set(yearList.map((y) => y.id));
    const rupees = (p: number) => `₹${Math.round(p / 100)}`;

    const catalog = yearList.map((y) => {
      const subs = subjList.filter((s) => s.year_id === y.id);
      return `• ${y.name} [year_id=${y.id}] — combo ${rupees(y.combo_price_paise)}: ${
        subs.length ? subs.map((s) => `${s.name} [id=${s.id}, slug=${s.slug ?? s.id}] ${rupees(s.price_paise)}`).join("; ") : "coming soon"
      }`;
    }).join("\n");

    const ticketLines = (tickets ?? []).length
      ? (tickets ?? []).map((t: any) => `#${String(t.id).slice(0, 8)} · ${t.category} · ${t.status} · ${new Date(t.created_at).toLocaleDateString("en-IN")}`).join("\n")
      : "none";

    const system = `${settings?.helpbot_prompt ?? "You are DinoBot, the TeamDino support assistant."}

OUTPUT FORMAT — respond with MINIFIED JSON ONLY, no markdown fences:
{"reply":"<your message, plain text, under 100 words>","actions":[...]}

ACTION TYPES (max 3 per reply; the user taps a button to run each — put the exact thing they'd want next):
- {"type":"navigate","to":"<path>","label":"Open SGPA Calc"} — allowed paths: /store /cart /library /purchases /sgpa-calc /attendance-calc /jobs /dashboard /about /setup?edit=true /subject/<slug>
- {"type":"set_theme","mode":"light"|"dark","label":"Switch to light theme"}
- {"type":"set_accent","id":"violet|emerald|blue|amber|rose","label":"Make it teal"} (emerald=teal, blue=sapphire, amber=gold)
- {"type":"add_to_cart","subject_id":"<id from catalog>","label":"Add DBMS to cart"}
- {"type":"add_combo","year_id":"<year_id from catalog>","label":"Add Fourth Year combo"}
- {"type":"create_ticket","category":"<one of: ${TICKET_CATEGORIES.join(", ")}>","message":"<full issue summary quoting the user's OWN details>"} — this does NOT file anything: the user sees a review card and must tap Confirm. STRICT RULES: (1) collect info first, ONE question at a time — issue type, then specifics (subject/combo name, what happened); (2) NEVER put create_ticket in a reply that asks a question; (3) the message must contain the user's actual details (min 25 chars), never a placeholder.

RULES:
- When the user asks to do something the site can do (open a page, change theme/accent, add to cart, raise a ticket), DO IT via an action + short reply. Never say you can't.
- "Do you have an SGPA calculator?" → yes + navigate button. "Add DBMS" → add_to_cart + a navigate /cart button.
- Theme = light/dark mode; accent = the color. Both changeable — use the actions.
- Never invent subjects, prices or paths — only what's in the catalog below.
- Payment problems you cannot verify → collect info → create_ticket (category payment_deducted_failed or paid_not_granted). Never promise refunds.

LIVE CATALOG:
${catalog || "No subjects published yet."}

FREE (no login): /sgpa-calc (grades + CGPA predictor), /attendance-calc.

USER'S RECENT TICKETS (answer status questions from this):
${ticketLines}`;

    const out = await groqChat({
      model: MODEL,
      messages: [{ role: "system", content: system }, ...history],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });
    if (!out) {
      return jsonResponse({ reply: "I'm a bit overloaded right now 🥲 — try again in a few seconds, or tap **Raise a ticket** and the team will handle it.", actions: [] });
    }

    const raw = out?.choices?.[0]?.message?.content ?? "";
    const { reply, actions } = parseEnvelope(raw);

    // ── Server-side validation + execution ──
    const safe: any[] = [];
    let finalReply = reply || "How can I help?";
    for (const a of actions.slice(0, 3)) {
      try {
        if (a?.type === "navigate" && typeof a.to === "string" && NAV_RE.test(a.to)) {
          safe.push({ type: "navigate", to: a.to, label: String(a.label ?? "Open").slice(0, 40) });
        } else if (a?.type === "set_theme" && (a.mode === "light" || a.mode === "dark")) {
          safe.push({ type: "set_theme", mode: a.mode, label: String(a.label ?? `Switch to ${a.mode}`).slice(0, 40) });
        } else if (a?.type === "set_accent" && ACCENTS.includes(a.id)) {
          safe.push({ type: "set_accent", id: a.id, label: String(a.label ?? "Change accent").slice(0, 40) });
        } else if (a?.type === "add_to_cart" && subjIds.has(a.subject_id)) {
          const s = subjList.find((x) => x.id === a.subject_id);
          safe.push({ type: "add_to_cart", subject_id: a.subject_id, subject_name: s?.name ?? "Subject", label: String(a.label ?? `Add ${s?.name ?? "subject"}`).slice(0, 40) });
        } else if (a?.type === "add_combo" && yearIds.has(a.year_id)) {
          const y = yearList.find((x) => x.id === a.year_id);
          safe.push({ type: "add_combo", year_id: a.year_id, year_name: y?.name ?? "Combo", label: String(a.label ?? `Add ${y?.name ?? "combo"}`).slice(0, 40) });
        } else if (a?.type === "create_ticket" && TICKET_CATEGORIES.includes(a.category) && typeof a.message === "string") {
          // NEVER file here. Readiness gate + user confirmation card instead:
          // the ticket only exists after the user taps Confirm (phase 2 above).
          const msg = a.message.trim();
          const asksQuestion = /\?\s*$/.test(finalReply.trim());
          if (msg.length >= 25 && !asksQuestion) {
            safe.push({
              type: "confirm_ticket",
              category: a.category,
              message: msg.slice(0, 1000),
              label: "Confirm & raise ticket",
            });
          }
          // too thin or reply is still a question → drop silently; the bot's
          // clarifying question stands and no ticket is created.
        }
      } catch (e) { console.error("action validation", e); }
    }

    // Chat history lives on the user's device (localStorage) — no DB writes.
    return jsonResponse({ reply: finalReply, actions: safe });
  } catch (err) {
    console.error("help-bot error", err);
    return jsonResponse({ reply: "Something hiccuped on my side — please try again, or raise a ticket and the team will help.", actions: [] });
  }
});
