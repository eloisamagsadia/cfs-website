-- Adds `profiles` to the realtime publication so admin/super dashboards
-- can subscribe to INSERT/DELETE and keep TOTAL MEMBERS in sync live.
-- Idempotent: DO block swallows the error if the table is already published.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
