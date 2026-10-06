-- search_subject_material must not be callable signed-out.
--
-- 20261006120000 revoked EXECUTE from PUBLIC, but Supabase's default
-- privileges also grant EXECUTE on new public functions to `anon` directly,
-- so a signed-out caller could still list material titles (never their text —
-- that needs subject access). Revoke the direct grant too.
REVOKE EXECUTE ON FUNCTION public.search_subject_material(uuid, text, integer, integer) FROM anon;
