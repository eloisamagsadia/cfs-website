// Fixed HTML shell for the donation receipt email — unified with the
// event ticket / welcome / order design (cream background, white brand
// card, green stripe, Georgia serif headline). The reference number,
// amount, and metadata are locked; admins edit only the intro line
// and the footer signoff.

import { applyVars } from "@/lib/email";

export interface DonationReceiptVars {
  amount:      string; // formatted (e.g. "500.00")
  ref_no:      string;
  date_str:    string;
  time_str:    string;
  message:     string; // optional donor message; empty string if none
  barcode_svg: string; // unused in the unified shell (kept for backwards compat)
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

  const introBlock = s.intro_line.trim()
    ? `<div style="padding:0 28px 8px;font-size:13px;color:#3A5A30;line-height:1.7;text-align:center;font-style:italic;">${s.intro_line}</div>`
    : "";

  const messageBlock = vars.message
    ? `<div style="padding:6px 28px 0;">
        <div style="background:#F7FAF5;border-left:3px solid #1A8040;border-radius:0 8px 8px 0;padding:10px 14px;font-size:12px;color:#3A5A30;font-style:italic;">"${vars.message}"</div>
       </div>`
    : "";

  return `<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">

    <!-- Brand mark (locked) -->
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:0.5px;color:#1B3A2D;">Colet Fan Suporta</div>
    </div>

    <!-- Card (locked shell) -->
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">
      <div style="height:8px;background:linear-gradient(90deg,#156530 0%,#1A8040 50%,#4ACB6E 100%);"></div>

      <div style="padding:30px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">OFFICIAL RECEIPT ♥</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#1B3A2D;margin:14px 0 8px;">Thank you for your support</h1>
        <div style="font-size:12px;color:#5A7A60;letter-spacing:1px;">REF · <strong style="color:#1B3A2D;letter-spacing:1.5px;">${vars.ref_no}</strong></div>
      </div>

      ${introBlock}

      <!-- Amount block (locked) -->
      <div style="padding:20px 28px 8px;">
        <div style="background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:12px;padding:20px 22px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:4px 0;color:#1B3A2D;font-size:13px;">Fan Support Donation</td>
              <td style="text-align:right;padding:4px 0;color:#1A8040;font-size:13px;font-weight:600;">₱${vars.amount}</td>
            </tr>
            <tr><td colspan="2" style="border-top:1px dashed #DDE8DD;padding-top:10px;"></td></tr>
            <tr>
              <td style="color:#1B3A2D;font-weight:700;padding:4px 0;font-size:16px;letter-spacing:1px;">TOTAL</td>
              <td style="color:#1A8040;font-weight:700;text-align:right;padding:4px 0;font-size:18px;font-family:Georgia,'Times New Roman',serif;">₱${vars.amount}</td>
            </tr>
          </table>
        </div>
      </div>

      ${messageBlock}

      <!-- Receipt metadata (locked) -->
      <div style="padding:14px 28px 26px;">
        <div style="border-top:1px dashed #DDE8DD;padding-top:14px;display:flex;justify-content:space-between;font-size:11px;color:#5A7A60;letter-spacing:1px;">
          <div><strong style="color:#1B3A2D;">DATE</strong> · ${vars.date_str}, ${vars.time_str}</div>
          <div><strong style="color:#1B3A2D;">METHOD</strong> · ONLINE</div>
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
