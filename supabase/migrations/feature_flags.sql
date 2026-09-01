-- Feature flags. Super-admin-editable key/value toggles read by app code
-- via lib/feature-flags.ts.
--
-- Idempotent: safe to run repeatedly.

CREATE TABLE IF NOT EXISTS public.feature_flags (
  key         TEXT PRIMARY KEY,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT
);

CREATE OR REPLACE FUNCTION public.set_feature_flag_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_feature_flags_touch ON public.feature_flags;
CREATE TRIGGER trg_feature_flags_touch
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_feature_flag_updated_at();

-- Fully locked to service-role only; API routes gate on super_admin role.
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Seed a couple of illustrative flags. Safe to remove or re-flag from the UI.
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('bundles_enabled',         true,  'Master switch for bundle-of-N ticket purchases. Off = force bundle_size=1 everywhere.'),
  ('shop_enabled',            false, 'Shop pages and checkout. Off = hide shop nav + block /shop.'),
  ('community_read_only',     false, 'When on, community posting/commenting is disabled; reading still works.'),
  ('maintenance_banner',      false, 'Show a top-of-page banner site-wide (edit copy in site_settings).')
ON CONFLICT (key) DO NOTHING;
