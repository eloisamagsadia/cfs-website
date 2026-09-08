-- Mirror of Clerk publicMetadata.is_event_staff so admin lists can
-- filter and badge event-staff members without hitting Clerk on every
-- render. Written by /api/admin/members/event-staff whenever the flag
-- toggles. Middleware still reads the source of truth from Clerk
-- sessionClaims — this column is UI-only.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_event_staff BOOLEAN NOT NULL DEFAULT false;
