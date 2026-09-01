// Fixed HTML shell for the event ticket email. The banner, QR block,
// buttons, invoice, brand card, and footer wrapper are locked here so
// admins can never break the layout. Admins edit only the "sections"
// (chip text, intro, reminder, footer signoff) which slot in below.

import { applyVars } from "@/lib/email";

export interface EventTicketVars {
  event_title: string;
  event_location: string;
  date_str: string;
  time_str: string;
  ticket_code: string;
  qr_src: string;
  gcal_url: string;
  tickets_url: string;
  site_url: string;
  banner_block: string;    // pre-rendered HTML (image or gradient)
  invoice_block: string;   // pre-rendered HTML or ""
}

export interface EventTicketSections {
  chip_text: string;
  intro_html: string;
  reminder_html: string;
  footer_html: string;
}

/**
 * Compose the final HTML from a locked shell + editable sections + dynamic vars.
 * Section values are applied AFTER var substitution so admins can reference
 * things like {{event_title}} or {{member_name}} inside their copy.
 */
export function renderEventTicket(vars: EventTicketVars, sections: EventTicketSections): string {
  const s = {
    chip_text:     applyVars(sections.chip_text     ?? "", vars as unknown as Record<string, string>),
    intro_html:    applyVars(sections.intro_html    ?? "", vars as unknown as Record<string, string>),
    reminder_html: applyVars(sections.reminder_html ?? "", vars as unknown as Record<string, string>),
    footer_html:   applyVars(sections.footer_html   ?? "", vars as unknown as Record<string, string>),
  };

  const introBlock = s.intro_html.trim()
    ? `<div style="padding:0 28px 8px;font-size:13px;color:#3A5A30;line-height:1.7;text-align:center;">${s.intro_html}</div>`
    : "";

  const reminderBlock = s.reminder_html.trim()
    ? `<div style="background:#EFF6EA;border:1px solid #DDE8DD;border-radius:12px;padding:16px 20px;margin-top:16px;font-size:12px;color:#3A5A30;line-height:1.6;">
        <div style="font-weight:700;letter-spacing:1.5px;font-size:11px;color:#1A8040;margin-bottom:6px;">BEFORE THE EVENT</div>
        ${s.reminder_html}
      </div>`
    : "";

  const chip = s.chip_text.trim()
    ? `<div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">${s.chip_text}</div>`
    : "";

  return `<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">

    <!-- Brand mark (locked) -->
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:0.5px;color:#1B3A2D;">Colet Fan Suporta</div>
      <div style="font-size:10px;letter-spacing:2.5px;color:#5A7A60;margin-top:4px;">OFFICIAL FAN CLUB</div>
    </div>

    <!-- Card (locked shell) -->
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">

      ${vars.banner_block}

      <div style="padding:28px 28px 8px;text-align:center;">
        ${chip}
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#1B3A2D;margin:14px 0 8px;">${vars.event_title}</h1>
        <div style="font-size:13px;color:#3A5A30;letter-spacing:0.5px;">${vars.date_str}</div>
        <div style="font-size:13px;color:#5A7A60;margin-top:2px;">${vars.time_str} &nbsp;·&nbsp; ${vars.event_location}</div>
      </div>

      ${introBlock}

      <!-- QR + Ticket ID (locked) -->
      <div style="padding:20px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:14px;padding:16px;">
          <img src="${vars.qr_src}" alt="Ticket QR" width="200" height="200" style="display:block;width:200px;height:200px;" />
        </div>
        <div style="margin-top:14px;font-size:10px;letter-spacing:2px;color:#5A7A60;">TICKET ID</div>
        <div style="font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:700;color:#1B3A2D;letter-spacing:2px;margin-top:2px;">${vars.ticket_code}</div>
        <div style="font-size:11px;color:#7A8E7A;margin-top:8px;">Scan at the door or show this ID to the CFS crew.</div>
      </div>

      <!-- CTAs (locked) -->
      <div style="padding:20px 28px 28px;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="padding:4px;">
              <a href="${vars.gcal_url}" target="_blank" style="display:inline-block;background:#1A8040;color:#FFFFFF;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;padding:12px 20px;border-radius:10px;box-shadow:0 4px 12px rgba(26,128,64,0.25);">ADD TO CALENDAR</a>
            </td>
            <td style="padding:4px;">
              <a href="${vars.tickets_url}" target="_blank" style="display:inline-block;background:#FFFFFF;color:#1B3A2D;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;padding:11px 19px;border-radius:10px;border:1.5px solid #DDE8DD;">VIEW MY TICKETS</a>
            </td>
          </tr>
        </table>
      </div>
    </div>

    ${vars.invoice_block}

    ${reminderBlock}

    <div style="text-align:center;padding:22px 8px 4px;font-size:11px;color:#7A8E7A;line-height:1.7;">
      ${s.footer_html}<br/>
      <a href="${vars.site_url}" style="color:#1A8040;text-decoration:none;">coletfs.com</a> &nbsp;·&nbsp; @coletfansuporta
    </div>

  </div>
</div>`;
}

export interface EventTicketSubjectSections {
  subject_template: string;
}
