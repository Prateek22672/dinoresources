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
-- Free preview: the first material in each section (subject + category), which
-- mirrors the "first resource is on us" rule the UI already promises.
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
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ranked AS (
    SELECT
      r.id, r.subject_id, r.title, r.type, r.url, r.category, r.unit_number, r.topic_id,
      (row_number() OVER (
         PARTITION BY r.subject_id, COALESCE(r.category, '')
         ORDER BY r.created_at NULLS LAST, r.id
       ) = 1) AS first_in_section
    FROM public.resources r
    WHERE r.subject_id = _subject_id
  )
  SELECT
    ranked.id,
    ranked.subject_id,
    ranked.title,
    ranked.type::text,
    CASE
      WHEN ranked.first_in_section
        OR public.has_subject_access(auth.uid(), ranked.subject_id)
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'contributor')
      THEN ranked.url
      ELSE NULL
    END AS url,
    ranked.category,
    ranked.unit_number,
    ranked.topic_id,
    ranked.first_in_section AS is_free
  FROM ranked;
$$;

GRANT EXECUTE ON FUNCTION public.get_subject_resources(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
