-- =====================================================================
-- User exam dates — power the dashboard calendar countdown.
-- Users manage their own; shown as "N days to go" alerts.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.user_exams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  title      text NOT NULL DEFAULT 'Exam',
  exam_date  date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_exams_user_idx ON public.user_exams (user_id, exam_date);

ALTER TABLE public.user_exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own exams" ON public.user_exams;
CREATE POLICY "Own exams" ON public.user_exams FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
