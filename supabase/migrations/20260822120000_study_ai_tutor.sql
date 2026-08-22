-- =====================================================================
-- Study-With-AI · AI Tutor
--
-- The tutor answers from the Q&A the team has already written (RAG) and
-- only falls back to the model's own knowledge when the question is
-- genuinely outside the syllabus. Two things have to sit in the database
-- for that to work:
--
--   1. RETRIEVAL — a full-text index over subject_qa plus a
--      SECURITY DEFINER search RPC that ranks passages for a question and,
--      exactly like get_subject_qa, withholds `answer_md` unless the row is
--      free or the caller owns the subject. The tutor therefore can never
--      quote paid material to someone who has not unlocked it.
--
--   2. MEMORY — study_attempts records how quizzes and recall drills went,
--      so the tutor can open with "you were shaky on deadlocks last time"
--      instead of a generic greeting.
-- =====================================================================

-- ── 1. Retrieval index ──────────────────────────────────────────────
-- One GIN index over question + answer. The expression must match the one
-- the search function uses, or Postgres will not use the index.
CREATE INDEX IF NOT EXISTS idx_subject_qa_fts
  ON public.subject_qa
  USING GIN (to_tsvector('english', coalesce(question, '') || ' ' || coalesce(answer_md, '')));

-- ── 2. Search RPC ───────────────────────────────────────────────────
-- Three tiers, tried in order, so a student's phrasing never yields an empty
-- context when the material plainly covers the topic:
--   a) websearch_to_tsquery full-text match, ranked
--   b) word-overlap ILIKE (catches stemming misses and very short queries)
--   c) the unit's own rows in order (a bare "quiz me" carries no query at all)
--
-- The current unit gets a ranking boost rather than a hard filter: "explain
-- deadlocks" asked from Unit 2 should still find the Unit 1 answer.
CREATE OR REPLACE FUNCTION public.search_subject_qa(
  _subject_id uuid,
  _query      text    DEFAULT NULL,
  _unit       integer DEFAULT NULL,
  _limit      integer DEFAULT 6
)
RETURNS TABLE (
  id          uuid,
  unit_number integer,
  topic_id    uuid,
  topic_title text,
  question    text,
  answer_md   text,
  is_free     boolean,
  rank        real
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
  tsq   tsquery;
  ok    boolean;
  n     integer := greatest(1, least(coalesce(_limit, 6), 12));
  words text[];
  hits  integer;
BEGIN
  ok := public.has_subject_access(auth.uid(), _subject_id);

  -- websearch_to_tsquery does not raise on user text, but guard anyway: a
  -- retrieval failure must degrade to the next tier, never to an error.
  BEGIN
    tsq := websearch_to_tsquery('english', coalesce(_query, ''));
  EXCEPTION WHEN OTHERS THEN
    tsq := NULL;
  END;
  IF tsq IS NULL OR tsq::text = '' THEN tsq := NULL; END IF;

  -- (a) ranked full-text
  IF tsq IS NOT NULL THEN
    RETURN QUERY
    SELECT q.id, q.unit_number, q.topic_id, t.title, q.question,
           CASE WHEN q.is_free OR ok THEN q.answer_md ELSE NULL END,
           q.is_free,
           (ts_rank(
              to_tsvector('english', coalesce(q.question, '') || ' ' || coalesce(q.answer_md, '')),
              tsq)
            + CASE WHEN q.question ILIKE '%' || coalesce(_query, '') || '%' THEN 0.30 ELSE 0 END
            + CASE WHEN _unit IS NOT NULL AND q.unit_number = _unit THEN 0.15 ELSE 0 END
           )::real
      FROM public.subject_qa q
      LEFT JOIN public.unit_topics t ON t.id = q.topic_id
     WHERE q.subject_id = _subject_id
       AND to_tsvector('english', coalesce(q.question, '') || ' ' || coalesce(q.answer_md, '')) @@ tsq
     ORDER BY 8 DESC
     LIMIT n;

    GET DIAGNOSTICS hits = ROW_COUNT;
    IF hits > 0 THEN RETURN; END IF;
  END IF;

  -- (b) word overlap — score is the fraction of the student's own words found
  SELECT array_agg(s.w) INTO words
    FROM unnest(regexp_split_to_array(lower(coalesce(_query, '')), '[^a-z0-9]+')) AS s(w)
   WHERE length(s.w) > 3;

  IF words IS NOT NULL AND array_length(words, 1) > 0 THEN
    RETURN QUERY
    SELECT q.id, q.unit_number, q.topic_id, t.title, q.question,
           CASE WHEN q.is_free OR ok THEN q.answer_md ELSE NULL END,
           q.is_free,
           ((SELECT count(*) FROM unnest(words) AS s(w)
              WHERE lower(q.question || ' ' || coalesce(q.answer_md, '')) LIKE '%' || s.w || '%')::real
            / array_length(words, 1)
            + CASE WHEN _unit IS NOT NULL AND q.unit_number = _unit THEN 0.15 ELSE 0 END
           )::real
      FROM public.subject_qa q
      LEFT JOIN public.unit_topics t ON t.id = q.topic_id
     WHERE q.subject_id = _subject_id
       AND EXISTS (SELECT 1 FROM unnest(words) AS s(w)
                    WHERE lower(q.question || ' ' || coalesce(q.answer_md, '')) LIKE '%' || s.w || '%')
     ORDER BY 8 DESC
     LIMIT n;

    GET DIAGNOSTICS hits = ROW_COUNT;
    IF hits > 0 THEN RETURN; END IF;
  END IF;

  -- (c) no query (or nothing matched) — hand back the unit itself
  RETURN QUERY
  SELECT q.id, q.unit_number, q.topic_id, t.title, q.question,
         CASE WHEN q.is_free OR ok THEN q.answer_md ELSE NULL END,
         q.is_free, 0::real
    FROM public.subject_qa q
    LEFT JOIN public.unit_topics t ON t.id = q.topic_id
   WHERE q.subject_id = _subject_id
     AND (_unit IS NULL OR q.unit_number = _unit)
   ORDER BY q.unit_number, q.order_index
   LIMIT n;
END
$fn$;

GRANT EXECUTE ON FUNCTION public.search_subject_qa(uuid, text, integer, integer) TO authenticated;

-- ── 3. Drill history ────────────────────────────────────────────────
-- `score` is out of `total`: correct-out-of-asked for a quiz, 0..100 for a
-- graded recall answer. `detail` keeps the per-question breakdown so the
-- tutor can name the exact topics that went wrong.
CREATE TABLE IF NOT EXISTS public.study_attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id  uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  unit_number integer CHECK (unit_number IS NULL OR (unit_number >= 1 AND unit_number <= 5)),
  topic_id    uuid REFERENCES public.unit_topics(id) ON DELETE SET NULL,
  mode        text NOT NULL CHECK (mode IN ('quiz', 'recall')),
  score       integer NOT NULL DEFAULT 0,
  total       integer NOT NULL DEFAULT 0,
  detail      jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_attempts_user_subject
  ON public.study_attempts (user_id, subject_id, created_at DESC);

ALTER TABLE public.study_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own attempts" ON public.study_attempts;
CREATE POLICY "Read own attempts"
  ON public.study_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Insert own attempts" ON public.study_attempts;
CREATE POLICY "Insert own attempts"
  ON public.study_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Delete own attempts" ON public.study_attempts;
CREATE POLICY "Delete own attempts"
  ON public.study_attempts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── 4. Mastery summary ──────────────────────────────────────────────
-- Per-unit accuracy for the calling user. Drives the tutor's opening line
-- and the mastery rail in the panel.
CREATE OR REPLACE FUNCTION public.study_mastery(_subject_id uuid)
RETURNS TABLE (
  unit_number integer,
  attempts    bigint,
  pct         integer,
  last_at     timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.unit_number,
         count(*)::bigint,
         CASE WHEN sum(a.total) > 0
              THEN round(100.0 * sum(a.score) / sum(a.total))::integer
              ELSE 0 END,
         max(a.created_at)
    FROM public.study_attempts a
   WHERE a.user_id = auth.uid()
     AND a.subject_id = _subject_id
     AND a.total > 0
   GROUP BY a.unit_number
   ORDER BY a.unit_number;
$$;

GRANT EXECUTE ON FUNCTION public.study_mastery(uuid) TO authenticated;

-- ── 5. Feature flag ─────────────────────────────────────────────────
INSERT INTO public.feature_flags (key, label, enabled)
SELECT 'studyai', 'AI Tutor (Study-With-AI chat, quizzes & drills)', true
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'studyai');

NOTIFY pgrst, 'reload schema';
