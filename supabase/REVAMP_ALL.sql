-- =====================================================================
-- TeamDino Revamp — CONSOLIDATED migration (all 6 steps, in order).
-- Paste this whole file into the Supabase SQL editor and Run.
-- Safe to re-run (idempotent guards throughout).
-- =====================================================================


-- ###################################################################
-- ## 20260629100000_years_combos_access.sql
-- ###################################################################

-- =====================================================================
-- TeamDino Revamp · Phase 1.1 — Years (verticals), combos & access model
-- Run this in the Supabase SQL editor. Safe to re-run (idempotent guards).
-- =====================================================================

-- ── Enums ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.access_source AS ENUM ('purchase', 'combo', 'admin_grant');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── years: the 5 academic verticals ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.years (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  slug              text NOT NULL UNIQUE,
  order_index       integer NOT NULL DEFAULT 0,
  combo_price_paise integer NOT NULL DEFAULT 2900,   -- ₹29 default combo (admin-editable)
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Seed the 5 verticals (no-op if slugs already present)
INSERT INTO public.years (name, slug, order_index, combo_price_paise) VALUES
  ('First Year',    'first-year',    1, 2900),
  ('Second Year',   'second-year',   2, 2900),
  ('Third Year',    'third-year',    3, 2900),
  ('Fourth Year',   'fourth-year',   4, 2900),
  ('Supplementary', 'supplementary', 5, 2900)
ON CONFLICT (slug) DO NOTHING;

-- ── subjects: add combo/pricing/store columns ────────────────────────
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS year_id      uuid REFERENCES public.years(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price_paise  integer NOT NULL DEFAULT 1100,   -- ₹11 default (admin-editable)
  ADD COLUMN IF NOT EXISTS slug         text,
  ADD COLUMN IF NOT EXISTS description  text,
  ADD COLUMN IF NOT EXISTS active       boolean NOT NULL DEFAULT true;

-- Unique slug among rows that have one (backfilled in the data-migration step)
CREATE UNIQUE INDEX IF NOT EXISTS subjects_slug_unique
  ON public.subjects (slug) WHERE slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subjects_year_id ON public.subjects (year_id);

-- ── user_subject_access: replaces user_subject_ownership ─────────────
CREATE TABLE IF NOT EXISTS public.user_subject_access (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id  uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  source      public.access_source NOT NULL DEFAULT 'purchase',
  order_id    uuid,                       -- references orders(id); FK omitted to avoid migration ordering
  amount_paise integer,
  granted_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- admin who granted (if admin_grant)
  revoked_at  timestamptz,                -- NULL = active; soft revoke for reversibility/audit
  created_at  timestamptz DEFAULT now()
);

-- One active access row per (user, subject); revoked rows don't block re-grant
CREATE UNIQUE INDEX IF NOT EXISTS user_subject_access_active_unique
  ON public.user_subject_access (user_id, subject_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_usa_user ON public.user_subject_access (user_id);

-- ── user_year_access: combo / full-year ownership ────────────────────
CREATE TABLE IF NOT EXISTS public.user_year_access (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_id     uuid NOT NULL REFERENCES public.years(id) ON DELETE CASCADE,
  source      public.access_source NOT NULL DEFAULT 'combo',
  order_id    uuid,
  amount_paise integer,
  granted_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at  timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_year_access_active_unique
  ON public.user_year_access (user_id, year_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_uya_user ON public.user_year_access (user_id);

-- ── Access helper: subject OR its year-combo OR admin ────────────────
CREATE OR REPLACE FUNCTION public.has_subject_access(_user_id uuid, _subject_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_subject_access usa
      WHERE usa.user_id = _user_id
        AND usa.subject_id = _subject_id
        AND usa.revoked_at IS NULL
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_year_access uya
      JOIN public.subjects s ON s.id = _subject_id
      WHERE uya.user_id = _user_id
        AND uya.year_id = s.year_id
        AND uya.revoked_at IS NULL
    );
$$;

-- ── updated_at triggers ──────────────────────────────────────────────
DROP TRIGGER IF EXISTS years_updated_at ON public.years;
CREATE TRIGGER years_updated_at
  BEFORE UPDATE ON public.years
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE public.years               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subject_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_year_access    ENABLE ROW LEVEL SECURITY;

-- years: everyone authenticated can read; admins manage
DROP POLICY IF EXISTS "Authenticated can view years" ON public.years;
CREATE POLICY "Authenticated can view years"
  ON public.years FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage years" ON public.years;
CREATE POLICY "Admins manage years"
  ON public.years FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_subject_access: owner reads own; admin reads all; writes go through
-- service-role edge functions (which bypass RLS) so no INSERT policy for users.
DROP POLICY IF EXISTS "Users view own subject access" ON public.user_subject_access;
CREATE POLICY "Users view own subject access"
  ON public.user_subject_access FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage subject access" ON public.user_subject_access;
CREATE POLICY "Admins manage subject access"
  ON public.user_subject_access FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users view own year access" ON public.user_year_access;
CREATE POLICY "Users view own year access"
  ON public.user_year_access FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage year access" ON public.user_year_access;
CREATE POLICY "Admins manage year access"
  ON public.user_year_access FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── Subjects: admins can update/delete (combo/price/move management) ──
DROP POLICY IF EXISTS "Admins update subjects" ON public.subjects;
CREATE POLICY "Admins update subjects"
  ON public.subjects FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'contributor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'contributor'));

DROP POLICY IF EXISTS "Admins delete subjects" ON public.subjects;
CREATE POLICY "Admins delete subjects"
  ON public.subjects FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));


-- ###################################################################
-- ## 20260629100100_subject_qa.sql
-- ###################################################################

-- =====================================================================
-- TeamDino Revamp · Phase 1.2 — Study-With-AI content moved into the DB
-- Q&A pairs live per subject + unit. Paid answers are protected by RLS.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.subject_qa (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  unit_number integer NOT NULL CHECK (unit_number >= 1 AND unit_number <= 5),
  question    text NOT NULL,
  answer_md   text NOT NULL DEFAULT '',     -- markdown answer body
  order_index integer NOT NULL DEFAULT 0,
  is_free     boolean NOT NULL DEFAULT false,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subject_qa_subject_unit
  ON public.subject_qa (subject_id, unit_number, order_index);

DROP TRIGGER IF EXISTS subject_qa_updated_at ON public.subject_qa;
CREATE TRIGGER subject_qa_updated_at
  BEFORE UPDATE ON public.subject_qa
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.subject_qa ENABLE ROW LEVEL SECURITY;

-- Read: free questions are public to authenticated users; paid questions
-- require access (subject OR year combo OR admin) via has_subject_access().
DROP POLICY IF EXISTS "View qa when free or has access" ON public.subject_qa;
CREATE POLICY "View qa when free or has access"
  ON public.subject_qa FOR SELECT TO authenticated
  USING (is_free OR public.has_subject_access(auth.uid(), subject_id));

-- Write: contributors & admins
DROP POLICY IF EXISTS "Contributors insert qa" ON public.subject_qa;
CREATE POLICY "Contributors insert qa"
  ON public.subject_qa FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'contributor') OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Contributors update qa" ON public.subject_qa;
CREATE POLICY "Contributors update qa"
  ON public.subject_qa FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'contributor') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'contributor') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Contributors delete qa" ON public.subject_qa;
CREATE POLICY "Contributors delete qa"
  ON public.subject_qa FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'contributor') OR public.has_role(auth.uid(), 'admin'));


