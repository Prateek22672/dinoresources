-- =====================================================================
-- Purchase validity (global default, applied to NEW purchases only) +
-- single-device login enforcement (admin toggle).
-- =====================================================================

-- 1) Settings: global validity window (0 = lifetime) + single-device switch.
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS purchase_validity_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS single_device boolean NOT NULL DEFAULT false;

-- 2) Access rows can now expire. NULL = never expires (existing rows stay lifetime).
ALTER TABLE public.user_subject_access
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.user_year_access
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 3) profiles.session_token backs single-device enforcement (safe if it exists).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS session_token text;

-- 4) Access check now treats an expired row as inactive.
CREATE OR REPLACE FUNCTION public.has_subject_access(_user_id uuid, _subject_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_subject_access usa
      WHERE usa.user_id = _user_id
        AND usa.subject_id = _subject_id
        AND usa.revoked_at IS NULL
        AND (usa.expires_at IS NULL OR usa.expires_at > now())
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_year_access uya
      JOIN public.subjects s ON s.id = _subject_id
      WHERE uya.user_id = _user_id
        AND uya.year_id = s.year_id
        AND uya.revoked_at IS NULL
        AND (uya.expires_at IS NULL OR uya.expires_at > now())
    );
$$;
