// Referrer reward: the FIRST successful purchase by a referred user credits
// coins to whoever referred them. Idempotent via profiles.referral_rewarded.
// Uses the atomic award_coins RPC (single UPDATE + ledger, no race). Best-effort
// — never throws into the payment flow.
// deno-lint-ignore no-explicit-any
export async function rewardReferrerOnFirstPurchase(db: any, buyerId: string) {
  try {
    const { data: prof } = await db.from("profiles")
      .select("referred_by, referral_rewarded").eq("id", buyerId).maybeSingle();
    if (!prof?.referred_by || prof.referral_rewarded) return;

    // mark rewarded FIRST so a retry can never double-pay, then credit coins
    await db.from("profiles").update({ referral_rewarded: true }).eq("id", buyerId);

    const { data: cfg } = await db.from("app_settings")
      .select("referral_active, referral_referrer_coins").maybeSingle();
    if (!cfg?.referral_active) return;

    const coins = Number(cfg.referral_referrer_coins ?? 0);
    if (coins > 0) {
      // atomic increment via RPC — never lost under concurrency
      await db.rpc("award_coins", { _user: prof.referred_by, _delta: coins, _reason: "referral_reward" });
    }
  } catch (_e) {
    // swallow — a reward failure must never break a paid purchase
  }
}
