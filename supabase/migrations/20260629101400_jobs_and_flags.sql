-- Feature flags (admin toggles which cards/features are shown)
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.feature_flags (key,label,enabled) VALUES
  ('jobs','Jobs / Placement Prep card', true),
  ('agent','Agent card (landing)', true)
ON CONFLICT (key) DO NOTHING;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read flags" ON public.feature_flags;
CREATE POLICY "Anyone read flags" ON public.feature_flags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage flags" ON public.feature_flags;
CREATE POLICY "Admins manage flags" ON public.feature_flags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Jobs / placement-prep content (PrepInsta-style): per company, sections.
CREATE TABLE IF NOT EXISTS public.job_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL DEFAULT 'General',
  section text NOT NULL CHECK (section IN ('pattern','material','questions')),
  title text NOT NULL,
  body_md text,
  url text,
  type text,                 -- pdf / link / youtube (for materials)
  order_index integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_items_company ON public.job_items (company, section, order_index);
DROP TRIGGER IF EXISTS job_items_updated_at ON public.job_items;
CREATE TRIGGER job_items_updated_at BEFORE UPDATE ON public.job_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated view jobs" ON public.job_items;
CREATE POLICY "Authenticated view jobs" ON public.job_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Contributors manage jobs" ON public.job_items;
CREATE POLICY "Contributors manage jobs" ON public.job_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'contributor') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'contributor') OR public.has_role(auth.uid(),'admin'));
