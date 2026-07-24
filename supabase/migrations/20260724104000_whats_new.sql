ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS whats_new_active    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whats_new_title     text,
  ADD COLUMN IF NOT EXISTS whats_new_body      text,
  ADD COLUMN IF NOT EXISTS whats_new_cta_label text,
  ADD COLUMN IF NOT EXISTS whats_new_cta_url   text,
  ADD COLUMN IF NOT EXISTS whats_new_emoji     text,
  ADD COLUMN IF NOT EXISTS whats_new_version   integer NOT NULL DEFAULT 1;
