-- Creates the event_tickets table.
-- Columns derived from every file that references this table:
--   app/api/events/tickets/route.ts
--   app/api/admin/check-in/route.ts
--   app/api/paymongo/webhook/route.ts
--   app/(public)/events/[id]/page.tsx
--   app/(members)/members/events/page.tsx

CREATE SEQUENCE IF NOT EXISTS event_ticket_number_seq START 1000;

CREATE TABLE public.event_tickets (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number     TEXT        UNIQUE NOT NULL DEFAULT 'CFS-' || LPAD(nextval('event_ticket_number_seq')::TEXT, 4, '0'),
  event_id          UUID        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id           TEXT        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier_id           UUID        REFERENCES public.event_tiers(id),
  status            TEXT        NOT NULL DEFAULT 'pending_payment'
                                CHECK (status IN ('pending_payment', 'active', 'used', 'cancelled')),
  payment_status    TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (payment_status IN ('pending', 'free', 'paid', 'failed')),
  qr_data           JSONB,
  checked_in_at     TIMESTAMPTZ,
  checked_in_by     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX ON public.event_tickets (event_id);
CREATE INDEX ON public.event_tickets (user_id);
CREATE INDEX ON public.event_tickets (status);

ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

-- Members can read their own tickets
CREATE POLICY "members_read_own_tickets" ON public.event_tickets
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()::TEXT) = user_id);

-- Members can insert their own tickets
CREATE POLICY "members_insert_own_tickets" ON public.event_tickets
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()::TEXT) = user_id);
