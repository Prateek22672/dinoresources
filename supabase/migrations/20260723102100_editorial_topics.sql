-- Editorial videos can be pinned to a topic within their unit (like Q&A and materials).
ALTER TABLE public.subject_editorial
  ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES public.unit_topics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_editorial_topic ON public.subject_editorial (topic_id);
