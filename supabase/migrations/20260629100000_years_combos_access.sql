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
