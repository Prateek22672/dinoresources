-- App settings (singleton) — admin-controlled site security level.
CREATE TABLE IF NOT EXISTS public.app_settings (
  id boolean PRIMARY KEY DEFAULT true,
  security_level integer NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id)
);
INSERT INTO public.app_settings (id, security_level) VALUES (true, 1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone read settings" ON public.app_settings;
CREATE POLICY "Anyone read settings" ON public.app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins update settings" ON public.app_settings;
CREATE POLICY "Admins update settings" ON public.app_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
