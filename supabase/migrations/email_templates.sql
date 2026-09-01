-- Admin-editable email templates. lib/email.ts reads a row by `key` and
-- substitutes {{var}} placeholders; if the row is missing or errors,
-- callers fall back to hardcoded HTML so we never fail an email send
-- because of a template issue.
--
-- Seed rows are inserted below (ON CONFLICT DO NOTHING) using the same
-- HTML that ships in lib/email.ts today, so behavior is identical the
-- moment this migration lands.
--
-- Idempotent: safe to run repeatedly.

CREATE TABLE IF NOT EXISTS public.email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE
                CHECK (key IN ('event_ticket', 'donation_receipt', 'order_confirmation', 'welcome')),
  subject     TEXT NOT NULL,
  html        TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT
);

CREATE OR REPLACE FUNCTION public.set_email_template_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_email_templates_touch ON public.email_templates;
CREATE TRIGGER trg_email_templates_touch
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_email_template_updated_at();

-- Only admins should read/write; API routes use the service-role client
-- so RLS off is fine, but enable + block by default to make service-role
-- the only path.
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_public_access_email_templates" ON public.email_templates;
-- No SELECT/INSERT/UPDATE/DELETE policies = fully blocked for anon/auth;
-- service-role bypasses RLS by design.

-- ─── SEED ───────────────────────────────────────────────────────────────
-- Note: this raw HTML column is a *fallback*. Real production sends use
-- the locked shell in lib/email/shells/*.ts driven by the `sections`
-- JSON. See email_templates_light_theme.sql for the migration that
-- brought the seed onto the current cream/white palette.
--
-- event_ticket
INSERT INTO public.email_templates (key, subject, html) VALUES (
  'event_ticket',
  'Your ticket for {{event_title}} — {{ticket_code}}',
  $HTML$
<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;padding:28px;text-align:center;">
      <h1 style="font-family:Georgia,serif;font-size:26px;color:#1B3A2D;margin:0 0 8px;">{{event_title}}</h1>
      <div style="font-size:13px;color:#3A5A30;">{{date_str}} · {{time_str}}</div>
      <div style="font-size:13px;color:#5A7A60;margin-top:4px;">{{event_location}}</div>
      <div style="margin-top:20px;padding:12px 16px;background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:12px;display:inline-block;">
        <div style="font-size:10px;letter-spacing:2px;color:#5A7A60;">TICKET ID</div>
        <div style="font-family:'Courier New',monospace;font-size:16px;font-weight:700;color:#1B3A2D;margin-top:2px;">{{ticket_code}}</div>
      </div>
    </div>
  </div>
</div>
$HTML$
) ON CONFLICT (key) DO NOTHING;

-- donation_receipt (kept as a text placeholder; the current lib/email.ts
-- generates SVG barcodes dynamically. Admins can override the wrapper,
-- but the barcode/table are computed in code and rendered as {{body_html}}.)
INSERT INTO public.email_templates (key, subject, html) VALUES (
  'donation_receipt',
  'Official Receipt #{{ref_no}} — CFS Donation',
  $HTML$
<div style="background:#f0f0f0;padding:32px 0;font-family:Courier New, Courier, monospace;">
  {{body_html}}
</div>
$HTML$
) ON CONFLICT (key) DO NOTHING;

-- order_confirmation
INSERT INTO public.email_templates (key, subject, html) VALUES (
  'order_confirmation',
  '✦ Order Confirmed! #{{order_short_id}}',
  $HTML$
<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;padding:28px;">
      <div style="text-align:center;margin-bottom:14px;">
        <div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">ORDER CONFIRMED ✦</div>
      </div>
      <p style="font-size:13px;color:#5A7A60;text-align:center;margin:0 0 18px;">Order ID: <strong style="color:#1B3A2D;font-family:'Courier New',monospace;">#{{order_short_id}}</strong></p>
      {{items_table}}
      <div style="margin-top:22px;padding-top:16px;border-top:1px dashed #DDE8DD;">
        <div style="font-size:10px;letter-spacing:2px;color:#1A8040;font-weight:700;margin-bottom:6px;">SHIPPING TO</div>
        <p style="font-size:14px;color:#1B3A2D;margin:0;font-weight:600;">{{ship_name}}</p>
        <p style="font-size:13px;color:#5A7A60;margin:4px 0;">{{ship_line1}}</p>
        <p style="font-size:13px;color:#5A7A60;margin:0;">{{ship_line2}}</p>
      </div>
    </div>
  </div>
</div>
$HTML$
) ON CONFLICT (key) DO NOTHING;

-- welcome (fires from Clerk user.created webhook after profile is created)
INSERT INTO public.email_templates (key, subject, html) VALUES (
  'welcome',
  'Welcome to Colet Fan Suporta ✦',
  $HTML$
<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;padding:32px;text-align:center;">
      <h1 style="font-family:Georgia,serif;font-size:26px;color:#1B3A2D;margin:0 0 10px;">Welcome, {{member_name}}!</h1>
      <p style="font-size:14px;color:#5A7A60;line-height:1.7;margin:0 0 18px;">You're officially part of the CFS fan community.</p>
      <a href="{{site_url}}/members" style="display:inline-block;background:#1A8040;color:#FFFFFF;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;padding:12px 24px;border-radius:10px;">EXPLORE MEMBERS AREA</a>
    </div>
  </div>
</div>
$HTML$
) ON CONFLICT (key) DO NOTHING;
