-- =====================================================================
-- Cart charges — admin-managed line items added at checkout.
--   * mandatory = true  → always applied, cannot be deselected (e.g. GST)
--   * mandatory = false → optional, user can select/deselect (e.g. donation)
-- Amounts are recomputed SERVER-SIDE in create-cart-order (never trust client).
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.cart_charges (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label            text NOT NULL,
  description      text,
  kind             text NOT NULL DEFAULT 'fixed' CHECK (kind IN ('percent', 'fixed')),
  amount           integer NOT NULL DEFAULT 0,          -- percent value (e.g. 18) OR paise (e.g. 500)
  mandatory        boolean NOT NULL DEFAULT false,
  default_selected boolean NOT NULL DEFAULT true,       -- initial state for optional charges
  active           boolean NOT NULL DEFAULT true,
  order_index      integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS cart_charges_updated_at ON public.cart_charges;
CREATE TRIGGER cart_charges_updated_at BEFORE UPDATE ON public.cart_charges
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.cart_charges ENABLE ROW LEVEL SECURITY;

-- Everyone signed in can read ACTIVE charges (to show them in the cart);
-- admins can read/manage everything.
DROP POLICY IF EXISTS "Read active charges" ON public.cart_charges;
CREATE POLICY "Read active charges" ON public.cart_charges FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage charges" ON public.cart_charges;
CREATE POLICY "Admins manage charges" ON public.cart_charges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orders record the total charges + a breakdown snapshot for the receipt.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS charges_paise  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charges_detail jsonb;
