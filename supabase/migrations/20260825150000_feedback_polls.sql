-- =====================================================================
-- Feedback polls
--
-- A WhatsApp-style poll the team can put in front of students to find out
-- whether a feature is actually useful, before building more of it. The
-- alternative in use so far is guessing, or reading support tickets — which
-- only ever reach us when something is broken, never when something is merely
-- pointless.
--
-- ATTRIBUTION, NOT ANONYMITY. A response carries the user_id, and admins can
-- read it. That is deliberate: anyone with database access can read this table
-- whatever the schema says, so promising anonymity in the UI would be a
-- promise the system cannot keep. The student is told plainly instead.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.polls (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question     text NOT NULL,
  -- 'single' = pick one, 'multi' = pick any. Free text is a separate flag so a
  -- choice poll can also collect a comment without needing its own kind.
  kind         text NOT NULL DEFAULT 'single' CHECK (kind IN ('single', 'multi')),
  -- [{ "id": "a", "label": "Yes, often" }, ...] — ids are stable so renaming an
  -- option later doesn't orphan the votes already cast for it.
  options      jsonb NOT NULL DEFAULT '[]'::jsonb,
  /** Invites an optional written answer under the choices. */
  allow_text   boolean NOT NULL DEFAULT false,
  text_prompt  text,
  active       boolean NOT NULL DEFAULT true,
  closes_at    timestamptz,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT polls_question_len CHECK (char_length(question) BETWEEN 3 AND 300),
  CONSTRAINT polls_options_is_array CHECK (jsonb_typeof(options) = 'array')
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- An array even for single-choice polls, so changing a poll's kind later
  -- doesn't need the stored answers migrated.
  option_ids text[] NOT NULL DEFAULT '{}',
  comment    text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- One response per student per poll. Changing your mind updates the row.
  CONSTRAINT poll_votes_one_per_user UNIQUE (poll_id, user_id),
  CONSTRAINT poll_votes_comment_len CHECK (comment IS NULL OR char_length(comment) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON public.poll_votes (poll_id);
CREATE INDEX IF NOT EXISTS idx_polls_active ON public.polls (created_at DESC) WHERE active;

ALTER TABLE public.polls      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- ── polls ────────────────────────────────────────────────────────────
-- Students see live polls only; admins see drafts and closed ones too.
DROP POLICY IF EXISTS "Read live polls" ON public.polls;
CREATE POLICY "Read live polls" ON public.polls FOR SELECT TO authenticated
  USING (
    (active AND (closes_at IS NULL OR closes_at > now()))
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Admins write polls" ON public.polls;
CREATE POLICY "Admins write polls" ON public.polls FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── poll_votes ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Read own vote" ON public.poll_votes;
CREATE POLICY "Read own vote" ON public.poll_votes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Votes may only be cast on a poll that is actually open, checked here rather
-- than in the client so a closed poll cannot be answered by replaying a request.
DROP POLICY IF EXISTS "Cast own vote" ON public.poll_votes;
CREATE POLICY "Cast own vote" ON public.poll_votes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.polls p
       WHERE p.id = poll_id AND p.active AND (p.closes_at IS NULL OR p.closes_at > now())
    )
  );

DROP POLICY IF EXISTS "Change own vote" ON public.poll_votes;
CREATE POLICY "Change own vote" ON public.poll_votes FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.polls p
       WHERE p.id = poll_id AND p.active AND (p.closes_at IS NULL OR p.closes_at > now())
    )
  );

-- ── Results ──────────────────────────────────────────────────────────
-- Aggregate only, and withheld until the caller has voted — seeing the running
-- tally first is exactly what biases the answer. Admins are exempt because
-- reading the results is the entire point for them.
CREATE OR REPLACE FUNCTION public.poll_results(_poll_id uuid)
RETURNS TABLE (option_id text, votes bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.option_id, count(v.id)::bigint
    FROM (
      SELECT jsonb_array_elements(p.options) ->> 'id' AS option_id
        FROM public.polls p WHERE p.id = _poll_id
    ) o
    LEFT JOIN public.poll_votes v
      ON v.poll_id = _poll_id AND o.option_id = ANY (v.option_ids)
   WHERE public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.poll_votes m WHERE m.poll_id = _poll_id AND m.user_id = auth.uid())
   GROUP BY o.option_id;
$$;

REVOKE ALL ON FUNCTION public.poll_results(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.poll_results(uuid) TO authenticated;

-- Admin list view: one row per poll with its response count, so the console
-- doesn't have to pull every vote just to show "42 responses".
CREATE OR REPLACE FUNCTION public.admin_poll_overview()
RETURNS TABLE (
  id uuid, question text, kind text, options jsonb, allow_text boolean,
  text_prompt text, active boolean, closes_at timestamptz,
  created_at timestamptz, responses bigint, comments bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.question, p.kind, p.options, p.allow_text,
         p.text_prompt, p.active, p.closes_at, p.created_at,
         count(v.id)::bigint,
         count(v.id) FILTER (WHERE coalesce(trim(v.comment), '') <> '')::bigint
    FROM public.polls p
    LEFT JOIN public.poll_votes v ON v.poll_id = p.id
   WHERE public.has_role(auth.uid(), 'admin')
   GROUP BY p.id
   ORDER BY p.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_poll_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_poll_overview() TO authenticated;

NOTIFY pgrst, 'reload schema';
