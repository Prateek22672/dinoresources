// Referrer reward: the FIRST successful purchase by a referred user credits
// coins to whoever referred them. Idempotent via profiles.referral_rewarded.
// Best-effort — never throws into the payment flow.
// deno-lint-ignore no-explicit-any
export async function rewardReferrerOnFirstPurchase(db: any, buyerId: string) {
  try {
    const { data: prof } = await db.from("profiles")
      .select("referred_by, referral_rewarded").eq("id", buyerId).maybeSingle();
    if (!prof?.referred_by || prof.referral_rewarded) return;

    const { data: cfg } = await db.from("app_settings")
      .select("referral_active, referral_referrer_coins").maybeSingle();
    if (!cfg?.referral_active) return;

    const coins = Number(cfg.referral_referrer_coins ?? 0);
    if (coins > 0) {
      const { data: r } = await db.from("profiles").select("coins").eq("id", prof.referred_by).maybeSingle();
      await db.from("profiles").update({ coins: (r?.coins ?? 0) + coins }).eq("id", prof.referred_by);
      await db.from("coin_transactions").insert({ user_id: prof.referred_by, delta: coins, reason: "referral_reward" });
    }
    // mark rewarded regardless, so it can only ever fire once
    await db.from("profiles").update({ referral_rewarded: true }).eq("id", buyerId);
  } catch (_e) {
    // swallow — a reward failure must never break a paid purchase
  }
}