-- ###################################################################
-- ## 20260629100200_cart_orders.sql
-- ###################################################################

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


-- ###################################################################
-- ## 20260629100300_rls_payment_tables.sql
-- ###################################################################

-- =====================================================================
-- TeamDino Revamp · Phase 1.4 — Lock down legacy payment tables
-- subscriptions, user_subject_ownership & user_timetables currently have
-- RLS DISABLED (any user could read all payment rows). Fix that.
-- =====================================================================

ALTER TABLE public.subscriptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subject_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_timetables        ENABLE ROW LEVEL SECURITY;

-- subscriptions (legacy global premium) — owner reads own, admin reads all
DROP POLICY IF EXISTS "Users view own subscription" ON public.subscriptions;
CREATE POLICY "Users view own subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins manage subscriptions"
  ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_subject_ownership (legacy per-subject) — owner reads own, admin all
DROP POLICY IF EXISTS "Users view own ownership" ON public.user_subject_ownership;
CREATE POLICY "Users view own ownership"
  ON public.user_subject_ownership FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage ownership" ON public.user_subject_ownership;
CREATE POLICY "Admins manage ownership"
  ON public.user_subject_ownership FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_timetables — owner fully manages own
DROP POLICY IF EXISTS "Users manage own timetable" ON public.user_timetables;
CREATE POLICY "Users manage own timetable"
  ON public.user_timetables FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ###################################################################
