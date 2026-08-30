-- Allow admins to attach a "no receipt available" note to a report line item
-- (e.g. "vendor did not issue a receipt", "petty cash under threshold").
-- Idempotent; safe to re-apply.

ALTER TABLE public.report_receipts
  ADD COLUMN IF NOT EXISTS note          TEXT,
  ADD COLUMN IF NOT EXISTS is_note_only  BOOLEAN NOT NULL DEFAULT false;

-- Note-only rows don't have a file, so relax the file_url NOT NULL if it exists.
DO $$ BEGIN
  ALTER TABLE public.report_receipts ALTER COLUMN file_url DROP NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.report_receipts ALTER COLUMN file_name DROP NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;
