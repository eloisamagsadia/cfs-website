-- Adds guidelines fields to events: a poster/image URL and a text body.
-- Rendered on the public event detail page below the event description.
-- Idempotent.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS guidelines_url  TEXT,
  ADD COLUMN IF NOT EXISTS guidelines_text TEXT,
  ADD COLUMN IF NOT EXISTS heading_font    TEXT DEFAULT 'serif'
    CHECK (heading_font IS NULL OR heading_font IN ('serif','sans','display')),
  ADD COLUMN IF NOT EXISTS body_font       TEXT DEFAULT 'sans'
    CHECK (body_font IS NULL OR body_font IN ('serif','sans','display'));
