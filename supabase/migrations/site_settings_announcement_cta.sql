-- Adds an optional CTA (label + URL) to the site announcement banner so
-- admins can turn the banner into a click-through without editing code.
-- The announcement itself lives on site_settings; these two columns
-- extend it. Both nullable — the UI hides the CTA button when either
-- is empty.
--
-- Idempotent.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS announcement_cta_label TEXT,
  ADD COLUMN IF NOT EXISTS announcement_cta_url   TEXT;
