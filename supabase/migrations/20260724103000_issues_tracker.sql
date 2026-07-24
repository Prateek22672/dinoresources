-- ─── Internal issue / bug tracker ─────────────────────────────────────────
-- Anyone can log an issue; the board is triaged and managed by the team
-- (admin + contributors). Separate from support_tickets (which is private
-- user↔admin support) — this is a shared, collaborative bug board.

CREATE TABLE IF NOT EXISTS public.issues (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text NOT NULL,
  category      text NOT NULL DEFAULT 'bug',      -- bug | payment | content | access | suggestion
  status        text NOT NULL DEFAULT 'new',      -- new | confirmed | in_progress | done | dismissed | duplicate
  severity      text NOT NULL DEFAULT 'normal',   -- low | normal | high | critical
  page_url      text,
  device        text,
  reporter_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_name text,
  assignee_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  upvotes       integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_reporter ON public.issues (reporter_id);

-- one vote per user per issue (dedupes "10 people re-report the same bug")
CREATE TABLE IF NOT EXISTS public.issue_votes (
  issue_id  uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (issue_id, user_id)
);

-- team discussion / activity notes on an issue
CREATE TABLE IF NOT EXISTS public.issue_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue ON public.issue_comments (issue_id, created_at);

-- keep upvotes count in sync with the votes table
CREATE OR REPLACE FUNCTION public.sync_issue_upvotes() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.issues SET upvotes = (SELECT count(*) FROM public.issue_votes WHERE issue_id = COALESCE(NEW.issue_id, OLD.issue_id))
  WHERE id = COALESCE(NEW.issue_id, OLD.issue_id);
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS issue_votes_count ON public.issue_votes;
CREATE TRIGGER issue_votes_count AFTER INSERT OR DELETE ON public.issue_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_issue_upvotes();

-- updated_at maintenance
DROP TRIGGER IF EXISTS issues_updated_at ON public.issues;
CREATE TRIGGER issues_updated_at BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_comments ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can log an issue
DROP POLICY IF EXISTS "Anyone can report" ON public.issues;
CREATE POLICY "Anyone can report" ON public.issues FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- The board is team-only; reporters may see their own submissions
DROP POLICY IF EXISTS "Team sees board, reporter sees own" ON public.issues;
CREATE POLICY "Team sees board, reporter sees own" ON public.issues FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'contributor') OR reporter_id = auth.uid());

-- Only the team triages (status, severity, assignee)
DROP POLICY IF EXISTS "Team manages issues" ON public.issues;
CREATE POLICY "Team manages issues" ON public.issues FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'contributor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'contributor'));

DROP POLICY IF EXISTS "Admin deletes issues" ON public.issues;
CREATE POLICY "Admin deletes issues" ON public.issues FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- Votes: anyone manages their own
DROP POLICY IF EXISTS "Own votes" ON public.issue_votes;
CREATE POLICY "Own votes" ON public.issue_votes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Read votes" ON public.issue_votes;
CREATE POLICY "Read votes" ON public.issue_votes FOR SELECT TO authenticated USING (true);

-- Comments: team reads/writes; reporter can read their own issue's comments
DROP POLICY IF EXISTS "Team comments" ON public.issue_comments;
CREATE POLICY "Team comments" ON public.issue_comments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'contributor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'contributor'));
