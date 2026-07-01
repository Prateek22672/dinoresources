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
