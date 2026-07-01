-- Editorial videos (per subject / unit) — contributor-added YouTube, gated by access.
CREATE TABLE IF NOT EXISTS public.subject_editorial (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  unit_number integer,
  title       text,
  youtube_url text NOT NULL,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_editorial_subject ON public.subject_editorial (subject_id, unit_number);
DROP TRIGGER IF EXISTS subject_editorial_updated_at ON public.subject_editorial;
CREATE TRIGGER subject_editorial_updated_at BEFORE UPDATE ON public.subject_editorial
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.subject_editorial ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View editorial with access" ON public.subject_editorial;
CREATE POLICY "View editorial with access" ON public.subject_editorial FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'contributor') OR public.has_subject_access(auth.uid(), subject_id));
DROP POLICY IF EXISTS "Contributors manage editorial" ON public.subject_editorial;
CREATE POLICY "Contributors manage editorial" ON public.subject_editorial FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'contributor') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'contributor') OR public.has_role(auth.uid(),'admin'));
