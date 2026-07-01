// groq-agent
// TeamDino's own AI agent (Groq). Handles general assistance: summarize emails
// or notes, draft replies, explain concepts. Key stays server-side.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthUser } from "../_shared/razorpay.ts";

const GROQ_KEY = Deno.env.get("GROQ_API_KEY") ?? "";

const SYSTEM = `You are TeamDino Agent, a concise, friendly assistant for students.
- When given an email or long text, summarize the key points, action items and any deadlines as tight bullets.
- When asked to draft a reply, keep it polite and brief.
- For study questions, explain simply with examples.
- Use markdown. Never invent facts you weren't given.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!GROQ_KEY) return jsonResponse({ error: "Agent not configured" }, 500);

    const { messages } = await req.json().catch(() => ({ messages: [] }));
    const msgs = Array.isArray(messages) ? messages.slice(-12) : [];
    if (!msgs.length) return jsonResponse({ error: "No messages" }, 400);

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 1024,
        messages: [{ role: "system", content: SYSTEM }, ...msgs.map((m: any) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content ?? "").slice(0, 8000),
        }))],
      }),
    });
    if (!res.ok) { const t = await res.text(); return jsonResponse({ error: `Groq error ${res.status}`, detail: t.slice(0, 200) }, 502); }
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
    return jsonResponse({ reply });
  } catch (err) {
    console.error("groq-agent error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
