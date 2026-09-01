-- Rewrite the initial dark-forest seed HTML in `email_templates` to the
-- current light cream/white theme used by the production shells.
--
-- Safety: only UPDATE rows whose html still contains #0F1A0B (a color
-- only present in the original dark seed). Admin-customized rows will
-- no longer contain that marker, so they're left untouched.
--
-- Note: the visual rendering path is the locked shell in
-- lib/email/shells/*.ts (driven by the `sections` JSON column). The
-- `html` column is a fallback for the rare case where an admin cleared
-- their sections. Keeping this seed on-brand prevents any user from
-- ever receiving a dark-theme email again.
--
-- Idempotent: safe to run repeatedly.

UPDATE public.email_templates
SET html = $HTML$
<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:4px;color:#1B3A2D;">CFS</div>
      <div style="font-size:11px;letter-spacing:3px;color:#5A7A60;margin-top:2px;">COLET FAN SUPORTA</div>
    </div>
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">
      {{banner_block}}
      <div style="padding:28px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">TICKET CONFIRMED ✦</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#1B3A2D;margin:14px 0 8px;">{{event_title}}</h1>
        <div style="font-size:13px;color:#3A5A30;letter-spacing:0.5px;">{{date_str}}</div>
        <div style="font-size:13px;color:#5A7A60;margin-top:2px;">{{time_str}} &nbsp;·&nbsp; {{event_location}}</div>
      </div>
      <div style="padding:20px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:14px;padding:16px;">
          <img src="{{qr_src}}" alt="Ticket QR" width="200" height="200" style="display:block;width:200px;height:200px;" />
        </div>
        <div style="margin-top:14px;font-size:10px;letter-spacing:2px;color:#5A7A60;">TICKET ID</div>
        <div style="font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:700;color:#1B3A2D;letter-spacing:2px;margin-top:2px;">{{ticket_code}}</div>
      </div>
      <div style="padding:20px 28px 28px;text-align:center;">
        <a href="{{gcal_url}}" target="_blank" style="display:inline-block;background:#1A8040;color:#FFFFFF;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;padding:12px 20px;border-radius:10px;margin:0 4px;">ADD TO CALENDAR</a>
        <a href="{{tickets_url}}" target="_blank" style="display:inline-block;background:#FFFFFF;color:#1B3A2D;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;padding:11px 19px;border-radius:10px;border:1.5px solid #DDE8DD;margin:0 4px;">VIEW MY TICKETS</a>
      </div>
    </div>
    {{invoice_block}}
    <div style="text-align:center;padding:22px 8px 4px;font-size:11px;color:#7A8E7A;line-height:1.7;">
      See you there, kaFAM! ♥<br/>
      <a href="{{site_url}}" style="color:#1A8040;text-decoration:none;">coletfs.com</a> &nbsp;·&nbsp; @coletfansuporta
    </div>
  </div>
</div>
$HTML$
WHERE key = 'event_ticket' AND html LIKE '%#0F1A0B%';

UPDATE public.email_templates
SET html = $HTML$
<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:4px;color:#1B3A2D;">CFS</div>
      <div style="font-size:11px;letter-spacing:3px;color:#5A7A60;margin-top:2px;">COLET FAN SUPORTA</div>
    </div>
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);padding:28px 28px 24px;">
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
    <div style="text-align:center;padding:22px 8px 4px;font-size:11px;color:#7A8E7A;line-height:1.7;">
      Thank you for supporting CFS Bini Colet ♥<br/>
      Questions? Reach us on our social channels.
    </div>
  </div>
</div>
$HTML$
WHERE key = 'order_confirmation' AND html LIKE '%#0F1A0B%';

UPDATE public.email_templates
SET html = $HTML$
<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:4px;color:#1B3A2D;">CFS</div>
      <div style="font-size:11px;letter-spacing:3px;color:#5A7A60;margin-top:2px;">COLET FAN SUPORTA</div>
    </div>
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);padding:32px 28px 26px;text-align:center;">
      <div style="font-size:36px;margin-bottom:10px;">♥</div>
      <h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.2;color:#1B3A2D;margin:0 0 10px;">Welcome, {{member_name}}!</h1>
      <p style="font-size:14px;color:#5A7A60;line-height:1.7;margin:0 0 18px;">You're officially part of the CFS fan community. Here's what you can do next:</p>
      <div style="text-align:left;background:#F7FAF5;border:1px solid #E4EDE4;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
        <ul style="color:#1B3A2D;font-size:13px;line-height:1.9;margin:0;padding-left:20px;">
          <li>Browse upcoming events at <a href="{{site_url}}/events" style="color:#1A8040;text-decoration:none;">coletfs.com/events</a></li>
          <li>Introduce yourself in the community feed</li>
          <li>Grab your fan card from your profile</li>
        </ul>
      </div>
      <a href="{{site_url}}/members" style="display:inline-block;background:#1A8040;color:#FFFFFF;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;padding:12px 24px;border-radius:10px;">EXPLORE MEMBERS AREA</a>
    </div>
    <div style="text-align:center;padding:22px 8px 4px;font-size:11px;color:#7A8E7A;line-height:1.7;">
      Salamat sa pagsuporta kay Colet ✦<br/>
      <a href="{{site_url}}" style="color:#1A8040;text-decoration:none;">coletfs.com</a> &nbsp;·&nbsp; @coletfansuporta
    </div>
  </div>
</div>
$HTML$
WHERE key = 'welcome' AND html LIKE '%#0F1A0B%';

-- donation_receipt already uses a paper-receipt template that is theme-neutral;
-- no update needed unless a future audit finds it stale.
