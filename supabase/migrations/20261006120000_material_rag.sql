-- =====================================================================
-- Rex reads the uploaded material, not just the AI-written answers.
--
-- Most students come for the notes and important questions contributors
-- upload as Drive links, so Rex now answers from the text of that material.
-- The `ingest-material` edge function downloads each file, extracts its text
-- page by page and stores it here in ~1000-char chunks with a full-text
-- index; study-buddy retrieves from it first and only falls back to
-- subject_qa when a unit has no readable material.
--
-- Access mirrors get_subject_resources: the material text IS the paid
-- content, so chunks are only ever returned to students who own the subject.
-- The tables have RLS on with no student policies — the SECURITY DEFINER
-- search RPC below is the only read path.
--
-- Apply in the dashboard SQL editor (see supabase/DEPLOY_STUDY_TUTOR.md —
-- do not `db push`). Adding an enum value inside a transaction is fine on
-- PG12+ as long as nothing here uses it in the same transaction — nothing does.
-- =====================================================================

ALTER TYPE public.resource_category ADD VALUE IF NOT EXISTS 'Important Questions';

CREATE TABLE IF NOT EXISTS public.material_chunks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id  uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  subject_id   uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  unit_number  integer,
  topic_id     uuid REFERENCES public.unit_topics(id) ON DELETE SET NULL,
  chunk_index  integer NOT NULL,
  page         integer,
  content      text NOT NULL,
  tsv          tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS idx_material_chunks_tsv  ON public.material_chunks USING gin (tsv);
CREATE INDEX IF NOT EXISTS idx_material_chunks_subj ON public.material_chunks (subject_id, unit_number);
ALTER TABLE public.material_chunks ENABLE ROW LEVEL SECURITY;

-- One row per resource: did indexing work, and if not, why. Shown to
-- contributors/admins so "Rex doesn't know this PDF" has a visible reason
-- (most often: the Drive file isn't shared as "Anyone with the link").
CREATE TABLE IF NOT EXISTS public.material_index (
  resource_id  uuid PRIMARY KEY REFERENCES public.resources(id) ON DELETE CASCADE,
  subject_id   uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  status       text NOT NULL CHECK (status IN ('ok', 'no_text', 'failed', 'unsupported')),
  pages        integer,
  chars        integer,
  chunks       integer,
  error        text,
  indexed_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.material_index ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read material index" ON public.material_index;
CREATE POLICY "staff read material index" ON public.material_index
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'contributor'));

-- ── Retrieval ──────────────────────────────────────────────────────────
-- Same tiers as search_subject_qa: ranked full-text, then word overlap, then
-- the unit's own opening chunks (a bare "quiz me" carries no query). The
-- current unit gets a boost rather than a hard filter.
CREATE OR REPLACE FUNCTION public.search_subject_material(
  _subject_id uuid,
  _query      text    DEFAULT NULL,
  _unit       integer DEFAULT NULL,
  _limit      integer DEFAULT 8
)
RETURNS TABLE (
  id          uuid,
  resource_id uuid,
  title       text,
  unit_number integer,
  topic_id    uuid,
  topic_title text,
  page        integer,
  content     text,
  rank        real
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
DECLARE
  tsq   tsquery;
  ok    boolean;
  n     integer := greatest(1, least(coalesce(_limit, 8), 16));
  words text[];
  hits  integer;
BEGIN
  ok := public.has_subject_access(auth.uid(), _subject_id);

  BEGIN
    tsq := websearch_to_tsquery('english', coalesce(_query, ''));
  EXCEPTION WHEN OTHERS THEN
    tsq := NULL;
  END;
  IF tsq IS NULL OR tsq::text = '' THEN tsq := NULL; END IF;

  -- (a) ranked full-text
  IF tsq IS NOT NULL THEN
    RETURN QUERY
    SELECT c.id, c.resource_id, r.title, c.unit_number, c.topic_id, t.title, c.page,
           CASE WHEN ok THEN c.content ELSE NULL END,
           (ts_rank(c.tsv, tsq)
            + CASE WHEN _unit IS NOT NULL AND c.unit_number = _unit THEN 0.15 ELSE 0 END)::real
      FROM public.material_chunks c
      JOIN public.resources r ON r.id = c.resource_id
      LEFT JOIN public.unit_topics t ON t.id = c.topic_id
     WHERE c.subject_id = _subject_id AND c.tsv @@ tsq
     ORDER BY 9 DESC
     LIMIT n;
    GET DIAGNOSTICS hits = ROW_COUNT;
    IF hits > 0 THEN RETURN; END IF;
  END IF;

  -- (b) word overlap
  SELECT array_agg(s.w) INTO words
    FROM unnest(regexp_split_to_array(lower(coalesce(_query, '')), '[^a-z0-9]+')) AS s(w)
   WHERE length(s.w) > 3;

  IF words IS NOT NULL AND array_length(words, 1) > 0 THEN
    RETURN QUERY
    SELECT c.id, c.resource_id, r.title, c.unit_number, c.topic_id, t.title, c.page,
           CASE WHEN ok THEN c.content ELSE NULL END,
           ((SELECT count(*) FROM unnest(words) AS s(w) WHERE lower(c.content) LIKE '%' || s.w || '%')::real
             / array_length(words, 1)
            + CASE WHEN _unit IS NOT NULL AND c.unit_number = _unit THEN 0.15 ELSE 0 END)::real
      FROM public.material_chunks c
      JOIN public.resources r ON r.id = c.resource_id
      LEFT JOIN public.unit_topics t ON t.id = c.topic_id
     WHERE c.subject_id = _subject_id
       AND EXISTS (SELECT 1 FROM unnest(words) AS s(w) WHERE lower(c.content) LIKE '%' || s.w || '%')
     ORDER BY 9 DESC
     LIMIT n;
    GET DIAGNOSTICS hits = ROW_COUNT;
    IF hits > 0 THEN RETURN; END IF;
  END IF;

  -- (c) nothing matched — the unit's material from the top
  RETURN QUERY
  SELECT c.id, c.resource_id, r.title, c.unit_number, c.topic_id, t.title, c.page,
         CASE WHEN ok THEN c.content ELSE NULL END, 0::real
    FROM public.material_chunks c
    JOIN public.resources r ON r.id = c.resource_id
    LEFT JOIN public.unit_topics t ON t.id = c.topic_id
   WHERE c.subject_id = _subject_id
     AND (_unit IS NULL OR c.unit_number = _unit)
   ORDER BY c.unit_number NULLS LAST, r.created_at, c.chunk_index
   LIMIT n;
END
$fn$;

-- SECURITY DEFINER reads past RLS, so EXECUTE must not stay on PUBLIC (anon).
REVOKE ALL ON FUNCTION public.search_subject_material(uuid, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_subject_material(uuid, text, integer, integer) TO authenticated;
