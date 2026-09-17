-- Pre-order flag for shop products.
--
-- Requested after the Sept 14 event: DIR merch was sold as pre-order, but the
-- shop gave buyers no signal, so people expected to receive it immediately.
--
-- `preorder_note` carries the expectation in the seller's own words — "ships
-- early October", "2-3 weeks after the drop closes" — rather than a date
-- column, because fan-merch timelines are estimates and a hard date renders as
-- a promise. Optional; the ribbon shows with or without it.
--
-- Idempotent; safe to re-apply.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_preorder   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preorder_note TEXT;
