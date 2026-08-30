-- Ensures support_tickets has the member reply columns used by
--   app/(members)/members/support/tickets/page.tsx (send reply)
--   app/api/support/route.ts PATCH (persist reply)
--   app/admin/support/page.tsx (render reply)
-- Idempotent: safe to run on databases where these columns already exist.

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS member_reply       TEXT,
  ADD COLUMN IF NOT EXISTS member_replied_at  TIMESTAMPTZ;
