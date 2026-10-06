-- =====================================================================
-- Bundle offers: "buy 3 subjects, save X% · buy 4+, save Y%".
--
-- Admin turns the whole offer on/off and edits the tiers (Admin → Charges).
-- A tier applies when the cart holds at least `min_subjects` individual
-- subjects; full-year packs are already discounted and never count. The
-- highest qualifying tier wins (tiers don't add up).
--
-- bundle_quote() is the single source of truth: the cart calls it to show
-- the saving and create-cart-order calls it again with server prices, so a
-- client can never claim a discount the server wouldn't give.
--
-- Coupons: by default a coupon applies to what's left after the bundle
-- discount (so a spin-wheel coupon a student won still counts). Turn
-- bundle_stacks_with_coupons off and the coupon is ignored whenever a bundle
-- tier applies.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.bundle_tiers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_subjects  integer NOT NULL UNIQUE CHECK (min_subjects BETWEEN 2 AND 50),
  percent       integer NOT NULL CHECK (percent BETWEEN 1 AND 90),
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bundle_tiers ENABLE ROW LEVEL SECURITY;

-- Everyone may read the tiers (the Store and cart advertise them); only
-- admins change them.
DROP POLICY IF EXISTS "Anyone read bundle tiers" ON public.bundle_tiers;
CREATE POLICY "Anyone read bundle tiers" ON public.bundle_tiers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage bundle tiers" ON public.bundle_tiers;
CREATE POLICY "Admins manage bundle tiers" ON public.bundle_tiers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Starter tiers, matching the brief. The offer itself starts OFF.
INSERT INTO public.bundle_tiers (min_subjects, percent) VALUES (3, 10), (4, 15)
ON CONFLICT (min_subjects) DO NOTHING;

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS bundle_offers_enabled     boolean NOT NULL DEFAULT false;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS bundle_stacks_with_coupons boolean NOT NULL DEFAULT true;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bundle_discount_paise integer NOT NULL DEFAULT 0;

-- Quote for a cart holding `_subject_count` subjects worth `_subject_paise`.
-- The discount is rounded down to whole rupees so prices stay clean.
CREATE OR REPLACE FUNCTION public.bundle_quote(_subject_count integer, _subject_paise integer)
RETURNS TABLE (
  percent          integer,
  discount_paise   integer,
  min_subjects     integer,
  stacks           boolean
)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT t.percent,
         (floor(greatest(_subject_paise, 0) * t.percent / 100.0 / 100) * 100)::integer,
         t.min_subjects,
         s.bundle_stacks_with_coupons
    FROM public.app_settings s
    JOIN public.bundle_tiers t ON t.active AND t.min_subjects <= coalesce(_subject_count, 0)
   WHERE s.id AND s.bundle_offers_enabled
   ORDER BY t.min_subjects DESC
   LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.bundle_quote(integer, integer) TO anon, authenticated;
