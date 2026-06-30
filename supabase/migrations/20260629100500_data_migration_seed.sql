-- =====================================================================
-- TeamDino Revamp · Phase 1.6 — Data migration & backfill
-- Run AFTER 100000–100400. Idempotent. (AI Study-With-AI content from
-- src/data/subjects/*.ts is seeded separately by a Node generator in a
-- later phase — this file handles only deterministic SQL backfills.)
-- =====================================================================

-- ── 1) Backfill subject slugs from names (unique-safe) ───────────────
WITH cleaned AS (
  SELECT id,
         trim(both '-' from regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g')) AS base
  FROM public.subjects
  WHERE slug IS NULL
),
numbered AS (
  SELECT id, base,
         row_number() OVER (PARTITION BY base ORDER BY id) AS rn
  FROM cleaned
)
UPDATE public.subjects s
SET slug = CASE WHEN n.rn = 1 THEN n.base ELSE n.base || '-' || n.rn END
FROM numbered n
WHERE s.id = n.id;

-- ── 2) Map subjects to year verticals from their semester ────────────
UPDATE public.subjects s
SET year_id = y.id
FROM public.years y
WHERE s.year_id IS NULL
  AND y.slug = CASE
    WHEN s.semester ~ '^[0-9]+$' THEN
      CASE
        WHEN s.semester::int IN (1, 2) THEN 'first-year'
        WHEN s.semester::int IN (3, 4) THEN 'second-year'
        WHEN s.semester::int IN (5, 6) THEN 'third-year'
        WHEN s.semester::int IN (7, 8) THEN 'fourth-year'
        ELSE 'supplementary'
      END
    ELSE 'supplementary'
  END;

-- ── 3) Migrate legacy per-subject ownership → user_subject_access ────
INSERT INTO public.user_subject_access (user_id, subject_id, source, amount_paise, created_at)
SELECT o.user_id, o.subject_id, 'purchase'::public.access_source, o.amount_paise, o.created_at
FROM public.user_subject_ownership o
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_subject_access a
  WHERE a.user_id = o.user_id AND a.subject_id = o.subject_id AND a.revoked_at IS NULL
);

-- ── 4) Migrate active legacy subscriptions → Supplementary combo ─────
INSERT INTO public.user_year_access (user_id, year_id, source, amount_paise, created_at)
SELECT s.user_id, y.id, 'combo'::public.access_source, s.amount_paise, s.created_at
FROM public.subscriptions s
JOIN public.years y ON y.slug = 'supplementary'
WHERE s.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_year_access a
    WHERE a.user_id = s.user_id AND a.year_id = y.id AND a.revoked_at IS NULL
  );

-- =====================================================================
-- SANITY CHECKS (run manually after applying — should all look right)
-- =====================================================================
-- SELECT name, slug, year_id, price_paise, active FROM public.subjects ORDER BY name;
-- SELECT slug, combo_price_paise FROM public.years ORDER BY order_index;
-- SELECT count(*) AS migrated_subject_access FROM public.user_subject_access;
-- SELECT count(*) AS migrated_year_access    FROM public.user_year_access;
-- -- RLS enabled everywhere it should be:
-- SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('years','subjects','subject_qa','cart_items','orders',
--                     'order_items','user_subject_access','user_year_access',
--                     'subscriptions','user_subject_ownership','admin_audit_log');
-- -- Access helper smoke test (replace UUIDs):
-- SELECT public.has_subject_access('<user-uuid>', '<subject-uuid>');
