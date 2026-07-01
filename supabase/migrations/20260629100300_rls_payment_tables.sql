-- =====================================================================
-- TeamDino Revamp · Phase 1.4 — Lock down legacy payment tables
-- subscriptions, user_subject_ownership & user_timetables currently have
-- RLS DISABLED (any user could read all payment rows). Fix that.
-- =====================================================================

ALTER TABLE public.subscriptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subject_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_timetables        ENABLE ROW LEVEL SECURITY;

-- subscriptions (legacy global premium) — owner reads own, admin reads all
DROP POLICY IF EXISTS "Users view own subscription" ON public.subscriptions;
CREATE POLICY "Users view own subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins manage subscriptions"
  ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_subject_ownership (legacy per-subject) — owner reads own, admin all
DROP POLICY IF EXISTS "Users view own ownership" ON public.user_subject_ownership;
CREATE POLICY "Users view own ownership"
  ON public.user_subject_ownership FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage ownership" ON public.user_subject_ownership;
CREATE POLICY "Admins manage ownership"
  ON public.user_subject_ownership FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_timetables — owner fully manages own
DROP POLICY IF EXISTS "Users manage own timetable" ON public.user_timetables;
CREATE POLICY "Users manage own timetable"
  ON public.user_timetables FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
