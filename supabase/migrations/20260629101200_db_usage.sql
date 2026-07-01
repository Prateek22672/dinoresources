-- =====================================================================
-- DB usage introspection + safe cleanup (admin only).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_db_size()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.has_role(auth.uid(), 'admin')
              THEN pg_database_size(current_database()) ELSE 0 END;
$$;

CREATE OR REPLACE FUNCTION public.get_db_usage()
RETURNS TABLE (table_name text, total_bytes bigint, row_estimate bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.relname::text,
         pg_total_relation_size(c.oid)::bigint,
         GREATEST(c.reltuples, 0)::bigint
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND public.has_role(auth.uid(), 'admin')
  ORDER BY pg_total_relation_size(c.oid) DESC;
$$;

-- What is safe to clean (counts only)
CREATE OR REPLACE FUNCTION public.get_cleanup_suggestions()
RETURNS TABLE (key text, label text, hint text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM (VALUES
    ('stale_orders', 'Abandoned / failed checkouts',
     'Orders that were started but never paid (status created/failed) older than 1 day. Safe to delete — they granted no access.',
     (SELECT count(*) FROM public.orders WHERE status IN ('created','failed') AND created_at < now() - interval '1 day')),
    ('old_logins', 'Old login records',
     'Login-tracking rows not seen in 90+ days. Safe to delete (keeps recent sharing detection intact).',
     (SELECT count(*) FROM public.login_events WHERE last_seen < now() - interval '90 days')),
    ('revoked_access', 'Revoked subject grants',
     'Subject-access rows you already revoked. Deleting removes the history but frees rows.',
     (SELECT count(*) FROM public.user_subject_access WHERE revoked_at IS NOT NULL)),
    ('revoked_year', 'Revoked combo grants',
     'Combo-access rows you already revoked.',
     (SELECT count(*) FROM public.user_year_access WHERE revoked_at IS NOT NULL))
  ) AS t(key, label, hint, count)
  WHERE public.has_role(auth.uid(), 'admin');
$$;

-- Execute a cleanup; returns rows deleted. Admin only.
CREATE OR REPLACE FUNCTION public.run_cleanup(_key text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _key = 'stale_orders' THEN
    WITH d AS (DELETE FROM public.orders WHERE status IN ('created','failed') AND created_at < now() - interval '1 day' RETURNING 1) SELECT count(*) INTO n FROM d;
  ELSIF _key = 'old_logins' THEN
    WITH d AS (DELETE FROM public.login_events WHERE last_seen < now() - interval '90 days' RETURNING 1) SELECT count(*) INTO n FROM d;
  ELSIF _key = 'revoked_access' THEN
    WITH d AS (DELETE FROM public.user_subject_access WHERE revoked_at IS NOT NULL RETURNING 1) SELECT count(*) INTO n FROM d;
  ELSIF _key = 'revoked_year' THEN
    WITH d AS (DELETE FROM public.user_year_access WHERE revoked_at IS NOT NULL RETURNING 1) SELECT count(*) INTO n FROM d;
  ELSE
    RAISE EXCEPTION 'unknown cleanup key';
  END IF;
  RETURN n;
END; $$;
