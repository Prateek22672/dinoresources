-- =====================================================================
-- Admin-managed AI keys, stored encrypted.
--
-- THREAT MODEL — the danger with keys in Postgres is that every table in
-- `public` is automatically an HTTP endpoint via PostgREST, so one wrong RLS
-- policy leaks credentials. This design removes that surface entirely:
--
--   1. Values live in Supabase VAULT (encrypted at rest), never in a plain
--      column.
--   2. The registry table lives in the `private` schema, which PostgREST does
--      not expose. There is no REST path to it at any role.
--   3. The only function that can decrypt (ai_keys_values) is granted to
--      service_role ONLY — revoked from anon and authenticated, so a logged-in
--      user (or a stolen user JWT) cannot call it even by guessing the name.
--   4. Admins reach this through the ai-keys edge function, which checks the
--      admin role server-side and NEVER returns a key value — only labels and
--      a masked tail for recognition.
--
-- Net effect: a key can be added and used, but never read back out — not by an
-- admin, not by the dashboard, not over REST.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS private.ai_keys (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider   text NOT NULL DEFAULT 'groq',
  label      text NOT NULL,              -- human name, e.g. "account-2"
  hint       text,                       -- last 4 chars only, for recognition
  secret_id  uuid NOT NULL,              -- -> vault.secrets.id
  active     boolean NOT NULL DEFAULT true,
  added_by   uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.ai_keys ENABLE ROW LEVEL SECURITY;  -- belt and braces; no policies = no access
REVOKE ALL ON TABLE private.ai_keys FROM anon, authenticated;

-- ── Add ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ai_keys_add(_label text, _value text, _provider text DEFAULT 'groq')
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid; rid uuid;
BEGIN
  IF _value IS NULL OR length(btrim(_value)) < 20 THEN
    RAISE EXCEPTION 'key looks invalid';
  END IF;
  sid := vault.create_secret(btrim(_value), 'ai_key_' || gen_random_uuid()::text, _label);
  INSERT INTO private.ai_keys (provider, label, hint, secret_id, added_by)
  VALUES (_provider, _label, right(btrim(_value), 4), sid, auth.uid())
  RETURNING id INTO rid;
  RETURN rid;
END;
$$;

-- ── List (metadata only — never the value) ────────────────────────────
CREATE OR REPLACE FUNCTION public.ai_keys_list(_provider text DEFAULT 'groq')
RETURNS TABLE (id uuid, label text, hint text, active boolean, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT k.id, k.label, k.hint, k.active, k.created_at
  FROM private.ai_keys k WHERE k.provider = _provider ORDER BY k.created_at;
$$;

-- ── Toggle / remove ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ai_keys_set_active(_id uuid, _active boolean)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE private.ai_keys SET active = _active WHERE id = _id;
$$;

CREATE OR REPLACE FUNCTION public.ai_keys_remove(_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid;
BEGIN
  SELECT secret_id INTO sid FROM private.ai_keys WHERE id = _id;
  DELETE FROM private.ai_keys WHERE id = _id;
  IF sid IS NOT NULL THEN DELETE FROM vault.secrets WHERE id = sid; END IF;
END;
$$;

-- ── Decrypt (service role ONLY — this is the sensitive one) ───────────
CREATE OR REPLACE FUNCTION public.ai_keys_values(_provider text DEFAULT 'groq')
RETURNS TABLE (label text, value text)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT k.label, s.decrypted_secret
  FROM private.ai_keys k
  JOIN vault.decrypted_secrets s ON s.id = k.secret_id
  WHERE k.provider = _provider AND k.active
  ORDER BY k.created_at;
$$;

-- Lock every accessor down. The edge function (service_role) is the only caller;
-- admins go through it, so no browser JWT can reach these even by name.
REVOKE ALL ON FUNCTION public.ai_keys_add(text, text, text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.ai_keys_list(text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.ai_keys_set_active(uuid, boolean) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.ai_keys_remove(uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.ai_keys_values(text) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.ai_keys_add(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_keys_list(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_keys_set_active(uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_keys_remove(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_keys_values(text) TO service_role;

NOTIFY pgrst, 'reload schema';
