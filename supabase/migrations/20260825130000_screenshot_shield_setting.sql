-- =====================================================================
-- Screenshot deterrence, split out from the security level ladder
--
-- Level 3 used to blur the whole page on ANY window-blur event (tab
-- switch, alt-tab, even clicking into an embedded YouTube player — which
-- steals focus from the top-level window exactly like a real blur does).
-- That made the shield fire constantly during ordinary use, most visibly
-- as a full-page blur the instant a student pressed play on a video.
--
-- The only client-observable signal that's actually a screenshot (not a
-- guess) is the PrintScreen key. There's no way for a web page to detect
-- OS-level screen recording or a phone camera pointed at the screen — no
-- browser exposes that. So this toggle controls the PrintScreen-only
-- shield, independent from DevTools/copy-paste blocking, and defaults to
-- on since it has no false positives worth worrying about.
-- =====================================================================

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS screenshot_shield boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.app_settings.screenshot_shield IS
  'When on, pressing PrintScreen wipes the clipboard and flashes a blur. Independent of security_level.';

NOTIFY pgrst, 'reload schema';