-- ## 20260629100400_admin_audit_and_profiles.sql
-- ###################################################################

-- =====================================================================
-- TeamDino Revamp · Phase 1.5 — Admin audit log + profile search fields
-- =====================================================================

-- ── profiles: username + full_name for admin user-search ─────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username  text,
  ADD COLUMN IF NOT EXISTS full_name text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- Admins can read every profile (for the user-search panel)
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update any profile (support edits)
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── user_roles: let admins remove roles (revoke contributor/admin) ────
DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
CREATE POLICY "Admins delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── admin_audit_log: every privileged action ─────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action            text NOT NULL,            -- e.g. 'grant_subject', 'revoke_year', 'set_role'
  target_user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  target_year_id    uuid REFERENCES public.years(id) ON DELETE SET NULL,
  detail            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target  ON public.admin_audit_log (target_user_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins read the log; inserts happen via service-role edge functions
DROP POLICY IF EXISTS "Admins view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins view audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert audit log" ON public.admin_audit_log;
CREATE POLICY "Admins insert audit log"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- ###################################################################
-- ## 20260629100500_data_migration_seed.sql
-- ###################################################################

-- =====================================================================
-- TeamDino Revamp · Phase 1.6 — Data migration & backfill
-- Run AFTER 100000–100400. Idempotent. (AI Study-With-AI content from
-- src/data/subjects/*.ts is seeded separately by a Node generator in a
-- later phase — this file handles only deterministic SQL backfills.)
-- =====================================================================

-- ── 1) Backfill subject slugs from names (unique-safe) ───────────────
WITH cleaned AS (
  SELECT id,
         trim(both '-' from regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g')) AS base
  FROM public.subjects
  WHERE slug IS NULL
),
numbered AS (
  SELECT id, base,
         row_number() OVER (PARTITION BY base ORDER BY id) AS rn
  FROM cleaned
)
UPDATE public.subjects s
SET slug = CASE WHEN n.rn = 1 THEN n.base ELSE n.base || '-' || n.rn END
FROM numbered n
WHERE s.id = n.id;

-- ── 2) Map subjects to year verticals from their semester ────────────
UPDATE public.subjects s
SET year_id = y.id
FROM public.years y
WHERE s.year_id IS NULL
  AND y.slug = CASE
    WHEN s.semester ~ '^[0-9]+$' THEN
      CASE
        WHEN s.semester::int IN (1, 2) THEN 'first-year'
        WHEN s.semester::int IN (3, 4) THEN 'second-year'
        WHEN s.semester::int IN (5, 6) THEN 'third-year'
        WHEN s.semester::int IN (7, 8) THEN 'fourth-year'
        ELSE 'supplementary'
      END
    ELSE 'supplementary'
  END;

-- ── 3) Migrate legacy per-subject ownership → user_subject_access ────
INSERT INTO public.user_subject_access (user_id, subject_id, source, amount_paise, created_at)
SELECT o.user_id, o.subject_id, 'purchase'::public.access_source, o.amount_paise, o.created_at
FROM public.user_subject_ownership o
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_subject_access a
  WHERE a.user_id = o.user_id AND a.subject_id = o.subject_id AND a.revoked_at IS NULL
);

-- ── 4) Migrate active legacy subscriptions → Supplementary combo ─────
INSERT INTO public.user_year_access (user_id, year_id, source, amount_paise, created_at)
SELECT s.user_id, y.id, 'combo'::public.access_source, s.amount_paise, s.created_at
FROM public.subscriptions s
JOIN public.years y ON y.slug = 'supplementary'
WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_year_access a
    WHERE a.user_id = s.user_id AND a.year_id = y.id AND a.revoked_at IS NULL
  );

-- =====================================================================
-- SANITY CHECKS (run manually after applying — should all look right)
-- =====================================================================
-- SELECT name, slug, year_id, price_paise, active FROM public.subjects ORDER BY name;
-- SELECT slug, combo_price_paise FROM public.years ORDER BY order_index;
-- SELECT count(*) AS migrated_subject_access FROM public.user_subject_access;
-- SELECT count(*) AS migrated_year_access    FROM public.user_year_access;
-- -- RLS enabled everywhere it should be:
-- SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('years','subjects','subject_qa','cart_items','orders',
--                     'order_items','user_subject_access','user_year_access',
--                     'subscriptions','user_subject_ownership','admin_audit_log');
-- -- Access helper smoke test (replace UUIDs):
-- SELECT public.has_subject_access('<user-uuid>', '<subject-uuid>');

