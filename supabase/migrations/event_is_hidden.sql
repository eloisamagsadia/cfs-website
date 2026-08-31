-- Adds is_hidden flag so admins can hide events from public listings
-- (homepage, /events page, and featured "next up" card) without
-- deleting or cancelling them. Hidden events remain accessible to
-- anyone with a direct link or existing ticket.
-- Idempotent: safe to run on databases where the column already exists.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_is_hidden ON public.events (is_hidden);
