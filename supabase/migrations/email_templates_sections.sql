-- Adds a `sections` JSONB column to email_templates so admins can edit
-- individual content sections (headline, intro, footer, etc.) instead
-- of a single giant HTML blob. When populated, lib/email.ts renders
-- through a fixed shell (defined in code) so the outer layout — brand
-- mark, banner, QR block, receipt table — can never be broken.
--
-- Falls back to the legacy `html` column if `sections` is null, and
-- then to hardcoded HTML if that's also missing.
--
-- Idempotent.

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS sections JSONB;

COMMENT ON COLUMN public.email_templates.sections IS
  'Per-template editable content sections. Keys are defined in lib/email-template-sections.ts.';
