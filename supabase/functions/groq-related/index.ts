// groq-related
// Uses Groq (LLM) to suggest related study videos for a topic. Returns
// [{ title, channel, query }] — `query` is a YouTube search string the client
// turns into a link/embed. Key stays server-side.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthUser } from "../_shared/razorpay.ts";

const GROQ_KEY = Deno.env.get("GROQ_API_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!GROQ_KEY) return jsonResponse({ error: "Groq not configured" }, 500);

    const { topic } = await req.json().catch(() => ({ topic: "" }));
    const subject = (topic || "the subject").toString().slice(0, 200);

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-120b",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You recommend real, well-known educational YouTube videos for students. Reply ONLY with JSON: {\"videos\":[{\"title\":\"...\",\"channel\":\"...\",\"query\":\"exact youtube search query\"}]}. Give 6 items. Titles and channels should be plausible real ones; query is what a student would type to find that video." },
          { role: "user", content: `Suggest 6 related study videos for: ${subject}` },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return jsonResponse({ error: `Groq error: ${res.status}`, detail: t.slice(0, 300) }, 502);
    }
    const data = await res.json();
    let videos: any[] = [];
    try {
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
      videos = Array.isArray(parsed.videos) ? parsed.videos : Array.isArray(parsed) ? parsed : [];
    } catch { videos = []; }

    videos = videos.slice(0, 6).map((v) => ({
      title: String(v.title ?? "Related video").slice(0, 160),
      channel: String(v.channel ?? "").slice(0, 80),
      query: String(v.query ?? v.title ?? subject).slice(0, 160),
    }));

    return jsonResponse({ videos });
  } catch (err) {
    console.error("groq-related error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
