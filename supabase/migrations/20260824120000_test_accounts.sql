-- =====================================================================
-- Test accounts
--
-- Real money moved through a handful of accounts that exist only for testing
-- the checkout, and every one of those payments is counted in the earnings
-- figure on the admin dashboard. The number is therefore wrong, and wrong in
-- the direction that flatters — which is the worst way for a revenue number to
-- be wrong.
--
-- Marking an account as a test account excludes its orders from analytics.
-- Nothing is deleted: the orders, the receipts and the access all stay exactly
-- as they are, because they are real records of real transactions. This only
-- changes whether they are counted as business revenue.
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_test IS
  'Excluded from admin analytics (revenue, payment counts, signups). Set by admins only.';

-- Analytics scans orders and filters by user, so an index on the flag itself
-- is useless — what matters is finding the (few) test users quickly.
CREATE INDEX IF NOT EXISTS idx_profiles_is_test ON public.profiles (id) WHERE is_test;

-- Students can already update their own profile row, which would let anyone
-- mark themselves as a test account and vanish from the numbers. This trigger
-- makes the column admin-only regardless of which policy allowed the UPDATE.
CREATE OR REPLACE FUNCTION public.guard_is_test()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_test IS DISTINCT FROM OLD.is_test
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change is_test';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS profiles_guard_is_test ON public.profiles;
CREATE TRIGGER profiles_guard_is_test
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_is_test();

-- ── Analytics source of truth ───────────────────────────────────────
-- One SECURITY DEFINER function so the exclusion rule lives in a single place.
-- Computing it client-side would mean every caller had to remember to filter,
-- and the first one that forgot would silently report inflated revenue again.
CREATE OR REPLACE FUNCTION public.admin_revenue_stats()
RETURNS TABLE (
  revenue_total    bigint,
  revenue_month    bigint,
  revenue_today    bigint,
  payments_count   bigint,
  payments_month   bigint,
  payments_today   bigint,
  discounts_total  bigint,
  excluded_orders  bigint,
  excluded_revenue bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH paid AS (
    SELECT o.amount_paise, o.discount_paise, o.created_at,
           COALESCE(p.is_test, false) AS is_test
      FROM public.orders o
      LEFT JOIN public.profiles p ON p.id = o.user_id
     WHERE o.status = 'paid'
       AND public.has_role(auth.uid(), 'admin')
  ),
  real_orders AS (SELECT * FROM paid WHERE NOT is_test)
  SELECT
    COALESCE(SUM(amount_paise), 0)::bigint,
    COALESCE(SUM(amount_paise) FILTER (WHERE created_at >= date_trunc('month', now())), 0)::bigint,
    COALESCE(SUM(amount_paise) FILTER (WHERE created_at >= date_trunc('day', now())), 0)::bigint,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now()))::bigint,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::bigint,
    COALESCE(SUM(discount_paise), 0)::bigint,
    (SELECT COUNT(*) FROM paid WHERE is_test)::bigint,
    (SELECT COALESCE(SUM(amount_paise), 0) FROM paid WHERE is_test)::bigint
  FROM real_orders;
$$;

REVOKE ALL ON FUNCTION public.admin_revenue_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_revenue_stats() TO authenticated;

NOTIFY pgrst, 'reload schema';
