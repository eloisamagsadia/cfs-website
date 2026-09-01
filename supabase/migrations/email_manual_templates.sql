-- Reusable, admin-editable templates for the manual "Send Email" tool at
-- /admin/email. Separate from email_templates (which is fixed to four
-- keys for transactional/auto-triggered sends) so admins can freely
-- create, edit, and delete as many custom templates as they like.
--
-- Seed rows are the three original built-in templates (Thank You,
-- Reward/Badge, Announcement) with is_builtin=true so the UI can hide
-- delete for those and still let admins update the copy.
--
-- Idempotent: ON CONFLICT DO NOTHING on seed inserts.

CREATE TABLE IF NOT EXISTS public.email_manual_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  subject     TEXT NOT NULL,
  html        TEXT NOT NULL,
  is_builtin  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_manual_templates_name ON public.email_manual_templates (name);

CREATE OR REPLACE FUNCTION public.set_email_manual_template_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_email_manual_templates_touch ON public.email_manual_templates;
CREATE TRIGGER trg_email_manual_templates_touch
  BEFORE UPDATE ON public.email_manual_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_email_manual_template_updated_at();

-- Service-role-only. No SELECT/INSERT/UPDATE/DELETE policies means
-- anon/authenticated can't reach this table via PostgREST.
ALTER TABLE public.email_manual_templates ENABLE ROW LEVEL SECURITY;

-- Seed the three original built-ins. Kept short here (the DB has the
-- full HTML already applied via the SQL editor); on a fresh clone,
-- re-run this and the API POST endpoint to recreate.
INSERT INTO public.email_manual_templates (name, subject, html, is_builtin) VALUES
('Thank You',      'Thank you for your support, {{name}}!',              '<div>Thank you, {{name}}!</div>', true),
('Reward / Badge', 'You earned a special reward, {{name}}! ✦',           '<div>Congrats, {{name}}!</div>', true),
('Announcement',   'Important update from Colet Fan Suporta',       '<div>Hi {{name}}, we have news…</div>', true)
ON CONFLICT (name) DO NOTHING;
