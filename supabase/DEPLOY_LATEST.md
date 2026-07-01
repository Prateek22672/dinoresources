# 🚀 Deploy — latest features (cart charges + purchase validity + single-device)

Follow these **in order**. Step 1 alone fixes the
`Could not find the table 'public.cart_charges'` error.

> ⚠️ **Order matters:** run the **SQL (Step 1)** *before* redeploying the
> **edge functions (Step 2)**. The functions use the new columns, so they must
> exist first.

---

## ✅ Step 1 — Run the SQL (in the browser, NOT the terminal)

This creates the missing tables/columns.

1. Go to **https://supabase.com/dashboard** → your project.
2. Left sidebar → **SQL Editor** → **+ New query**.
3. Paste **everything** in the box below.
4. Click **Run** (or `Ctrl+Enter`). You should see `Success. No rows returned`.
5. Reload the TeamDino **Admin** page → the error is gone. ✅

```sql
-- ============ 1) CART CHARGES (GST / donation) ============
CREATE TABLE IF NOT EXISTS public.cart_charges (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label            text NOT NULL,
  description      text,
  kind             text NOT NULL DEFAULT 'fixed' CHECK (kind IN ('percent','fixed')),
  amount           integer NOT NULL DEFAULT 0,
  mandatory        boolean NOT NULL DEFAULT false,
  default_selected boolean NOT NULL DEFAULT true,
  active           boolean NOT NULL DEFAULT true,
  order_index      integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS cart_charges_updated_at ON public.cart_charges;
CREATE TRIGGER cart_charges_updated_at BEFORE UPDATE ON public.cart_charges
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.cart_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read active charges" ON public.cart_charges;
CREATE POLICY "Read active charges" ON public.cart_charges FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage charges" ON public.cart_charges;
CREATE POLICY "Admins manage charges" ON public.cart_charges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS charges_paise  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS charges_detail jsonb;

-- ============ 2) PURCHASE VALIDITY + SINGLE-DEVICE ============
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS purchase_validity_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS single_device boolean NOT NULL DEFAULT false;

ALTER TABLE public.user_subject_access ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.user_year_access    ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.profiles            ADD COLUMN IF NOT EXISTS session_token text;

-- Access check now ignores expired rows (existing access has expires_at = NULL = lifetime)
CREATE OR REPLACE FUNCTION public.has_subject_access(_user_id uuid, _subject_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_subject_access usa
      WHERE usa.user_id = _user_id AND usa.subject_id = _subject_id
        AND usa.revoked_at IS NULL
        AND (usa.expires_at IS NULL OR usa.expires_at > now())
    )
    OR EXISTS (
      SELECT 1 FROM public.user_year_access uya
      JOIN public.subjects s ON s.id = _subject_id
      WHERE uya.user_id = _user_id AND uya.year_id = s.year_id
        AND uya.revoked_at IS NULL
        AND (uya.expires_at IS NULL OR uya.expires_at > now())
    );
$$;

-- Make the new table visible to the API immediately
NOTIFY pgrst, 'reload schema';
```

### Verify Step 1 worked (optional)
Run this in the same SQL editor — it should return rows, no errors:
```sql
SELECT 'cart_charges' AS check, count(*) FROM public.cart_charges
UNION ALL SELECT 'orders.charges_paise', count(*) FROM information_schema.columns
  WHERE table_name='orders' AND column_name='charges_paise'
UNION ALL SELECT 'access.expires_at', count(*) FROM information_schema.columns
  WHERE table_name='user_subject_access' AND column_name='expires_at'
UNION ALL SELECT 'app_settings.single_device', count(*) FROM information_schema.columns
  WHERE table_name='app_settings' AND column_name='single_device';
```

---

## ✅ Step 2 — Redeploy the 2 edge functions (VS Code terminal)

Only needed so charges + validity actually apply **at payment time**. Run in the
**VS Code terminal** (PowerShell), from the project folder:

```powershell
# one-time setup (skip if already done before)
npx supabase login
npx supabase link --project-ref <your-project-ref>

# deploy the two updated functions
npx supabase functions deploy create-cart-order --use-api
npx supabase functions deploy verify-cart-payment --use-api
```

- `<your-project-ref>` = the part in your URL `https://<your-project-ref>.supabase.co`.
- `create-cart-order` → now adds GST/donation server-side.
- `verify-cart-payment` → now stamps the validity window on new purchases.

> Until you do Step 2, checkout still works fine on the **old** functions —
> charges just won't be added and purchases stay lifetime.

---

## ✅ Step 3 — Configure in the app (no code)

1. **Admin → Charges & GST** — add your charges:
   - *GST*: kind = `% of subtotal`, value = `18`, **Mandatory** ✓
   - *Support/donation*: kind = `₹ Fixed amount`, value = e.g. `1000` (₹10), Mandatory ✗, Pre-checked as you like
2. **Admin → Security → Purchase validity** — set days (e.g. `45`), or `0` for lifetime.
   *(Applies to new purchases only; existing access is unchanged.)*
3. **Admin → Security → Single-device login** — toggle on to stop account sharing.

---

## Notes
- The frontend is already safe if you *haven't* run this yet — it detects the
  missing columns and behaves like before (this is why the library shows your
  grants again). Running Step 1 simply switches the new features on.
- Amounts for fixed charges are stored in **paise** (100 = ₹1). The admin form
  takes rupees and converts automatically.
