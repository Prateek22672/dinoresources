-- =====================================================================
-- Coupons — admin-managed, validated server-side, applied at checkout.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.coupons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL,
  discount_type   text NOT NULL CHECK (discount_type IN ('percent', 'flat')),
  discount_value  integer NOT NULL,           -- percent (1-100) OR paise (flat)
  active          boolean NOT NULL DEFAULT true,
  min_amount_paise integer NOT NULL DEFAULT 0,
  max_redemptions integer,                     -- null = unlimited
  times_redeemed  integer NOT NULL DEFAULT 0,
  expires_at      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_unique ON public.coupons (upper(code));

DROP TRIGGER IF EXISTS coupons_updated_at ON public.coupons;
CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
-- Only admins read/manage the raw coupon list (codes stay private; clients use the RPC).
DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orders carry the applied coupon + discount.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_paise integer NOT NULL DEFAULT 0;

-- Secure quote: validates a code for an amount and returns the discount.
-- SECURITY DEFINER so the cart can validate without reading the coupon table.
CREATE OR REPLACE FUNCTION public.coupon_quote(_code text, _amount_paise integer)
RETURNS TABLE (valid boolean, discount_paise integer, message text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons; d integer;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(trim(_code)) LIMIT 1;
  IF c.id IS NULL THEN RETURN QUERY SELECT false, 0, 'Invalid coupon code'; RETURN; END IF;
  IF NOT c.active THEN RETURN QUERY SELECT false, 0, 'This coupon is inactive'; RETURN; END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN RETURN QUERY SELECT false, 0, 'This coupon has expired'; RETURN; END IF;
  IF c.max_redemptions IS NOT NULL AND c.times_redeemed >= c.max_redemptions THEN RETURN QUERY SELECT false, 0, 'This coupon is fully redeemed'; RETURN; END IF;
  IF _amount_paise < c.min_amount_paise THEN RETURN QUERY SELECT false, 0, 'Order below the coupon minimum'; RETURN; END IF;
  IF c.discount_type = 'percent' THEN d := (_amount_paise * c.discount_value) / 100; ELSE d := c.discount_value; END IF;
  IF d > _amount_paise THEN d := _amount_paise; END IF;
  IF d < 0 THEN d := 0; END IF;
  RETURN QUERY SELECT true, d, 'Applied';
END; $$;
