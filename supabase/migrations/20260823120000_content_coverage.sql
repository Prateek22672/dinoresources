-- =====================================================================
-- Contributor Studio · content coverage
--
-- Subjects were created in bulk and filled in opportunistically, so nobody can
-- say which ones are actually finished. Answering "what's left?" meant opening
-- every subject, every unit, every tab — which is why so much sat half-done.
--
-- This returns one row per subject with the units that ALREADY have content,
-- so the UI can show the gaps. It reports what exists rather than what is
-- missing on purpose: "missing" depends on how many units a subject has, and
-- that is a UI decision, not a database one.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.content_coverage()
RETURNS TABLE (
  subject_id     uuid,
  subject_name   text,
  year_id        uuid,
  year_name      text,
  qa_units       integer[],
  material_units integer[],
  video_units    integer[],
  qa_total       bigint,
  pyq_count      bigint,
  syllabus_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    s.id,
    s.name,
    s.year_id,
    y.name,

    -- Only answers with real substance count. A question added as a
    -- placeholder with an empty body is not coverage — it is the thing that
    -- made Study-With-AI look complete when it was not. Same 80-character
    -- floor the tutor uses to decide whether it can quote an answer.
    COALESCE((
      SELECT array_agg(DISTINCT q.unit_number ORDER BY q.unit_number)
        FROM public.subject_qa q
       WHERE q.subject_id = s.id
         AND length(btrim(coalesce(q.answer_md, ''))) >= 80
    ), '{}'),

    -- Materials live under either `unit_number` or a "Unit N" category
    -- depending on how they were uploaded; both have to count. `category` is
    -- the resource_category ENUM, so every comparison casts to text first —
    -- the regex operator does not exist for an enum, and an unknown literal
    -- like 'PYQs' would raise rather than simply not matching.
    COALESCE((
      SELECT array_agg(DISTINCT t.u ORDER BY t.u)
        FROM (
          -- "All Units Resources" is exactly that: it covers every unit.
          SELECT generate_series(1, 5) AS u
            FROM public.resources r
           WHERE r.subject_id = s.id
             AND r.category::text = 'All Units Resources'
          UNION
          SELECT COALESCE(
                   r.unit_number,
                   CASE WHEN r.category::text ~ '^Unit [1-5]$'
                        THEN substring(r.category::text from 6)::integer END
                 )
            FROM public.resources r
           WHERE r.subject_id = s.id
        ) t
       WHERE t.u IS NOT NULL
    ), '{}'),

    COALESCE((
      SELECT array_agg(DISTINCT e.unit_number ORDER BY e.unit_number)
        FROM public.subject_editorial e
       WHERE e.subject_id = s.id AND e.unit_number IS NOT NULL
    ), '{}'),

    (SELECT count(*) FROM public.subject_qa q WHERE q.subject_id = s.id),
    -- 'PYQs' is not an enum label, but the app treats it as an alias in places;
    -- comparing as text accepts it instead of raising on an unknown label.
    (SELECT count(*) FROM public.resources r
      WHERE r.subject_id = s.id AND r.category::text IN ('Previous Papers', 'PYQs')),
    (SELECT count(*) FROM public.resources r
      WHERE r.subject_id = s.id AND r.category::text = 'Syllabus')

  FROM public.subjects s
  LEFT JOIN public.years y ON y.id = s.year_id
  WHERE s.active
    -- The whole point is planning work, so contributors need it too, not just
    -- admins. Anyone else gets an empty set rather than an error.
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'contributor'))
  ORDER BY y.order_index NULLS LAST, s.order_index NULLS LAST, s.name;
$$;

REVOKE ALL ON FUNCTION public.content_coverage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.content_coverage() TO authenticated;

NOTIFY pgrst, 'reload schema';
