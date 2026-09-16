-- Realtime for the /super/analytics dashboard.
--
-- The dashboard subscribes to the tables its numbers are derived from, so a
-- ticket sale, donation, or shop order updates the figures without a refresh.
-- Only `profiles` and `events` were published before, which meant the money
-- tables could change with the dashboard showing stale totals indefinitely.
--
-- Publishing a table only streams change events to subscribed clients; RLS
-- still governs who may read the rows. The analytics page itself reads through
-- the service-role client server-side — these events are just the "something
-- changed, re-fetch" signal, and carry no row payload to the browser.
--
-- Idempotent: each DO block swallows duplicate_object so re-running is safe
-- whether or not the table is already published.

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.event_tickets;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
