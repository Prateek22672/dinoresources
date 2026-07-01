// related-videos
// Groq refines a focused YouTube search query for the topic, then (if a
// YOUTUBE_API_KEY secret is set) the YouTube Data API returns REAL videos that
// play in-site. Without the YT key it falls back to Groq title suggestions.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthUser } from "../_shared/razorpay.ts";

const GROQ_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const YT_KEY = Deno.env.get("YOUTUBE_API_KEY") ?? "";

async function groqQuery(topic: string): Promise<string> {
  if (!GROQ_KEY) return topic;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", temperature: 0.3,
        messages: [
          { role: "system", content: "Return ONLY a single concise YouTube search query (no quotes) that finds the best student tutorial videos for the topic. Max 8 words." },
          { role: "user", content: topic },
        ],
      }),
    });
    if (!res.ok) return topic;
    const d = await res.json();
    return (d.choices?.[0]?.message?.content ?? topic).trim().replace(/^["']|["']$/g, "").slice(0, 120) || topic;
  } catch { return topic; }
}

async function groqSuggestions(topic: string) {
  if (!GROQ_KEY) return [];
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Reply ONLY JSON {\"videos\":[{\"title\":\"...\",\"channel\":\"...\",\"query\":\"youtube search query\"}]} with 6 real-sounding educational videos." },
          { role: "user", content: `Related study videos for: ${topic}` },
        ],
      }),
    });
    if (!res.ok) return [];
    const d = await res.json();
    const parsed = JSON.parse(d.choices?.[0]?.message?.content ?? "{}");
    return (Array.isArray(parsed.videos) ? parsed.videos : []).slice(0, 6);
  } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { topic } = await req.json().catch(() => ({ topic: "" }));
    const t = (topic || "study").toString().slice(0, 200);
    const query = await groqQuery(t);

    if (YT_KEY) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&safeSearch=moderate&videoEmbeddable=true&q=${encodeURIComponent(query)}&key=${YT_KEY}`;
      const r = await fetch(url);
      if (r.ok) {
        const d = await r.json();
        const videos = (d.items ?? []).map((it: any) => ({
          videoId: it.id?.videoId,
          title: it.snippet?.title ?? "Video",
          channel: it.snippet?.channelTitle ?? "",
          thumbnail: it.snippet?.thumbnails?.medium?.url ?? it.snippet?.thumbnails?.default?.url ?? null,
        })).filter((v: any) => v.videoId);
        return jsonResponse({ videos, source: "youtube", query });
      }
      const err = await r.text();
      console.error("YouTube API error", r.status, err.slice(0, 200));
      // fall through to groq suggestions
    }

    const sugg = (await groqSuggestions(t)).map((v: any) => ({
      title: String(v.title ?? "Related video").slice(0, 160),
      channel: String(v.channel ?? "").slice(0, 80),
      query: String(v.query ?? v.title ?? t).slice(0, 160),
    }));
    return jsonResponse({ videos: sugg, source: "groq", query });
  } catch (err) {
    console.error("related-videos error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
