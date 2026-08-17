-- =====================================================================
-- Cache for the "Similar videos" rail.
--
-- YouTube's search endpoint costs 100 quota units per call against a default
-- 10,000/day allowance -- about 100 "Find with AI" clicks per DAY across all
-- users before the feature dies until the quota resets. Suggestions for a given
-- topic barely change, so the same query gets paid for over and over.
--
-- Caching by topic collapses every repeat click for a unit onto one API call.
-- Written only by the related-videos edge function (service role); students
-- never read this table directly, so no policies are granted to authenticated.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.video_suggestion_cache (
  cache_key  text PRIMARY KEY,          -- normalised topic string
  query      text,                      -- the refined query actually searched
  source     text NOT NULL,             -- 'youtube' | 'groq'
  videos     jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_cache_updated
  ON public.video_suggestion_cache (updated_at DESC);

-- RLS on with no policies: the service role bypasses it, everyone else is
-- denied. The cache holds nothing user-specific, but there's no reason to
-- expose it either.
ALTER TABLE public.video_suggestion_cache ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
