// ai-keys — admin-only management of AI provider keys.
//
// The browser never touches the key store: every accessor is granted to
// service_role only, so this function is the sole path in. It checks the admin
// role server-side, and its responses NEVER include a key value — only a
// label, a 4-character tail for recognition, and metadata. A key can be added
// and used, but never read back out by anyone.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getAuthUser, userHasRole } from "../_shared/razorpay.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);
    if (!(await userHasRole(user.id, "admin"))) return jsonResponse({ error: "Forbidden" }, 403);

    const db = adminClient();
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "list");

    if (action === "add") {
      const label = String(body?.label ?? "").trim().slice(0, 60);
      const value = String(body?.value ?? "").trim();
      if (!label) return jsonResponse({ error: "Name this key so you can tell them apart." }, 400);
      if (value.length < 20) return jsonResponse({ error: "That doesn't look like a valid key." }, 400);

      const { error } = await db.rpc("ai_keys_add", { _label: label, _value: value, _provider: "groq" });
      // Never echo the value back, not even on failure.
      if (error) return jsonResponse({ error: error.message ?? "Could not save the key." }, 400);
      const { data } = await db.rpc("ai_keys_list", { _provider: "groq" });
      return jsonResponse({ ok: true, keys: data ?? [] });
    }

    if (action === "remove" || action === "toggle") {
      const id = String(body?.id ?? "");
      if (!id) return jsonResponse({ error: "Missing key id" }, 400);
      const { error } = action === "remove"
        ? await db.rpc("ai_keys_remove", { _id: id })
        : await db.rpc("ai_keys_set_active", { _id: id, _active: !!body?.active });
      if (error) return jsonResponse({ error: error.message }, 400);
      const { data } = await db.rpc("ai_keys_list", { _provider: "groq" });
      return jsonResponse({ ok: true, keys: data ?? [] });
    }

    const { data, error } = await db.rpc("ai_keys_list", { _provider: "groq" });
    if (error) return jsonResponse({ error: error.message, keys: [] }, 200);
    return jsonResponse({ keys: data ?? [] });
  } catch (err) {
    console.error("ai-keys error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
