// help-bot
// TeamDino support assistant ("DinoBot"). Admin controls the brain via
// app_settings.helpbot_prompt; the live subject/stream catalog is injected on
// every call so answers always reflect current content and prices.
// Token-frugal: last 8 messages only, short replies, capped max_tokens.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getAuthUser } from "../_shared/razorpay.ts";

const GROQ_KEY = Deno.env.get("GROQ_API_KEY_HELP") ?? Deno.env.get("GROQ_API_KEY") ?? "";
const MODEL = "llama-3.3-70b-versatile";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!GROQ_KEY) return jsonResponse({ error: "Help bot is not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const history = (Array.isArray(body?.messages) ? body.messages : [])
      .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-8);
    if (!history.length) return jsonResponse({ error: "No message" }, 400);

    const db = adminClient();

    const [{ data: settings }, { data: years }, { data: subjects }, { data: flags }] = await Promise.all([
      db.from("app_settings").select("helpbot_prompt").maybeSingle(),
      db.from("years").select("id, name, combo_price_paise").eq("active", true).order("order_index"),
      db.from("subjects").select("name, price_paise, year_id").eq("active", true).order("order_index"),
      db.from("feature_flags").select("key, enabled"),
    ]);
    if ((flags ?? []).some((f: any) => f.key === "helpbot" && f.enabled === false)) {
      return jsonResponse({ error: "Help bot is currently disabled" }, 403);
    }

    const rupees = (p: number) => `₹${Math.round(p / 100)}`;
    const catalog = (years ?? []).map((y: any) => {
      const subs = (subjects ?? []).filter((s: any) => s.year_id === y.id);
      return `• ${y.name} — full combo ${rupees(y.combo_price_paise)}; subjects: ${
        subs.length ? subs.map((s: any) => `${s.name} (${rupees(s.price_paise)})`).join(", ") : "coming soon"
      }`;
    }).join("\n");

    const system = `${settings?.helpbot_prompt ?? "You are DinoBot, the TeamDino support assistant."}

LIVE CATALOG (always current — quote from this, never invent subjects or prices):
${catalog || "No subjects published yet."}

FIXED FACTS:
- FREE, no login needed: SGPA calculator (/sgpa-calc), CGPA predictor and attendance calculator (/attendance-calc).
- Every paid subject includes: syllabus, 5 units of notes, Study-With-AI Q&A, editorial videos and previous year questions (PYQs).
- Buying: Store → add a single subject or a year combo to the cart → checkout with Razorpay (UPI/cards). Access unlocks instantly after payment. Coupons apply in the cart.
- Why TeamDino: everything for a GITAM student in one place — curated notes, PYQs, AI study help, placement prep — at student-friendly prices with lifetime-style access.
- If the user's problem needs the team (payment deducted but locked subject, refunds, account issues you cannot fix): tell them to tap the "Raise a ticket" button below the chat — the team replies within 24 hours. Do NOT promise refunds yourself.
- Reply in under 120 words. Be warm, direct, and specific.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: system }, ...history],
        temperature: 0.4,
        max_tokens: 400,
      }),
    });
    if (!res.ok) {
      console.error("groq error", res.status, await res.text());
      return jsonResponse({ error: "The assistant is busy — please try again in a moment." }, 502);
    }
    const out = await res.json();
    const reply: string = out?.choices?.[0]?.message?.content ?? "";
    if (!reply) return jsonResponse({ error: "No reply generated" }, 502);

    // Log (fire-and-forget) for admin visibility + DB cleanup
    const lastUser = [...history].reverse().find((m: any) => m.role === "user");
    const rows = [];
    if (lastUser) rows.push({ user_id: user.id, role: "user", content: String(lastUser.content).slice(0, 4000) });
    rows.push({ user_id: user.id, role: "assistant", content: reply.slice(0, 4000) });
    db.from("help_chats").insert(rows).then(() => {}, () => {});

    return jsonResponse({ reply });
  } catch (err) {
    console.error("help-bot error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
