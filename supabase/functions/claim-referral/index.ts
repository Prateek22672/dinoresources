// claim-referral
// Called right after a new user signs up with ?ref=CODE. Maps them to the
// referrer and (if configured) credits the new user a welcome coin bonus.
// Idempotent: a user can only ever be referred once.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { adminClient, getAuthUser } from "../_shared/razorpay.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { code } = await req.json().catch(() => ({}));
    if (!code || typeof code !== "string") return jsonResponse({ ok: false, reason: "no code" });

    const db = adminClient();

    // program must be on
    const { data: settings } = await db.from("app_settings")
      .select("referral_active, referral_signup_coins").maybeSingle();
    if (!settings?.referral_active) return jsonResponse({ ok: false, reason: "inactive" });

    // the new user must not already be referred
    const { data: me } = await db.from("profiles").select("referred_by").eq("id", user.id).maybeSingle();
    if (me?.referred_by) return jsonResponse({ ok: false, reason: "already referred" });

    // find the referrer by code (case-insensitive), can't be yourself
    const { data: ref } = await db.from("profiles").select("id").ilike("referral_code", code.trim()).maybeSingle();
    if (!ref || ref.id === user.id) return jsonResponse({ ok: false, reason: "invalid code" });

    // map the referral
    await db.from("profiles").update({ referred_by: ref.id }).eq("id", user.id);

    // welcome bonus to the NEW user (referrer is paid later, on first purchase)
    const signupCoins = Number(settings.referral_signup_coins ?? 0);
    if (signupCoins > 0) {
      await db.rpc("award_coins", { _user: user.id, _delta: signupCoins, _reason: "referral_welcome" });
    }

    return jsonResponse({ ok: true, welcome_coins: signupCoins });
  } catch (err) {
    console.error("claim-referral error", err);
    return jsonResponse({ error: (err as Error).message ?? "Server error" }, 500);
  }
});
