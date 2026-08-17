-- =====================================================================
-- Study With AI: questions should always be visible (so non-owners can
-- see what's covered), only the answer stays gated behind free-preview
-- or subject ownership. The existing RLS policy on subject_qa hides the
-- *entire row* for locked questions, so non-owners saw nothing at all.
--
-- Fix: expose a SECURITY DEFINER RPC that always returns every question
-- for a unit, but nulls out `answer_md` unless the row is free or the
-- caller has access to the subject. The base table + its RLS policy are
-- untouched (contributor/admin editing keeps working as before).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_subject_qa(_subject_id uuid, _unit_number integer)
RETURNS TABLE (
  id          uuid,
  subject_id  uuid,
  unit_number integer,
  topic_id    uuid,
  question    text,
  answer_md   text,
  order_index integer,
  is_free     boolean,
  created_by  uuid,
  created_at  timestamptz,
  updated_at  timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    q.id, q.subject_id, q.unit_number, q.topic_id, q.question,
    CASE
      WHEN q.is_free OR public.has_subject_access(auth.uid(), q.subject_id)
      THEN q.answer_md
      ELSE NULL
    END AS answer_md,
    q.order_index, q.is_free, q.created_by, q.created_at, q.updated_at
  FROM public.subject_qa q
  WHERE q.subject_id = _subject_id AND q.unit_number = _unit_number
  ORDER BY q.order_index ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_subject_qa(uuid, integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
