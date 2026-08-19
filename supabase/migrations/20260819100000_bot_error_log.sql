-- =====================================================================
-- AI failure log + key analytics.
--
-- Until now an LLM failure surfaced only as "I'm a bit overloaded" to the
-- student and a console line in the Edge Function dashboard — so a dead model
-- went unnoticed for days. This records every provider failure so the team can
-- see what is actually breaking and which key it happened on.
--
-- SECURITY: rows record a key's POSITION (key_index) and never its value.
-- Written by the service role inside edge functions only; there is no INSERT
-- policy, so no client can forge entries. Readable by admins only.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.bot_error_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fn         text NOT NULL,               -- 'help-bot' | 'related-videos'
  status     integer,                     -- provider HTTP status
  code       text,                        -- e.g. rate_limit_exceeded, model_not_found
  message    text,                        -- redacted provider message
  key_index  integer,                     -- WHICH key (1-based), never the key
  key_count  integer,                     -- how many were configured
  user_id    uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bot_error_log_created_idx ON public.bot_error_log (created_at DESC);
CREATE INDEX IF NOT EXISTS bot_error_log_fn_idx ON public.bot_error_log (fn, created_at DESC);

ALTER TABLE public.bot_error_log ENABLE ROW LEVEL SECURITY;

-- Admins read. No INSERT/UPDATE/DELETE policy at all: only the service role
-- (edge functions) can write, and nobody can tamper with the record.
DROP POLICY IF EXISTS "Admins read bot errors" ON public.bot_error_log;
CREATE POLICY "Admins read bot errors" ON public.bot_error_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── Analytics: failures per key / per code over a window ──────────────
CREATE OR REPLACE FUNCTION public.bot_error_stats(_hours integer DEFAULT 24)
RETURNS TABLE (
  fn         text,
  key_index  integer,
  code       text,
  status     integer,
  failures   bigint,
  last_seen  timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.fn, e.key_index, e.code, e.status, count(*) AS failures, max(e.created_at) AS last_seen
  FROM public.bot_error_log e
  WHERE public.has_role(auth.uid(), 'admin')          -- admin-guarded: returns nothing otherwise
    AND e.created_at > now() - make_interval(hours => GREATEST(_hours, 1))
  GROUP BY e.fn, e.key_index, e.code, e.status
  ORDER BY failures DESC;
$$;

GRANT EXECUTE ON FUNCTION public.bot_error_stats(integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
