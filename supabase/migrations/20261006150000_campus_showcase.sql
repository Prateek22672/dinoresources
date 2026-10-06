-- =====================================================================
-- Campus Showcase — students post what they built; everyone can browse,
-- signed-in students like, admins approve before anything goes public.
--
--   showcase_posts  one row per project. status: pending → approved |
--                   rejected (with a reason) | hidden (taken down later).
--   showcase_likes  one like per student per post; like_count is kept in
--                   step by trigger so lists never count rows.
--   storage bucket  "showcase" for cover images (public read, 3MB, images).
--
-- Moderation is enforced here, not in the UI: a student's insert is forced
-- to `pending`, and any edit a student makes sends the post back to review
-- and can't touch status/featured/likes. Only admins move a post live.
-- The whole page has an on/off switch: feature flag `showcase`.
--
-- Apply in the dashboard SQL editor (do not `db push`).
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.showcase_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name   text,
  title         text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  tagline       text NOT NULL CHECK (char_length(tagline) BETWEEN 5 AND 140),
  description   text NOT NULL DEFAULT '' CHECK (char_length(description) <= 4000),
  category      text NOT NULL DEFAULT 'project'
                CHECK (category IN ('project', 'startup', 'research', 'design', 'event', 'other')),
  tags          text[] NOT NULL DEFAULT '{}',
  team          text CHECK (char_length(team) <= 200),
  -- links render as hrefs: only real web links, never javascript: etc.
  cover_url     text CHECK (cover_url IS NULL OR cover_url ~* '^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/showcase/'),
  live_url      text CHECK (live_url IS NULL OR live_url ~* '^https?://'),
  repo_url      text CHECK (repo_url IS NULL OR repo_url ~* '^https?://'),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  reject_reason text,
  featured      boolean NOT NULL DEFAULT false,
  like_count    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  approved_at   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_showcase_status ON public.showcase_posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_showcase_author ON public.showcase_posts (author_id);

CREATE TABLE IF NOT EXISTS public.showcase_likes (
  post_id    uuid NOT NULL REFERENCES public.showcase_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- ── Guard rails on every write ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.showcase_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin boolean := public.has_role(auth.uid(), 'admin');
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- the author's display name comes from their profile, never the client
    SELECT coalesce(nullif(p.full_name, ''), nullif(p.username, ''), 'A GITAM student')
      INTO NEW.author_name FROM public.profiles p WHERE p.id = NEW.author_id;
    NEW.like_count := 0;
    IF NOT is_admin THEN
      NEW.status := 'pending'; NEW.featured := false; NEW.reject_reason := NULL; NEW.approved_at := NULL;
    END IF;
  ELSE
    -- the like-count trigger (below) updates the post as the liker; that is a
    -- count change only and must not be treated as the student editing it
    IF pg_trigger_depth() > 1 THEN
      RETURN NEW;
    END IF;
    NEW.id := OLD.id;
    NEW.author_id := OLD.author_id;
    NEW.author_name := OLD.author_name;
    NEW.created_at := OLD.created_at;
    IF NOT is_admin THEN
      -- a student edit is content only, and goes back to review
      NEW.like_count := OLD.like_count;
      NEW.featured := OLD.featured;
      NEW.status := 'pending';
      NEW.reject_reason := NULL;
      NEW.approved_at := NULL;
    ELSIF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
      NEW.approved_at := now();
    END IF;
  END IF;
  -- tidy tags: lowercase, trimmed, unique, at most 6 of up to 24 chars
  NEW.tags := ARRAY(
    SELECT DISTINCT left(lower(trim(t)), 24) FROM unnest(coalesce(NEW.tags, '{}')) AS t
     WHERE trim(t) <> '' LIMIT 6);
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS showcase_guard ON public.showcase_posts;
CREATE TRIGGER showcase_guard BEFORE INSERT OR UPDATE ON public.showcase_posts
  FOR EACH ROW EXECUTE FUNCTION public.showcase_guard();

-- like_count follows the likes table; a like on a non-public post is refused
CREATE OR REPLACE FUNCTION public.showcase_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (SELECT 1 FROM public.showcase_posts WHERE id = NEW.post_id AND status = 'approved') THEN
      RAISE EXCEPTION 'This post is not public';
    END IF;
    UPDATE public.showcase_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSE
    UPDATE public.showcase_posts SET like_count = greatest(0, like_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END $$;

DROP TRIGGER IF EXISTS showcase_like_count ON public.showcase_likes;
CREATE TRIGGER showcase_like_count AFTER INSERT OR DELETE ON public.showcase_likes
  FOR EACH ROW EXECUTE FUNCTION public.showcase_like_count();

-- ── RLS ────────────────────────────────────────────────────────────────
ALTER TABLE public.showcase_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "showcase read" ON public.showcase_posts;
CREATE POLICY "showcase read" ON public.showcase_posts FOR SELECT
  USING (status = 'approved' OR author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "showcase post" ON public.showcase_posts;
CREATE POLICY "showcase post" ON public.showcase_posts FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "showcase edit" ON public.showcase_posts;
CREATE POLICY "showcase edit" ON public.showcase_posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "showcase delete" ON public.showcase_posts;
CREATE POLICY "showcase delete" ON public.showcase_posts FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "likes read own" ON public.showcase_likes;
CREATE POLICY "likes read own" ON public.showcase_likes FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "likes add own" ON public.showcase_likes;
CREATE POLICY "likes add own" ON public.showcase_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "likes remove own" ON public.showcase_likes;
CREATE POLICY "likes remove own" ON public.showcase_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── Cover images ───────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('showcase', 'showcase', true, 3145728, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- students upload only into a folder named after their own user id
DROP POLICY IF EXISTS "showcase covers upload" ON storage.objects;
CREATE POLICY "showcase covers upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'showcase' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "showcase covers delete" ON storage.objects;
CREATE POLICY "showcase covers delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'showcase' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));

-- ── On/off switch (Admin → Cards & Features) ───────────────────────────
INSERT INTO public.feature_flags (key, label, enabled)
SELECT 'showcase', 'Campus Showcase', true
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key = 'showcase');

NOTIFY pgrst, 'reload schema';
