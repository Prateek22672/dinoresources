-- ── Remove referral & coins feature ─────────────────────────────────────────
-- Reverts 20260726110000_referral_coins.sql and 20260726120000_award_coins_atomic.sql.
-- The referral program and coin wallet have been discontinued.

DROP FUNCTION IF EXISTS public.award_coins(uuid, integer, text);

DROP TABLE IF EXISTS public.coin_transactions;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS coins,
  DROP COLUMN IF EXISTS referral_code,
  DROP COLUMN IF EXISTS referred_by,
  DROP COLUMN IF EXISTS referral_rewarded;

ALTER TABLE public.app_settings
  DROP COLUMN IF EXISTS referral_active,
  DROP COLUMN IF EXISTS referral_referrer_coins,
  DROP COLUMN IF EXISTS referral_signup_coins,
  DROP COLUMN IF EXISTS coins_per_rupee,
  DROP COLUMN IF EXISTS coins_max_paise_per_order;

ALTER TABLE public.orders
  DROP COLUMN IF EXISTS coins_used;
