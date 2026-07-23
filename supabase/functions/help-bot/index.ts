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
    const history = (Array.isArray(body?.messages) ? body.messages : [])
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
      .slice(-8);
    if (!history.length) return jsonResponse({ error: "No message" }, 400);

    const db = adminClient();

    // ── Rate limit: protect the key + absorb load spikes gracefully ──
    const minuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count: recent } = await db.from("help_chats")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id).gte("created_at", minuteAgo);
    if ((recent ?? 0) > 16) {
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
- {"type":"create_ticket","category":"<one of: ${TICKET_CATEGORIES.join(", ")}>","message":"<full issue summary>"} — the server FILES IT INSTANTLY, so emit ONLY after you have asked and learned: (1) which category fits, (2) the details (subject name / payment id if relevant). Ask ONE question at a time.

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
        } else if (a?.type === "create_ticket" && TICKET_CATEGORIES.includes(a.category) && typeof a.message === "string" && a.message.trim()) {
          const { data: t, error } = await db.from("support_tickets").insert({
            user_id: user.id, category: a.category, message: a.message.trim().slice(0, 2000), contact: user.email ?? null,
          }).select("id").single();
          if (!error && t) {
            safe.push({ type: "ticket_created", id: String(t.id).slice(0, 8), label: `Ticket #${String(t.id).slice(0, 8)} filed` });
            finalReply += `\n\n✅ Done — I've raised ticket #${String(t.id).slice(0, 8)} for you. The team replies within 24 hours; ask me anytime for its status.`;
          }
        }
      } catch (e) { console.error("action validation", e); }
    }

    // Log (fire-and-forget)
    const lastUser = [...history].reverse().find((m: any) => m.role === "user");
    const rows: any[] = [];
    if (lastUser) rows.push({ user_id: user.id, role: "user", content: lastUser.content.slice(0, 4000) });
    rows.push({ user_id: user.id, role: "assistant", content: finalReply.slice(0, 4000) });
    db.from("help_chats").insert(rows).then(() => {}, () => {});

    return jsonResponse({ reply: finalReply, actions: safe });
  } catch (err) {
    console.error("help-bot error", err);
    return jsonResponse({ reply: "Something hiccuped on my side — please try again, or raise a ticket and the team will help.", actions: [] });
  }
});
