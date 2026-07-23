-- =====================================================================
-- 1) Admin notices — message one user or everyone (info/warning/critical)
-- 2) Help bot — admin-controlled "brain" + logged chats
-- 3) Hardened DB cleanup v2 — whitelisted, disposable data ONLY
-- =====================================================================

-- ── 1) Notices ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_notices (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid,                                   -- NULL = broadcast to all users
  title      text NOT NULL,
  body       text,
  kind       text NOT NULL DEFAULT 'info' CHECK (kind IN ('info','warning','critical')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS user_notices_target_idx ON public.user_notices (user_id, created_at DESC);

ALTER TABLE public.user_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read own or broadcast notices" ON public.user_notices;
CREATE POLICY "Read own or broadcast notices" ON public.user_notices FOR SELECT TO authenticated
  USING ((user_id = auth.uid() OR user_id IS NULL) AND (expires_at IS NULL OR expires_at > now())
         OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins manage notices" ON public.user_notices;
CREATE POLICY "Admins manage notices" ON public.user_notices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.notice_reads (
  notice_id uuid NOT NULL REFERENCES public.user_notices(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL,
  read_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notice_id, user_id)
);
ALTER TABLE public.notice_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own reads" ON public.notice_reads;
CREATE POLICY "Own reads" ON public.notice_reads FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 2) Help bot ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.help_chats (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  role       text NOT NULL CHECK (role IN ('user','assistant')),
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS help_chats_user_idx ON public.help_chats (user_id, created_at DESC);

ALTER TABLE public.help_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own help chats" ON public.help_chats;
CREATE POLICY "Own help chats" ON public.help_chats FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins delete help chats" ON public.help_chats;
CREATE POLICY "Admins delete help chats" ON public.help_chats FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
-- inserts happen via the service-role edge function only

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS helpbot_prompt text NOT NULL DEFAULT
'You are DinoBot, the friendly TeamDino support assistant for GITAM students. TeamDino sells subject packs (notes, PYQs, Study-With-AI) as single subjects or year combos, paid via Razorpay. Free tools: SGPA calculator (/sgpa-calc) and attendance calculator (/attendance-calc). Help with: how to buy, payment problems, locked subjects, login/account issues, and finding content. If you cannot fully resolve an issue (especially payment or access problems), tell the user to tap "Raise a ticket" so the team can help within 24 hours. Be concise and warm. Never invent refund policies or promises.';

INSERT INTO public.feature_flags (key, label, enabled)
SELECT 'helpbot', 'Help Bot (chat support)', true
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'helpbot');

-- ── 3) Cleanup v2 — ONLY disposable data, never content/payments ───
-- Whitelisted targets: unpaid stale orders, old login events, old help
-- chats, expired notices, ancient audit logs, long-resolved tickets.
CREATE OR REPLACE FUNCTION public.get_cleanup_suggestions_v2()
RETURNS TABLE (key text, label text, hint text, count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'abandoned_orders', 'Abandoned checkouts (7d+)',
         'Orders started but never paid, older than a week. Paid orders are NEVER touched.',
         (SELECT count(*) FROM public.orders WHERE status = 'created' AND created_at < now() - interval '7 days')
  UNION ALL
  SELECT 'old_login_events', 'Login events (90d+)',
         'Old sign-in logs. Recent ones are kept for account-sharing detection.',
         (SELECT count(*) FROM public.login_events WHERE last_seen < now() - interval '90 days')
  UNION ALL
  SELECT 'old_help_chats', 'Help-bot chats (30d+)',
         'Support chat history older than a month. Tickets are NOT affected.',
         (SELECT count(*) FROM public.help_chats WHERE created_at < now() - interval '30 days')
  UNION ALL
  SELECT 'expired_notices', 'Expired notices',
         'Announcements past their expiry date.',
         (SELECT count(*) FROM public.user_notices WHERE expires_at IS NOT NULL AND expires_at < now())
  UNION ALL
  SELECT 'old_audit_log', 'Admin audit log (180d+)',
         'Very old admin action logs. Recent history stays intact.',
         (SELECT count(*) FROM public.admin_audit_log WHERE created_at < now() - interval '180 days')
  UNION ALL
  SELECT 'resolved_tickets', 'Resolved tickets (90d+)',
         'Support tickets resolved more than 3 months ago.',
         (SELECT count(*) FROM public.support_tickets WHERE status = 'resolved' AND updated_at < now() - interval '90 days');
$$;

CREATE OR REPLACE FUNCTION public.run_cleanup_v2(_key text)
RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n bigint := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;

  IF _key = 'abandoned_orders' THEN
    DELETE FROM public.order_items WHERE order_id IN
      (SELECT id FROM public.orders WHERE status = 'created' AND created_at < now() - interval '7 days');
    DELETE FROM public.orders WHERE status = 'created' AND created_at < now() - interval '7 days';
    GET DIAGNOSTICS n = ROW_COUNT;
  ELSIF _key = 'old_login_events' THEN
    DELETE FROM public.login_events WHERE last_seen < now() - interval '90 days';
    GET DIAGNOSTICS n = ROW_COUNT;
  ELSIF _key = 'old_help_chats' THEN
    DELETE FROM public.help_chats WHERE created_at < now() - interval '30 days';
    GET DIAGNOSTICS n = ROW_COUNT;
  ELSIF _key = 'expired_notices' THEN
    DELETE FROM public.user_notices WHERE expires_at IS NOT NULL AND expires_at < now();
    GET DIAGNOSTICS n = ROW_COUNT;
  ELSIF _key = 'old_audit_log' THEN
    DELETE FROM public.admin_audit_log WHERE created_at < now() - interval '180 days';
    GET DIAGNOSTICS n = ROW_COUNT;
  ELSIF _key = 'resolved_tickets' THEN
    DELETE FROM public.support_tickets WHERE status = 'resolved' AND updated_at < now() - interval '90 days';
    GET DIAGNOSTICS n = ROW_COUNT;
  ELSE
    RAISE EXCEPTION 'Unknown cleanup key: %', _key;  -- whitelist: nothing else can EVER be deleted
  END IF;
  RETURN n;
END; $$;

NOTIFY pgrst, 'reload schema';
