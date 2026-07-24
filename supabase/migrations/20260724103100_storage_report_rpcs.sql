CREATE OR REPLACE FUNCTION public.get_storage_report()
RETURNS TABLE(table_name text, row_count bigint, total_bytes bigint, pretty_size text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  RETURN QUERY
  SELECT t.tbl AS table_name,
         (SELECT reltuples::bigint FROM pg_class WHERE oid = ('public.'||t.tbl)::regclass) AS row_count,
         pg_total_relation_size(('public.'||t.tbl)::regclass) AS total_bytes,
         pg_size_pretty(pg_total_relation_size(('public.'||t.tbl)::regclass)) AS pretty_size
  FROM (VALUES
    ('issues'),('issue_comments'),('issue_votes'),
    ('support_tickets'),('help_chats'),
    ('announcements'),('user_notices'),('notice_reads'),
    ('user_spins'),('admin_audit_log'),('login_events')
  ) AS t(tbl)
  WHERE to_regclass('public.'||t.tbl) IS NOT NULL
  ORDER BY total_bytes DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.clear_resolved_issues()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  WITH del AS (DELETE FROM public.issues WHERE status IN ('done','dismissed','duplicate') RETURNING 1)
  SELECT count(*) INTO n FROM del;
  RETURN n;
END; $$;
