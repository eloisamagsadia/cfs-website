-- Fixes community_reports so member-filed reports actually work:
--   1. reporter_id was UUID but profiles.id is TEXT (Clerk user IDs);
--      any INSERT would fail with a type mismatch.
--   2. Adds reviewed_by / reviewed_at / resolution_note for the
--      /admin/community-reports moderator queue.
--
-- Idempotent — the DO block guards the type change so it only runs
-- when the column is still UUID.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_reports'
      AND column_name = 'reporter_id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.community_reports DROP CONSTRAINT IF EXISTS community_reports_reporter_id_fkey;
    ALTER TABLE public.community_reports ALTER COLUMN reporter_id TYPE TEXT USING reporter_id::TEXT;
    ALTER TABLE public.community_reports ADD CONSTRAINT community_reports_reporter_id_fkey
      FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  ALTER TABLE public.community_reports
    ADD COLUMN IF NOT EXISTS reviewed_by     TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at     TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS resolution_note TEXT;
END $$;
