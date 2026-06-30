-- =====================================================================
-- TeamDino Revamp · Phase 1.3 — Shopping cart, orders & order items
-- Prices are SNAPSHOTTED on order_items; the cart never carries a trusted
-- price (the edge function recomputes totals server-side at checkout).
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE public.cart_item_type AS ENUM ('subject', 'combo');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('created', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── cart_items ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type  public.cart_item_type NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  year_id    uuid REFERENCES public.years(id) ON DELETE CASCADE,
  added_at   timestamptz DEFAULT now(),
  -- exactly one target depending on item_type
  CONSTRAINT cart_item_target_chk CHECK (
    (item_type = 'subject' AND subject_id IS NOT NULL AND year_id IS NULL) OR
    (item_type = 'combo'   AND year_id   IS NOT NULL AND subject_id IS NULL)
  )
);

-- No duplicate line for the same target
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_subject_unique
  ON public.cart_items (user_id, subject_id) WHERE subject_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_year_unique
  ON public.cart_items (user_id, year_id) WHERE year_id IS NOT NULL;

-- ── orders ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id   text UNIQUE,
  razorpay_payment_id text,
  amount_paise        integer NOT NULL,
  currency            text NOT NULL DEFAULT 'INR',
  status              public.order_status NOT NULL DEFAULT 'created',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user    ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders (created_at DESC);

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── order_items ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type   public.cart_item_type NOT NULL,
  subject_id  uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  year_id     uuid REFERENCES public.years(id) ON DELETE SET NULL,
  price_paise integer NOT NULL,            -- snapshot of the charged price
  label       text                          -- human label snapshot (subject/year name)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);

-- ── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE public.cart_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- cart: user fully manages their own cart
DROP POLICY IF EXISTS "Users manage own cart" ON public.cart_items;
CREATE POLICY "Users manage own cart"
  ON public.cart_items FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- orders: user reads own; admin reads all. Writes happen via service role.
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
CREATE POLICY "Admins manage orders"
  ON public.orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
CREATE POLICY "Users view own order items"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
