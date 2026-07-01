-- =====================================================================
-- TeamDino · Support tickets — users raise issues, admins resolve them.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    text NOT NULL,                 -- e.g. 'paid_not_granted', 'subject_not_opening'
  subject_id  uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  message     text NOT NULL,
  contact     text,                          -- optional email/phone for follow-up
  status      text NOT NULL DEFAULT 'open',  -- open | in_progress | resolved
  admin_note  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status  ON public.support_tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_user    ON public.support_tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON public.support_tickets (created_at DESC);

DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users create their own tickets
DROP POLICY IF EXISTS "Users create own tickets" ON public.support_tickets;
CREATE POLICY "Users create own tickets"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users read their own tickets; admins read all
DROP POLICY IF EXISTS "Users view own tickets" ON public.support_tickets;
CREATE POLICY "Users view own tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Admins manage (update status / notes, delete)
DROP POLICY IF EXISTS "Admins manage tickets" ON public.support_tickets;
CREATE POLICY "Admins manage tickets"
  ON public.support_tickets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
