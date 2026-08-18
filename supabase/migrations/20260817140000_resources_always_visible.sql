-- =====================================================================
-- Resources (materials) should always be VISIBLE, with only the file link
-- gated -- the same treatment subject_qa got in
-- 20260817120000_qa_questions_always_visible.sql.
--
-- The RLS policy on public.resources requires subject access, so it hides
-- the ENTIRE row from a previewing student. They saw "No materials uploaded
-- yet" on units that do have materials, while UnitView already had the
-- free-preview/locked-teaser UI ready to render them.
--
-- Unlike subject_editorial (public YouTube links, opened up outright), a
-- resource's `url` IS the paid content -- a Drive/PDF link. Migration
-- 20260629100900_payment_hardening.sql deliberately closed that leak, so the
-- base table + policy stay exactly as they are. This SECURITY DEFINER RPC
-- returns every row's title/type/section so the student can see what they'd
-- get, and returns `url` only when they may actually open it.
--
-- No free material: every file stays locked until the subject is owned. The
-- free preview is carried by Study-With-AI questions and the (now entirely
-- free) video library instead.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_subject_resources(_subject_id uuid)
RETURNS TABLE (
  id          uuid,
  subject_id  uuid,
  title       text,
  type        text,
  url         text,
  category    text,
  unit_number integer,
  topic_id    uuid,
  is_free     boolean
)
-- NOTE: `type` and `category` are ENUMs (resource_type / resource_category), so
-- they are cast to text before use -- COALESCE(category, '') against the enum
-- fails with "invalid input value for enum resource_category". Columns are
-- aliased away from the RETURNS TABLE names to avoid output-parameter ambiguity.
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ranked AS (
    SELECT
      r.id            AS r_id,
      r.subject_id    AS r_subject_id,
      r.title         AS r_title,
      r.type::text    AS r_type,
      r.url           AS r_url,
      r.category::text AS r_category,
      r.unit_number   AS r_unit_number,
      r.topic_id      AS r_topic_id,
      (row_number() OVER (
         PARTITION BY r.subject_id, COALESCE(r.category::text, '')
         ORDER BY r.created_at NULLS LAST, r.id
       ) = 1) AS first_in_section
    FROM public.resources r
    WHERE r.subject_id = _subject_id
  )
  SELECT
    ranked.r_id,
    ranked.r_subject_id,
    ranked.r_title,
    ranked.r_type,
    -- Materials are paid content start to finish: no free-preview file. Titles
    -- and types are still returned so a student can see what a subject contains
    -- before buying; only the link is withheld.
    CASE
      WHEN public.has_subject_access(auth.uid(), ranked.r_subject_id)
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'contributor')
      THEN ranked.r_url
      ELSE NULL
    END,
    ranked.r_category,
    ranked.r_unit_number,
    ranked.r_topic_id,
    false
  FROM ranked;
$$;

GRANT EXECUTE ON FUNCTION public.get_subject_resources(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
