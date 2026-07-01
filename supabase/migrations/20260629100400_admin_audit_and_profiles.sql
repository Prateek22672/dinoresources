-- =====================================================================
-- TeamDino Revamp · Phase 1.5 — Admin audit log + profile search fields
-- =====================================================================

-- ── profiles: username + full_name for admin user-search ─────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username  text,
  ADD COLUMN IF NOT EXISTS full_name text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- Admins can read every profile (for the user-search panel)
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update any profile (support edits)
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── user_roles: let admins remove roles (revoke contributor/admin) ────
DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;
CREATE POLICY "Admins delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── admin_audit_log: every privileged action ─────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action            text NOT NULL,            -- e.g. 'grant_subject', 'revoke_year', 'set_role'
  target_user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  target_year_id    uuid REFERENCES public.years(id) ON DELETE SET NULL,
  detail            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target  ON public.admin_audit_log (target_user_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins read the log; inserts happen via service-role edge functions
DROP POLICY IF EXISTS "Admins view audit log" ON public.admin_audit_log;
CREATE POLICY "Admins view audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert audit log" ON public.admin_audit_log;
CREATE POLICY "Admins insert audit log"
  ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
