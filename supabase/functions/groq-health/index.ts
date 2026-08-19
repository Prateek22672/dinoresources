// groq-health — admin-only status of the configured Groq keys.
//
// Reports, per key POSITION: whether it authenticates, whether the configured
// model is available to it, and whether it is currently rate limited. The key
// values are never returned, never logged, and never leave the runtime — the
// response carries an index and a status, nothing more.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getAuthUser, userHasRole } from "../_shared/razorpay.ts";

const MAX_KEYS = 10;
const MODEL = Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-20b";

/** Mirrors _shared/groq.ts ordering so indexes line up with the error log. */
function collectKeys(): { label: string; key: string }[] {
  const out: { label: string; key: string }[] = [];
  const add = (label: string, v?: string) => {
    const t = (v ?? "").trim();
    if (t && !out.some((o) => o.key === t)) out.push({ label, key: t });
  };
  add("GROQ_API_KEY_HELP", Deno.env.get("GROQ_API_KEY_HELP"));
  add("GROQ_API_KEY", Deno.env.get("GROQ_API_KEY"));
  for (let i = 2; i <= MAX_KEYS; i++) add(`GROQ_API_KEY_${i}`, Deno.env.get(`GROQ_API_KEY_${i}`));
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!(await userHasRole(user.id, "admin"))) return jsonResponse({ error: "Forbidden" }, 403);

    const keys = collectKeys();
    // Include keys added through Admin so the count reflects what actually
    // rotates. Values are used for the ping and never returned.
    try {
      const { data } = await adminClient().rpc("ai_keys_values", { _provider: "groq" });
      for (const r of (data ?? []) as any[]) {
        const v = String(r.value ?? "").trim();
        if (v && !keys.some((k) => k.key === v)) keys.push({ label: `${r.label} (managed)`, key: v });
      }
    } catch { /* migration not applied yet — secrets alone still report */ }

    if (!keys.length) return jsonResponse({ model: MODEL, keys: [], healthy: 0, total: 0 });

    // One-token completion per key: proves auth AND that the model is usable,
    // which a /models call alone cannot.
    const results = await Promise.all(keys.map(async (k, i) => {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 12_000);
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${k.key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: "ping" }], max_tokens: 1 }),
          signal: ctl.signal,
        });
        clearTimeout(timer);
        if (res.ok) return { index: i + 1, secret: k.label, ok: true, status: 200, state: "healthy" };

        let code: string | undefined;
        try { code = JSON.parse(await res.text())?.error?.code; } catch { /* ignore */ }
        const state = res.status === 429 ? "rate_limited"
          : res.status === 401 || res.status === 403 ? "invalid_key"
          : code === "model_not_found" || code === "model_decommissioned" ? "model_unavailable"
          : "error";
        return { index: i + 1, secret: k.label, ok: false, status: res.status, state, code: code ?? null };
      } catch {
        clearTimeout(timer);
        return { index: i + 1, secret: k.label, ok: false, status: 0, state: "unreachable" };
      }
    }));

    return jsonResponse({
      model: MODEL,
      total: results.length,
      // A rate-limited key still counts as usable — it recovers within the minute.
      healthy: results.filter((r) => r.ok || r.state === "rate_limited").length,
      keys: results,
    });
  } catch (err) {
    console.error("groq-health error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
