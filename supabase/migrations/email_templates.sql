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
-- event_ticket
INSERT INTO public.email_templates (key, subject, html) VALUES (
  'event_ticket',
  '🎫 Your ticket for {{event_title}}',
  $HTML$
<div style="background:#0F1A0B;padding:32px;font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#3CCE2A;font-size:28px;letter-spacing:4px;margin:0;">CFS</h1>
    <p style="color:#8AAA78;margin:4px 0;">Colet Fan Suporta</p>
  </div>
  <div style="background:#1A3D14;border:2px solid #3CCE2A;border-radius:12px;padding:24px;text-align:center;">
    <div style="font-size:40px;margin-bottom:12px;">🎫</div>
    <h2 style="color:#F0EAD6;font-size:20px;letter-spacing:2px;margin:0 0 6px;">{{event_title}}</h2>
    <p style="color:#3CCE2A;font-size:14px;margin:0 0 4px;">{{event_date_long}}</p>
    <p style="color:#8AAA78;font-size:14px;margin:0 0 20px;">📍 {{event_location}}</p>
    <div style="background:#0F1A0B;border-radius:8px;padding:12px;display:inline-block;">
      <p style="color:#F5C82A;font-size:12px;letter-spacing:2px;margin:0 0 4px;">TICKET ID</p>
      <p style="color:#F0EAD6;font-size:16px;font-weight:bold;margin:0;">{{ticket_id}}</p>
    </div>
  </div>
  <p style="color:#5A7A50;font-size:12px;text-align:center;margin-top:20px;">
    Please present this email or your ticket ID at the event. See you there! ✦
  </p>
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
<div style="background:#0F1A0B;padding:32px;font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#3CCE2A;font-size:28px;letter-spacing:4px;margin:0;">CFS</h1>
    <p style="color:#8AAA78;margin:4px 0;">Colet Fan Suporta</p>
  </div>
  <div style="background:#1A2614;border:2px solid #2C4820;border-radius:12px;padding:24px;margin-bottom:20px;">
    <h2 style="color:#F0EAD6;font-size:18px;letter-spacing:2px;margin:0 0 8px;">ORDER CONFIRMED ✦</h2>
    <p style="color:#8AAA78;font-size:14px;margin:0 0 16px;">Order ID: <strong style="color:#F5C82A;">#{{order_short_id}}</strong></p>
    {{items_table}}
  </div>
  <div style="background:#1A2614;border:2px solid #2C4820;border-radius:12px;padding:20px;margin-bottom:20px;">
    <h3 style="color:#3CCE2A;font-size:13px;letter-spacing:2px;margin:0 0 10px;">SHIPPING TO</h3>
    <p style="color:#F0EAD6;font-size:14px;margin:0;">{{ship_name}}</p>
    <p style="color:#8AAA78;font-size:13px;margin:4px 0;">{{ship_line1}}</p>
    <p style="color:#8AAA78;font-size:13px;margin:0;">{{ship_line2}}</p>
  </div>
  <p style="color:#5A7A50;font-size:12px;text-align:center;">
    Thank you for supporting CFS Bini Colet! ♥<br/>
    For questions, contact us on our social media channels.
  </p>
</div>
$HTML$
) ON CONFLICT (key) DO NOTHING;

-- welcome (transactional catch-all — used for new-member welcome. Other
-- notifications can be added later; this seeds the row so the admin UI
-- has something to edit.)
INSERT INTO public.email_templates (key, subject, html) VALUES (
  'welcome',
  '✦ Welcome to CFS, {{member_name}}!',
  $HTML$
<div style="background:#0F1A0B;padding:32px;font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#3CCE2A;font-size:28px;letter-spacing:4px;margin:0;">CFS</h1>
    <p style="color:#8AAA78;margin:4px 0;">Colet Fan Suporta</p>
  </div>
  <div style="background:#1A2614;border:2px solid #2C4820;border-radius:12px;padding:24px;">
    <h2 style="color:#F0EAD6;font-size:20px;letter-spacing:2px;margin:0 0 12px;">WELCOME, {{member_name}} ♥</h2>
    <p style="color:#8AAA78;font-size:14px;line-height:1.6;margin:0 0 12px;">You're now part of the CFS fan community. Here's what you can do next:</p>
    <ul style="color:#F0EAD6;font-size:14px;line-height:1.8;margin:0 0 12px;padding-left:20px;">
      <li>Browse upcoming events at <a href="{{site_url}}/events" style="color:#3CCE2A;">coletfs.com/events</a></li>
      <li>Introduce yourself in the community feed</li>
      <li>Grab your fan card from your profile</li>
    </ul>
  </div>
  <p style="color:#5A7A50;font-size:12px;text-align:center;margin-top:20px;">Salamat sa pagsuporta kay Colet! ✦</p>
</div>
$HTML$
) ON CONFLICT (key) DO NOTHING;
