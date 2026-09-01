// Fixed HTML shell for the order confirmation email. The brand wrapper,
// items table, and shipping card are locked here. Admins edit only the
// headline text, optional intro, and footer signoff.

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
    ? `<div style="color:#8AAA78;font-size:13px;line-height:1.6;margin:0 0 14px;">${s.intro_html}</div>`
    : "";

  return `<div style="background:#0F1A0B;padding:32px;font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#3CCE2A;font-size:28px;letter-spacing:4px;margin:0;">CFS</h1>
    <p style="color:#8AAA78;margin:4px 0;">Colet Fan Suporta</p>
  </div>

  <div style="background:#1A2614;border:2px solid #2C4820;border-radius:12px;padding:24px;margin-bottom:20px;">
    <h2 style="color:#F0EAD6;font-size:18px;letter-spacing:2px;margin:0 0 8px;">${s.headline_text}</h2>
    <p style="color:#8AAA78;font-size:14px;margin:0 0 16px;">Order ID: <strong style="color:#F5C82A;">#${vars.order_short_id}</strong></p>
    ${introBlock}
    ${vars.items_table}
  </div>

  <div style="background:#1A2614;border:2px solid #2C4820;border-radius:12px;padding:20px;margin-bottom:20px;">
    <h3 style="color:#3CCE2A;font-size:13px;letter-spacing:2px;margin:0 0 10px;">SHIPPING TO</h3>
    <p style="color:#F0EAD6;font-size:14px;margin:0;">${vars.ship_name}</p>
    <p style="color:#8AAA78;font-size:13px;margin:4px 0;">${vars.ship_line1}</p>
    <p style="color:#8AAA78;font-size:13px;margin:0;">${vars.ship_line2}</p>
  </div>

  <p style="color:#5A7A50;font-size:12px;text-align:center;line-height:1.6;">
    ${s.footer_html}
  </p>
</div>`;
}
