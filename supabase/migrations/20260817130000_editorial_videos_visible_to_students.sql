-- Videos tab (subject_editorial): the SELECT policy required admin/contributor/
-- subject ownership, so a non-owning student got ZERO rows back — not "locked",
-- literally nothing, even though UnitView.tsx already has its own free-preview
-- gating (first video free, rest shown blurred/locked) exactly like Study-With-AI.
-- The client-side design was always "always visible, client gates playback" —
-- this policy never matched that, so previewers saw "No video added" even when
-- contributors had added one. These are third-party YouTube links (not exclusive
-- content), so there's nothing sensitive in exposing the row to any signed-in user.
DROP POLICY IF EXISTS "View editorial with access" ON public.subject_editorial;
CREATE POLICY "View editorial with access" ON public.subject_editorial FOR SELECT TO authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
