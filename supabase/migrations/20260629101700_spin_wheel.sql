-- =====================================================================
-- Spin & Win — cart coupon wheel with ADMIN-CONTROLLED probabilities.
--   * spin_segments: label + percent + weight (relative probability)
--   * user_spins:    one spin per user per cooldown window
--   * spin_wheel():  SECURITY DEFINER weighted pick → mints a one-time
--                    48h coupon; odds never leave the server.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.spin_segments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label       text NOT NULL,
  percent     integer NOT NULL CHECK (percent BETWEEN 1 AND 100),
  weight      integer NOT NULL DEFAULT 1 CHECK (weight >= 0),
  active      boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.spin_segments ENABLE ROW LEVEL SECURITY;
-- Only admins touch the raw table (weights stay secret); players use the RPCs.
DROP POLICY IF EXISTS "Admins manage spin segments" ON public.spin_segments;
CREATE POLICY "Admins manage spin segments" ON public.spin_segments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.user_spins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  segment_id  uuid,
  coupon_code text,
  percent     integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_spins_user_idx ON public.user_spins (user_id, created_at DESC);

ALTER TABLE public.user_spins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own spins" ON public.user_spins;
CREATE POLICY "Read own spins" ON public.user_spins FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
-- inserts happen only inside the SECURITY DEFINER RPC

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS spin_cooldown_days integer NOT NULL DEFAULT 30;

-- Wheel face for players: labels + order only — weights are NOT exposed.
CREATE OR REPLACE FUNCTION public.spin_segments_public()
RETURNS TABLE (id uuid, label text, percent integer, order_index integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, label, percent, order_index
  FROM public.spin_segments WHERE active AND weight > 0
  ORDER BY order_index, created_at;
$$;

-- The spin: weighted pick + one-time 48h coupon, one spin per cooldown window.
CREATE OR REPLACE FUNCTION public.spin_wheel()
RETURNS TABLE (segment_id uuid, label text, percent integer, coupon_code text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  cooldown integer;
  last_spin timestamptz;
  total_w integer;
  pick integer;
  seg record;
  code text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Please sign in to spin'; END IF;

  SELECT COALESCE(a.spin_cooldown_days, 30) INTO cooldown FROM public.app_settings a LIMIT 1;
  SELECT max(us.created_at) INTO last_spin FROM public.user_spins us WHERE us.user_id = uid;
  IF last_spin IS NOT NULL AND last_spin > now() - make_interval(days => COALESCE(cooldown, 30)) THEN
    RAISE EXCEPTION 'You have already used your spin. Come back later!';
  END IF;

  SELECT COALESCE(sum(s.weight), 0) INTO total_w FROM public.spin_segments s WHERE s.active AND s.weight > 0;
  IF total_w <= 0 THEN RAISE EXCEPTION 'Spin & Win is not available right now'; END IF;

  pick := floor(random() * total_w)::integer;
  FOR seg IN SELECT * FROM public.spin_segments s WHERE s.active AND s.weight > 0 ORDER BY s.order_index, s.created_at LOOP
    pick := pick - seg.weight;
    IF pick < 0 THEN EXIT; END IF;
  END LOOP;

  code := 'SPIN' || upper(substring(md5(random()::text || clock_timestamp()::text) FOR 6));
  INSERT INTO public.coupons (code, discount_type, discount_value, active, min_amount_paise, max_redemptions, times_redeemed, expires_at)
  VALUES (code, 'percent', seg.percent, true, 0, 1, 0, now() + interval '48 hours');
  INSERT INTO public.user_spins (user_id, segment_id, coupon_code, percent)
  VALUES (uid, seg.id, code, seg.percent);

  RETURN QUERY SELECT seg.id, seg.label, seg.percent, code;
END; $$;

-- Seed a sensible default wheel (admin can retune everything).
INSERT INTO public.spin_segments (label, percent, weight, order_index)
SELECT v.label, v.percent, v.weight, v.order_index
FROM (VALUES
  ('5% OFF', 5, 55, 0),
  ('10% OFF', 10, 30, 1),
  ('15% OFF', 15, 13, 2),
  ('50% OFF', 50, 2, 3)
) AS v(label, percent, weight, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.spin_segments);

-- Feature flag so admin can switch the wheel on/off site-wide.
INSERT INTO public.feature_flags (key, label, enabled)
SELECT 'spin', 'Spin & Win (cart coupon wheel)', true
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'spin');

NOTIFY pgrst, 'reload schema';
