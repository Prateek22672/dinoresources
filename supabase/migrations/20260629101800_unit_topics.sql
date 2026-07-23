-- =====================================================================
-- Unit topics — subdivide each unit into topics; Q&A and materials can
-- attach to a topic (nullable = "General"). Contributors + admins manage.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.unit_topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  unit_number integer NOT NULL CHECK (unit_number BETWEEN 1 AND 5),
  title       text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS unit_topics_subject_unit_idx
  ON public.unit_topics (subject_id, unit_number, order_index);

ALTER TABLE public.unit_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read topics" ON public.unit_topics;
CREATE POLICY "Read topics" ON public.unit_topics FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Contributors manage topics" ON public.unit_topics;
CREATE POLICY "Contributors manage topics" ON public.unit_topics FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'contributor') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'contributor') OR public.has_role(auth.uid(), 'admin'));

-- Content attaches to a topic (nullable → shown under "General").
ALTER TABLE public.subject_qa ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.unit_topics(id) ON DELETE SET NULL;
ALTER TABLE public.resources  ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.unit_topics(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
