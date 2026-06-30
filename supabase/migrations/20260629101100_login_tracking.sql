-- =====================================================================
-- Login tracking + account-sharing detection (admin only).
-- One row per (user, ip, device); hits/last_seen updated on each login.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.login_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip         text NOT NULL,
  user_agent text,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen  timestamptz NOT NULL DEFAULT now(),
  hits       integer NOT NULL DEFAULT 1,
  UNIQUE (user_id, ip, user_agent)
);
CREATE INDEX IF NOT EXISTS idx_login_user ON public.login_events (user_id);

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;
-- Only admins can read; inserts/updates happen via the service-role edge function.
DROP POLICY IF EXISTS "Admins read logins" ON public.login_events;
CREATE POLICY "Admins read logins" ON public.login_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Flag accounts logging in from many IPs/devices (sharing). Admin-guarded.
CREATE OR REPLACE FUNCTION public.get_shared_accounts(_min int DEFAULT 3)
RETURNS TABLE (
  user_id uuid, email text, ip_count integer, device_count integer,
  total_logins integer, last_seen timestamptz, has_access boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT le.user_id,
         p.email,
         count(DISTINCT le.ip)::int,
         count(DISTINCT le.user_agent)::int,
         coalesce(sum(le.hits), 0)::int,
         max(le.last_seen),
         (EXISTS (SELECT 1 FROM public.user_subject_access a WHERE a.user_id = le.user_id AND a.revoked_at IS NULL)
          OR EXISTS (SELECT 1 FROM public.user_year_access y WHERE y.user_id = le.user_id AND y.revoked_at IS NULL))
  FROM public.login_events le
  LEFT JOIN public.profiles p ON p.id = le.user_id
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY le.user_id, p.email
  HAVING count(DISTINCT le.ip) >= _min OR count(DISTINCT le.user_agent) >= _min
  ORDER BY count(DISTINCT le.ip) DESC, count(DISTINCT le.user_agent) DESC;
$$;

-- Per-user IP/device detail for the admin drill-down.
CREATE OR REPLACE FUNCTION public.get_login_detail(_user_id uuid)
RETURNS TABLE (ip text, user_agent text, hits integer, first_seen timestamptz, last_seen timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT le.ip, le.user_agent, le.hits, le.first_seen, le.last_seen
  FROM public.login_events le
  WHERE public.has_role(auth.uid(), 'admin') AND le.user_id = _user_id
  ORDER BY le.last_seen DESC;
$$;
