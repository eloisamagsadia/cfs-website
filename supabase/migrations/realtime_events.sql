-- Adds `events` to the realtime publication so /admin/events, /events,
-- and the homepage can subscribe to changes and auto-refresh without a
-- manual reload. Idempotent: DO block swallows the error if the table
-- is already published.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
