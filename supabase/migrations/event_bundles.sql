-- Bundle ticket support.
--
-- events.bundle_size (default 1) controls how many tickets are created per
-- purchase for that event. 1 = solo (unchanged behavior). >1 = each
-- checkout produces that many tickets in a single transaction; capacity
-- decrements by bundle_size, and one confirmation email lists all N.
--
-- event_tickets.bundle_id groups the N rows produced by a single
-- purchase, so the PayMongo webhook can flip them all to 'active' at
-- once by looking up bundle_id (used as the payment reference).
--
-- Idempotent: safe to run repeatedly.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS bundle_size INT NOT NULL DEFAULT 1
    CHECK (bundle_size BETWEEN 1 AND 20);

ALTER TABLE public.event_tickets
  ADD COLUMN IF NOT EXISTS bundle_id UUID;

CREATE INDEX IF NOT EXISTS event_tickets_bundle_id_idx
  ON public.event_tickets (bundle_id);
