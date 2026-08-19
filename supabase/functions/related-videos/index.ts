// related-videos
// Groq refines a focused YouTube search query for the topic, then (if a
// YOUTUBE_API_KEY secret is set) the YouTube Data API returns REAL videos that
// play in-site. Without the YT key it falls back to Groq title suggestions.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAuthUser, adminClient } from "../_shared/razorpay.ts";
import { groqChat, groqKeyCount } from "../_shared/groq.ts";

// Key material never leaves the function runtime — see _shared/groq.ts.
const GROQ_KEYS = groqKeyCount();
const YT_KEY = Deno.env.get("YOUTUBE_API_KEY") ?? "";
// Overridable so a retired Groq model can be swapped from the dashboard.
const MODEL = Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-20b";

// A YouTube search costs 100 of the default 10,000 daily quota units, so ~100
// clicks/day for ALL users. Suggestions for a topic barely change, so serve
// them from cache and spend the quota only on genuinely new topics.
const CACHE_TTL_DAYS = 30;
const cacheKeyOf = (topic: string) => topic.toLowerCase().replace(/\s+/g, " ").trim();

/** @param ignoreTtl serve an expired entry anyway (used when YouTube refuses). */
async function readCache(key: string, ignoreTtl = false) {
  try {
    const { data } = await adminClient()
      .from("video_suggestion_cache")
      .select("videos, query, source, updated_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (!data) return null;
    const ageMs = Date.now() - new Date((data as any).updated_at).getTime();
    if (!ignoreTtl && ageMs > CACHE_TTL_DAYS * 86400_000) return null;
    // Never serve an empty result from cache — that would pin a transient
    // failure (missing key, quota exhausted) in place for the whole TTL.
    const videos = (data as any).videos;
    if (!Array.isArray(videos) || videos.length === 0) return null;
    return data as any;
  } catch (err) {
    console.error("cache read failed", err);
    return null;
  }
}

async function writeCache(key: string, query: string, source: string, videos: unknown[]) {
  if (!Array.isArray(videos) || videos.length === 0) return; // don't cache failures
  try {
    await adminClient()
      .from("video_suggestion_cache")
      .upsert({ cache_key: key, query, source, videos, updated_at: new Date().toISOString() },
              { onConflict: "cache_key" });
  } catch (err) {
    console.error("cache write failed", err);
  }
}

async function groqQuery(topic: string): Promise<string> {
  if (!GROQ_KEYS) return topic;
  const d = await groqChat({
    model: MODEL, temperature: 0.2,
    messages: [
      { role: "system", content: "Return ONLY a single concise YouTube search query (no quotes, no explanation) that finds the best real lecture/tutorial videos explaining this EXACT engineering-course topic for exam prep. Use the most specific concept name mentioned, not just the broad subject — a query that's too generic returns unrelated results. Prefer adding a word like 'explained', 'tutorial' or 'lecture'. Max 10 words." },
      { role: "user", content: topic },
    ],
  });
  if (!d) return topic;
  return (d.choices?.[0]?.message?.content ?? topic).trim().replace(/^["']|["']$/g, "").slice(0, 120) || topic;
}

async function groqSuggestions(topic: string) {
  if (!GROQ_KEYS) return [];
  const d = await groqChat({
    model: MODEL, temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Reply ONLY JSON {\"videos\":[{\"title\":\"...\",\"channel\":\"...\",\"query\":\"youtube search query\"}]} with 8 real-sounding educational videos, each with its OWN distinct, specific search query targeting a different sub-concept of the topic (not 8 copies of the same broad query)." },
      { role: "user", content: `Related study videos for: ${topic}` },
    ],
  });
  if (!d) return [];
  try {
    const parsed = JSON.parse(d.choices?.[0]?.message?.content ?? "{}");
    return (Array.isArray(parsed.videos) ? parsed.videos : []).slice(0, 8);
  } catch { return []; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { topic, refresh } = await req.json().catch(() => ({ topic: "" }));
    const t = (topic || "study").toString().slice(0, 200);

    // Serve from cache unless the caller explicitly asked to refresh.
    const key = cacheKeyOf(t);
    if (!refresh) {
      const hit = await readCache(key);
      if (hit) return jsonResponse({ videos: hit.videos, source: hit.source, query: hit.query, cached: true });
    }

    const query = await groqQuery(t);

    if (YT_KEY) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&safeSearch=moderate&videoEmbeddable=true&relevanceLanguage=en&q=${encodeURIComponent(query)}&key=${YT_KEY}`;
      const r = await fetch(url);
      if (r.ok) {
        const d = await r.json();
        const videos = (d.items ?? []).map((it: any) => ({
          videoId: it.id?.videoId,
          title: it.snippet?.title ?? "Video",
          channel: it.snippet?.channelTitle ?? "",
          thumbnail: it.snippet?.thumbnails?.medium?.url ?? it.snippet?.thumbnails?.default?.url ?? null,
        })).filter((v: any) => v.videoId);
        await writeCache(key, query, "youtube", videos);
        return jsonResponse({ videos, source: "youtube", query });
      }
      const err = await r.text();
      console.error("YouTube API error", r.status, err.slice(0, 200));
      // Quota exhaustion lands here (403 quotaExceeded). Serve a stale cache
      // entry if we have one — outdated suggestions beat an empty rail.
      const stale = await readCache(key, true);
      if (stale) return jsonResponse({ videos: stale.videos, source: stale.source, query: stale.query, cached: true, stale: true });
      // otherwise fall through to groq suggestions
    }

    const sugg = (await groqSuggestions(t)).map((v: any) => ({
      title: String(v.title ?? "Related video").slice(0, 160),
      channel: String(v.channel ?? "").slice(0, 80),
      query: String(v.query ?? v.title ?? t).slice(0, 160),
    }));
    await writeCache(key, query, "groq", sugg);
    return jsonResponse({ videos: sugg, source: "groq", query });
  } catch (err) {
    console.error("related-videos error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
