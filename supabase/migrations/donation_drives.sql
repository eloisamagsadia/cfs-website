-- Donation drives + drive allocation + manual payment channel.
-- Idempotent so this file is safe to re-apply.

-- 1) Drives themselves
CREATE TABLE IF NOT EXISTS public.donation_drives (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT 'general'
                   CHECK (category IN ('general','fan_projects','extras','gift_for_colet')),
  description    TEXT,
  target_amount  NUMERIC(12,2),
  cover_url      TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_donation_drives_active_sort
  ON public.donation_drives (is_active, sort_order);

-- 2) Extend donations with drive selections + payment channel + manual flag
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS drive_ids        UUID[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_channel  TEXT,
  ADD COLUMN IF NOT EXISTS payment_method   TEXT,
  ADD COLUMN IF NOT EXISTS is_manual        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_reference TEXT;

-- 3) Per-drive allocation table so equal-split totals are queryable
--    (one row per (donation, drive) pair; amount is donation_amount / N).
CREATE TABLE IF NOT EXISTS public.donation_drive_allocations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id  UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  drive_id     UUID NOT NULL REFERENCES public.donation_drives(id) ON DELETE CASCADE,
  amount       NUMERIC(12,2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (donation_id, drive_id)
);

CREATE INDEX IF NOT EXISTS idx_dda_drive ON public.donation_drive_allocations (drive_id);
CREATE INDEX IF NOT EXISTS idx_dda_donation ON public.donation_drive_allocations (donation_id);

-- 4) Seed the four canonical drives if not present
INSERT INTO public.donation_drives (slug, name, category, description, sort_order)
VALUES
  ('general',       'General Fund',          'general',        'Site + operational costs for CFS.',                 10),
  ('fan-projects',  'Fan Projects',          'fan_projects',   'Cup sleeve events, cakes, banners, etc.',           20),
  ('extras',        'Extras',                'extras',         'Community perks, meet-ups, and one-off surprises.', 30),
  ('gift-for-colet','Gift for Colet',        'gift_for_colet', 'Direct gifts and support offerings for Colet.',     40)
ON CONFLICT (slug) DO NOTHING;

-- 5) RLS: public read of drives, admins manage; allocations mirror donation ownership
ALTER TABLE public.donation_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_drive_allocations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "drives_read_all" ON public.donation_drives
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "allocations_read_own" ON public.donation_drive_allocations
    FOR SELECT USING (
      donation_id IN (
        SELECT id FROM public.donations WHERE user_id = (auth.uid())::TEXT
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
