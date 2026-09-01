// Fixed HTML shell for the order confirmation email.
// Matches the event_ticket palette: cream background, white brand card,
// forest green accents, Georgia serif headings. Locked layout — admins
// edit only headline_text, intro_html, footer_html.

import { applyVars } from "@/lib/email";

export interface OrderConfirmationVars {
  order_short_id: string;
  items_table:    string; // pre-rendered <table>
  ship_name:      string;
  ship_line1:     string;
  ship_line2:     string;
  total:          string;
}

export interface OrderConfirmationSections {
  headline_text: string;
  intro_html:    string;
  footer_html:   string;
}

export function renderOrderConfirmation(vars: OrderConfirmationVars, sections: OrderConfirmationSections): string {
  const asVars = vars as unknown as Record<string, string>;
  const s = {
    headline_text: applyVars(sections.headline_text ?? "", asVars),
    intro_html:    applyVars(sections.intro_html    ?? "", asVars),
    footer_html:   applyVars(sections.footer_html   ?? "", asVars),
  };

  const introBlock = s.intro_html.trim()
    ? `<div style="padding:0 28px 8px;font-size:13px;color:#3A5A30;line-height:1.7;text-align:center;">${s.intro_html}</div>`
    : "";

  return `<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">

    <!-- Brand mark (locked) -->
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:4px;color:#1B3A2D;">CFS</div>
      <div style="font-size:11px;letter-spacing:3px;color:#5A7A60;margin-top:2px;">COLET FAN SUPORTA</div>
    </div>

    <!-- Card (locked shell) -->
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">
      <div style="height:8px;background:linear-gradient(90deg,#1A8040 0%,#F5C82A 55%,#E88C4A 100%);"></div>

      <div style="padding:30px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">ORDER PLACED ✦</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#1B3A2D;margin:14px 0 8px;">${s.headline_text}</h1>
        <div style="font-size:12px;color:#5A7A60;letter-spacing:1px;">ORDER ID · <strong style="color:#1B3A2D;letter-spacing:1.5px;">#${vars.order_short_id}</strong></div>
      </div>

      ${introBlock}

      <!-- Items table (locked) -->
      <div style="padding:20px 28px 8px;">
        <div style="background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:12px;padding:16px 18px;">
          ${vars.items_table}
        </div>
      </div>

      <!-- Shipping address (locked) -->
      <div style="padding:14px 28px 26px;">
        <div style="border-top:1px dashed #DDE8DD;padding-top:14px;">
          <div style="font-size:10px;letter-spacing:2px;color:#5A7A60;margin-bottom:6px;">SHIPPING TO</div>
          <div style="font-size:14px;color:#1B3A2D;font-weight:600;">${vars.ship_name}</div>
          <div style="font-size:12px;color:#5A7A60;margin-top:2px;">${vars.ship_line1}</div>
          <div style="font-size:12px;color:#5A7A60;">${vars.ship_line2}</div>
        </div>
      </div>
    </div>

    <!-- Footer (locked) -->
    <div style="text-align:center;padding:22px 8px 4px;font-size:11px;color:#7A8E7A;line-height:1.7;">
      ${s.footer_html}<br/>
      <a href="https://coletfs.com" style="color:#1A8040;text-decoration:none;">coletfs.com</a> &nbsp;·&nbsp; @coletfansuporta
    </div>

  </div>
</div>`;
}
