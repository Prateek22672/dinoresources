// log-login
// Records the caller's login IP + device (server-reads the real IP from headers).
// One row per (user, ip, device); hits/last_seen bump on repeat. Service-role write.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getAuthUser } from "../_shared/razorpay.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const fwd = req.headers.get("x-forwarded-for") ?? "";
    const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
    const ua = (req.headers.get("user-agent") ?? "unknown").slice(0, 400);

    const db = adminClient();
    // upsert on (user_id, ip, user_agent): bump hits + last_seen
    const { data: existing } = await db
      .from("login_events")
      .select("id, hits")
      .eq("user_id", user.id).eq("ip", ip).eq("user_agent", ua)
      .maybeSingle();

    if (existing) {
      await db.from("login_events")
        .update({ hits: (existing.hits ?? 0) + 1, last_seen: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await db.from("login_events").insert({ user_id: user.id, ip, user_agent: ua });
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error("log-login error", err);
    return jsonResponse({ ok: false }, 200); // never block the app on logging failure
  }
});
