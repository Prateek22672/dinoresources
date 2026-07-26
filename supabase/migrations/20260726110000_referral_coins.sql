-- ── Referral & coins wallet ────────────────────────────────────────────────
-- Coins are a non-cash reward: earned via referrals, spent as a checkout
-- discount. Admin sets every economic parameter (no code).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_rewarded boolean NOT NULL DEFAULT false;

-- unique, stable per-user referral code
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles (referral_code) WHERE referral_code IS NOT NULL;

-- backfill a code for existing users (short, uppercase, from the id)
UPDATE public.profiles
SET referral_code = upper(substr(replace(id::text, '-', ''), 1, 7))
WHERE referral_code IS NULL;

-- coin ledger (audit of every earn/spend)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON public.coin_transactions (user_id, created_at DESC);
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own coin tx" ON public.coin_transactions;
CREATE POLICY "own coin tx" ON public.coin_transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- referral config on the app_settings singleton
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS referral_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_referrer_coins integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS referral_signup_coins integer NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS coins_per_rupee integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS coins_max_paise_per_order integer NOT NULL DEFAULT 0; -- 0 = no cap
