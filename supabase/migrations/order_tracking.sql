-- Shipment tracking on shop orders.
--
-- The FAQ promised "you will receive a tracking link by email once your order
-- ships", but nothing in the system recorded a tracking number or sent that
-- email. These columns back it.
--
-- Deliberately courier-agnostic: `courier` is free text, not an enum, so any
-- courier in any country works without a migration. lib/couriers.ts keeps a
-- convenience registry that turns a known courier name into a tracking URL;
-- `tracking_url` is the manual override for couriers not in that list.
--
-- `shipped_at` doubles as the "already emailed" flag — the API only sends the
-- shipped notice when it transitions from NULL, so re-saving a shipped order
-- (or a bulk re-mark) never re-sends.
--
-- Idempotent; safe to re-apply.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier          TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number  TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url     TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at       TIMESTAMPTZ;

-- Admin order list filters by status; tracking lookups are by number when a
-- member emails asking "where is TRK123". Partial index keeps it small since
-- most rows have no tracking number.
CREATE INDEX IF NOT EXISTS orders_tracking_number_idx
  ON public.orders (tracking_number)
  WHERE tracking_number IS NOT NULL;
