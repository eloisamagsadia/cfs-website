import { resend } from "./resend";

interface TicketCancelledInput {
  email:         string;
  name:          string;
  eventTitle:    string;
  eventDate?:    Date | string | null;
  ticketNumber:  string;
  refundAmount?: number | null;    // pesos, or null/0 for no refund
  refundEta?:    string | null;    // e.g. "3–5 business days"
  reason?:       string | null;    // optional ops-side reason
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]!));
}

function fmtEventDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }) + " (PHT)";
}

function peso(n: number): string {
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function sendTicketCancelledEmail(input: TicketCancelledInput) {
  const SITE      = process.env.NEXT_PUBLIC_SITE_URL || "https://coletfs.com";
  const FROM      = process.env.RESEND_FROM_EMAIL   || "noreply@coletfs.com";
  const FROM_NAME = process.env.RESEND_FROM_NAME    || "Colet Fan Suporta";

  const eventWhen  = fmtEventDate(input.eventDate);
  const hasRefund  = typeof input.refundAmount === "number" && input.refundAmount > 0;
  const refundEta  = input.refundEta ?? "3–5 business days";

  const rows: [string, string][] = [
    ["Event",         input.eventTitle],
    ...(eventWhen ? [["When", eventWhen] as [string, string]] : []),
    ["Ticket #",      input.ticketNumber],
    ...(hasRefund
      ? [["Refund",   `${peso(input.refundAmount!)} — expected in ${refundEta}`] as [string, string]]
      : []),
  ];

  const html = `<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:0.5px;color:#1B3A2D;">Colet Fan Suporta</div>
    </div>

    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">
      <div style="height:8px;background:linear-gradient(90deg,#8A1E27 0%,#B54345 50%,#D97706 100%);"></div>

      <div style="padding:30px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#FFE8EC;color:#8A1E27;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">TICKET CANCELLED</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;color:#1B3A2D;margin:14px 0 6px;">Your ticket has been cancelled</h1>
        <p style="font-size:14px;color:#4A7C59;line-height:1.6;margin:0 0 4px;">
          Hi ${escape(input.name)} — we've cancelled your ticket for <strong>${escape(input.eventTitle)}</strong>${hasRefund ? " and started a refund" : ""}.
        </p>
      </div>

      <div style="padding:14px 28px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:12px;">
          ${rows.map(([k, v]) => `
            <tr>
              <td style="padding:10px 16px;font-size:12px;color:#5A7A60;letter-spacing:1px;text-transform:uppercase;width:110px;vertical-align:top;">${k}</td>
              <td style="padding:10px 16px 10px 0;font-size:14px;color:#1B3A2D;font-weight:600;word-break:break-word;">${escape(String(v))}</td>
            </tr>
          `).join("")}
        </table>
      </div>

      ${hasRefund ? `
      <div style="padding:16px 28px 4px;">
        <div style="font-size:13px;color:#1B3A2D;line-height:1.65;">
          Your ${peso(input.refundAmount!)} refund is on its way. Expect it in your original payment method within <strong>${escape(refundEta)}</strong>. We'll email again once it lands.
        </div>
      </div>
      ` : ""}

      ${input.reason ? `
      <div style="padding:12px 28px 4px;">
        <div style="font-size:12px;color:#5A7A60;background:#F7FAF5;border:1px solid #E4EDE4;border-radius:10px;padding:10px 12px;">
          <strong style="color:#1B3A2D;">Note from our team:</strong> ${escape(input.reason)}
        </div>
      </div>
      ` : ""}

      <div style="padding:22px 28px 28px;">
        <div style="font-size:13px;color:#5A7A60;line-height:1.65;text-align:center;">
          Questions? Just reply to this email — we'll get back to you within one business day.
        </div>
        <div style="text-align:center;padding:14px 0 2px;">
          <a href="${SITE}/support"
             style="display:inline-block;background:#1A8040;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1.5px;padding:12px 22px;border-radius:10px;">
            CONTACT SUPPORT
          </a>
        </div>
      </div>
    </div>

    <div style="text-align:center;padding:22px 8px 4px;font-size:11px;color:#7A8E7A;line-height:1.7;">
      Colet Fan Suporta · <a href="${SITE}" style="color:#7A8E7A;">coletfs.com</a>
    </div>
  </div>
</div>`;

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to:   input.email,
    subject: `Your ticket for ${input.eventTitle} has been cancelled`,
    html,
  });
}
