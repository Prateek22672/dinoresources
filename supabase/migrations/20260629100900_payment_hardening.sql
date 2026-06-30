-- =====================================================================
-- Payment hardening + bypass detection
-- =====================================================================

-- 1) Close the leak: materials (resources) were world-readable by any logged-in
--    user. Gate them behind has_subject_access (admins/contributors exempt).
DROP POLICY IF EXISTS "Authenticated users can view resources" ON public.resources;
DROP POLICY IF EXISTS "View resources with access" ON public.resources;
CREATE POLICY "View resources with access"
  ON public.resources FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'contributor')
    OR public.has_subject_access(auth.uid(), subject_id)
  );

-- 2) Bypass detection — active access with NO proof of payment and not admin-granted.
--    (admin-guarded: returns nothing unless the caller is an admin)
CREATE OR REPLACE FUNCTION public.get_unverified_access()
RETURNS TABLE (kind text, access_id uuid, user_id uuid, email text, item text, source text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'subject'::text, usa.id, usa.user_id, p.email, s.name, usa.source::text, usa.created_at
  FROM public.user_subject_access usa
  JOIN public.subjects s ON s.id = usa.subject_id
  LEFT JOIN public.profiles p ON p.id = usa.user_id
  WHERE public.has_role(auth.uid(), 'admin')
    AND usa.revoked_at IS NULL
    AND usa.source <> 'admin_grant'
    AND NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = usa.order_id AND o.status = 'paid')
    AND NOT EXISTS (SELECT 1 FROM public.user_subject_ownership lo
                    WHERE lo.user_id = usa.user_id AND lo.subject_id = usa.subject_id AND lo.payment_id IS NOT NULL)
  UNION ALL
  SELECT 'combo'::text, uya.id, uya.user_id, p.email, y.name, uya.source::text, uya.created_at
  FROM public.user_year_access uya
  JOIN public.years y ON y.id = uya.year_id
  LEFT JOIN public.profiles p ON p.id = uya.user_id
  WHERE public.has_role(auth.uid(), 'admin')
    AND uya.revoked_at IS NULL
    AND uya.source <> 'admin_grant'
    AND NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = uya.order_id AND o.status = 'paid')
    AND NOT EXISTS (SELECT 1 FROM public.subscriptions sub WHERE sub.user_id = uya.user_id AND sub.status = 'active');
$$;
