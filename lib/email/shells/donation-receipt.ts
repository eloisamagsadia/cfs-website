// Fixed HTML shell for the donation receipt email. The barcode,
// receipt table, and brand wrapper are locked here so admins can never
// break the receipt layout. Admins edit only intro_line + footer_html.

import { applyVars } from "@/lib/email";

export interface DonationReceiptVars {
  amount:   string;    // formatted (e.g. "500.00")
  ref_no:   string;
  date_str: string;
  time_str: string;
  message:  string;    // optional donor message; empty string if none
  barcode_svg: string; // pre-rendered SVG string
}

export interface DonationReceiptSections {
  intro_line:  string;
  footer_html: string;
}

export function renderDonationReceipt(vars: DonationReceiptVars, sections: DonationReceiptSections): string {
  const asVars = vars as unknown as Record<string, string>;
  const s = {
    intro_line:  applyVars(sections.intro_line  ?? "", asVars),
    footer_html: applyVars(sections.footer_html ?? "", asVars),
  };

  const dash = "- - - - - - - - - - - - - - - - - - - - - -";
  const introBlock = s.intro_line.trim()
    ? `<div style="text-align:center;font-size:12px;color:#111;margin-bottom:14px;letter-spacing:0.5px;font-style:italic;">${s.intro_line}</div>`
    : "";
  const messageRow = vars.message
    ? `<tr><td colspan="2" style="padding:4px 0;font-size:11px;color:#666;font-style:italic;">"${vars.message}"</td></tr>`
    : "";

  return `<div style="background:#f0f0f0;padding:32px 0;font-family:'Courier New',Courier,monospace;">
  <div style="background:#ffffff;max-width:380px;margin:0 auto;padding:32px 28px;box-shadow:0 4px 20px rgba(0,0,0,0.12);">

    <div style="margin-bottom:18px;">${vars.barcode_svg}</div>

    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:3px;color:#111;margin-bottom:4px;">OFFICIAL RECEIPT</div>
      <div style="font-size:15px;font-weight:bold;letter-spacing:2px;color:#111;">CFS — COLET FAN SUPORTA</div>
      <div style="font-size:10px;color:#666;margin-top:4px;letter-spacing:1px;">BINI COLET FAN SOCIETY</div>
    </div>

    <div style="text-align:center;font-size:12px;color:#333;margin-bottom:18px;letter-spacing:1px;">
      ${vars.date_str}&nbsp;&nbsp;&nbsp;${vars.time_str}
    </div>

    <div style="color:#aaa;font-size:11px;text-align:center;margin-bottom:14px;letter-spacing:1px;">${dash}</div>

    ${introBlock}

    <table style="width:100%;border-collapse:collapse;font-size:11px;color:#888;letter-spacing:1px;">
      <tr>
        <td style="padding-bottom:8px;">DESCRIPTION</td>
        <td style="text-align:right;padding-bottom:8px;">AMT</td>
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#111;">
      <tr>
        <td style="padding:4px 0;">Fan Support Donation</td>
        <td style="text-align:right;padding:4px 0;">₱${vars.amount}</td>
      </tr>
      ${messageRow}
    </table>

    <div style="color:#aaa;font-size:11px;text-align:center;margin:14px 0;letter-spacing:1px;">${dash}</div>

    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="font-size:15px;font-weight:bold;color:#111;letter-spacing:1px;">TOTAL</td>
        <td style="text-align:right;font-size:15px;font-weight:bold;color:#111;">₱${vars.amount}</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#888;padding-top:6px;letter-spacing:1px;">PAYMENT METHOD</td>
        <td style="text-align:right;font-size:11px;color:#888;padding-top:6px;">ONLINE</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#888;letter-spacing:1px;">REF NO.</td>
        <td style="text-align:right;font-size:11px;color:#888;">${vars.ref_no}</td>
      </tr>
    </table>

    <div style="color:#aaa;font-size:11px;text-align:center;margin:18px 0 14px;letter-spacing:1px;">${dash}</div>

    <div style="text-align:center;font-size:11px;color:#555;line-height:1.9;letter-spacing:0.5px;">
      ${s.footer_html}
      <div style="margin-top:8px;color:#888;">coletfs.com</div>
      <div style="color:#888;">@coletfansuporta</div>
    </div>

  </div>
</div>`;
}
