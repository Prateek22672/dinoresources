-- =====================================================================
-- TeamDino · Editable team members (managed from the Admin console).
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  role        text NOT NULL,
  bio         text,
  image_url   text,
  link_url    text,            -- portfolio / LinkedIn / etc.
  order_index integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_order ON public.team_members (order_index);

DROP TRIGGER IF EXISTS team_members_updated_at ON public.team_members;
CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Anyone can read active members (the About page is public)
DROP POLICY IF EXISTS "Anyone can view team" ON public.team_members;
CREATE POLICY "Anyone can view team"
  ON public.team_members FOR SELECT
  USING (active OR public.has_role(auth.uid(), 'admin'));

-- Admins manage the team
DROP POLICY IF EXISTS "Admins manage team" ON public.team_members;
CREATE POLICY "Admins manage team"
  ON public.team_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
