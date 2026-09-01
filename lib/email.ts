import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderEventTicket, type EventTicketSections } from "@/lib/email/shells/event-ticket";
import { renderDonationReceipt, type DonationReceiptSections } from "@/lib/email/shells/donation-receipt";
import { renderOrderConfirmation, type OrderConfirmationSections } from "@/lib/email/shells/order-confirmation";
import { resolveSections } from "@/lib/email-template-sections";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@cfs-binicolet.com";
const FROM_NAME = process.env.RESEND_FROM_NAME ?? "CFS Bini Colet";

// ─── TEMPLATE RENDERING ─────────────────────────────────────────────────────
// Templates live in the `email_templates` table with placeholders like
// {{event_title}}. If the table is missing, the row is missing, or the
// fetch throws, we return null so the caller falls back to its own
// hardcoded HTML — email sending never fails because of a template issue.

export type EmailTemplateKey = "event_ticket" | "donation_receipt" | "order_confirmation" | "welcome";

const escapeReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function applyVars(template: string, vars: Record<string, string | number | undefined | null>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    const val = v == null ? "" : String(v);
    out = out.replace(new RegExp(`\\{\\{\\s*${escapeReg(k)}\\s*\\}\\}`, "g"), val);
  }
  return out;
}

async function loadTemplate(key: EmailTemplateKey): Promise<{ subject: string; html: string; sections: Record<string, unknown> | null } | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await (supabase.from("email_templates") as any)
      .select("subject, html, sections")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return null;
    return { subject: data.subject, html: data.html, sections: (data.sections ?? null) as Record<string, unknown> | null };
  } catch {
    return null;
  }
}

/**
 * Render a stored template with the given variables, or return null so the
 * caller can use its hardcoded fallback. This is the safety net that
 * guarantees emails still send if the templates table has any issue.
 */
export async function renderTemplate(
  key: EmailTemplateKey,
  vars: Record<string, string | number | undefined | null>,
): Promise<{ subject: string; html: string } | null> {
  const tpl = await loadTemplate(key);
  if (!tpl) return null;
  return {
    subject: applyVars(tpl.subject, vars),
    html: applyVars(tpl.html, vars),
  };
}

// ─── ORDER CONFIRMATION ──────────────────────────────────────────────────────
export async function sendOrderConfirmation({
  to, orderId, items, total, shippingAddress,
}: {
  to: string;
  orderId: string;
  items: any[];
  total: number;
  shippingAddress: any;
}) {
  const itemRows = items
    .map(i => `<tr><td style="padding:6px 0;color:#1B3A2D;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;">${i.products?.name ?? "Item"} × ${i.quantity}</td><td style="padding:6px 0;color:#1A8040;text-align:right;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;">₱${((i.products?.price ?? 0) * i.quantity).toLocaleString()}</td></tr>`)
    .join("");

  const orderShortId = orderId.slice(0, 8).toUpperCase();
  const itemsTable = `<table style="width:100%;border-collapse:collapse;">
    ${itemRows}
    <tr><td colspan="2" style="border-top:1px dashed #DDE8DD;padding-top:8px;"></td></tr>
    <tr><td style="color:#1B3A2D;font-weight:700;padding:4px 0;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;letter-spacing:1px;">TOTAL</td><td style="color:#1A8040;font-weight:700;text-align:right;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;">₱${total.toLocaleString()}</td></tr>
  </table>`;

  const vars = {
    order_short_id: orderShortId,
    items_table: itemsTable,
    ship_name: shippingAddress.full_name,
    ship_line1: `${shippingAddress.street}, ${shippingAddress.barangay}`,
    ship_line2: `${shippingAddress.city}, ${shippingAddress.province} ${shippingAddress.zip_code}`,
    total: total.toLocaleString(),
  };

  let subject: string | null = null;
  let html:    string | null = null;

  const stored = await loadTemplate("order_confirmation");
  if (stored?.sections) {
    const sections = resolveSections("order_confirmation", stored.sections) as unknown as OrderConfirmationSections;
    html    = renderOrderConfirmation(vars, sections);
    subject = applyVars(stored.subject ?? "✦ Order Confirmed! #{{order_short_id}}", vars);
  } else if (stored?.html) {
    subject = applyVars(stored.subject, vars);
    html    = applyVars(stored.html, vars);
  }

  subject = subject ?? `✦ Order Confirmed! #${orderShortId}`;
  html    = html    ?? `
      <div style="background:#0F1A0B;padding:32px;font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#3CCE2A;font-size:28px;letter-spacing:4px;margin:0;">CFS</h1>
          <p style="color:#8AAA78;margin:4px 0;">Colet Fan Suporta</p>
        </div>
        <div style="background:#1A2614;border:2px solid #2C4820;border-radius:12px;padding:24px;margin-bottom:20px;">
          <h2 style="color:#F0EAD6;font-size:18px;letter-spacing:2px;margin:0 0 8px;">ORDER CONFIRMED ✦</h2>
          <p style="color:#8AAA78;font-size:14px;margin:0 0 16px;">Order ID: <strong style="color:#F5C82A;">#${orderShortId}</strong></p>
          ${itemsTable}
        </div>
        <div style="background:#1A2614;border:2px solid #2C4820;border-radius:12px;padding:20px;margin-bottom:20px;">
          <h3 style="color:#3CCE2A;font-size:13px;letter-spacing:2px;margin:0 0 10px;">SHIPPING TO</h3>
          <p style="color:#F0EAD6;font-size:14px;margin:0;">${shippingAddress.full_name}</p>
          <p style="color:#8AAA78;font-size:13px;margin:4px 0;">${shippingAddress.street}, ${shippingAddress.barangay}</p>
          <p style="color:#8AAA78;font-size:13px;margin:0;">${shippingAddress.city}, ${shippingAddress.province} ${shippingAddress.zip_code}</p>
        </div>
        <p style="color:#5A7A50;font-size:12px;text-align:center;">
          Thank you for supporting CFS Bini Colet! ♥<br/>
          For questions, contact us on our social media channels.
        </p>
      </div>
    `;

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject,
    html,
  });
}

// ─── EVENT TICKET CONFIRMATION ────────────────────────────────────────────────
function toGoogleCalendarDate(iso: string): string {
  // yyyymmddThhmmssZ
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function sendEventTicket({
  to, eventId, eventTitle, eventDate, eventEndDate, eventLocation, eventBanner, registrationId,
  tierName, subtotal, fee, amountPaid, paymentMethod, paymongoRef, paidAt,
}: {
  to: string;
  eventId?: string;
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string;
  eventLocation: string;
  eventBanner?: string;
  registrationId: string;
  // Invoice fields (optional — omit for free tickets)
  tierName?: string;
  subtotal?: number;
  fee?: number;
  amountPaid?: number;
  paymentMethod?: string;
  paymongoRef?: string;
  paidAt?: string;
}) {
  const SITE       = process.env.NEXT_PUBLIC_SITE_URL || "https://coletfs.com";
  const ticketCode = (registrationId ?? "").slice(0, 12).toUpperCase();
  const start      = new Date(eventDate);
  const end        = eventEndDate ? new Date(eventEndDate) : new Date(start.getTime() + 3 * 60 * 60 * 1000);

  const dateStr = start.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = start.toLocaleTimeString("en-PH",  { hour: "2-digit", minute: "2-digit", hour12: true });

  const qrData = eventId ? `${SITE}/verify/${registrationId}` : `TICKET:${registrationId}`;
  const qrSrc  = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(qrData)}`;

  const gcalUrl = "https://calendar.google.com/calendar/render?" + new URLSearchParams({
    action:   "TEMPLATE",
    text:     eventTitle,
    dates:    `${toGoogleCalendarDate(start.toISOString())}/${toGoogleCalendarDate(end.toISOString())}`,
    location: eventLocation,
    details:  `Your CFS ticket • ${ticketCode}\n\nView tickets: ${SITE}/members/tickets`,
  }).toString();

  const ticketsUrl = `${SITE}/members/tickets`;

  const bannerBlock = eventBanner
    ? `<img src="${eventBanner}" alt="${eventTitle}" width="600" style="display:block;width:100%;height:auto;border-top-left-radius:16px;border-top-right-radius:16px;object-fit:cover;max-height:260px;" />`
    : `<div style="height:12px;background:linear-gradient(90deg,#1A8040 0%,#F5C82A 55%,#E88C4A 100%);border-top-left-radius:16px;border-top-right-radius:16px;"></div>`;

  const invoiceBlock = amountPaid != null && amountPaid > 0 ? `
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;padding:22px 24px;margin-top:16px;">
      <div style="text-align:center;padding-bottom:14px;border-bottom:1px dashed #DDE8DD;">
        <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:3px;color:#1B3A2D;font-weight:700;">OFFICIAL RECEIPT</div>
        <div style="font-family:'Courier New',monospace;font-size:11px;color:#7A8E7A;margin-top:4px;letter-spacing:1px;">REF #${(paymongoRef ?? ticketCode).toString().slice(0, 20).toUpperCase()}</div>
      </div>
      <table style="width:100%;margin-top:14px;font-family:'Courier New',monospace;color:#1B3A2D;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 0;font-size:12px;">${tierName ?? "Event Ticket"}</td>
          <td style="text-align:right;padding:4px 0;font-size:12px;">₱${(subtotal ?? amountPaid).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
        </tr>
        ${fee != null && fee > 0 ? `
        <tr>
          <td style="padding:2px 0;font-size:11px;color:#7A8E7A;">Payment processing fee</td>
          <td style="text-align:right;padding:2px 0;font-size:11px;color:#7A8E7A;">₱${fee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
        </tr>` : ""}
        <tr><td colspan="2" style="border-top:1px dashed #DDE8DD;padding-top:8px;"></td></tr>
        <tr>
          <td style="font-weight:700;font-size:14px;letter-spacing:1px;">TOTAL PAID</td>
          <td style="text-align:right;font-weight:700;font-size:14px;color:#1A8040;">₱${amountPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding-top:10px;color:#7A8E7A;font-size:10px;letter-spacing:1.5px;">METHOD</td>
          <td style="text-align:right;padding-top:10px;color:#7A8E7A;font-size:10px;letter-spacing:1px;">${(paymentMethod ?? "ONLINE").toUpperCase().replace(/_/g, " ")}</td>
        </tr>
        <tr>
          <td style="color:#7A8E7A;font-size:10px;letter-spacing:1.5px;">DATE</td>
          <td style="text-align:right;color:#7A8E7A;font-size:10px;">${new Date(paidAt ?? Date.now()).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}</td>
        </tr>
      </table>
      <div style="text-align:center;margin-top:14px;padding-top:12px;border-top:1px dashed #DDE8DD;font-size:10px;color:#7A8E7A;letter-spacing:0.5px;">
        Keep this receipt for your records. Fund usage in quarterly reports.
      </div>
    </div>` : "";

  const vars = {
    event_title:    eventTitle,
    date_str:       dateStr,
    time_str:       timeStr,
    event_location: eventLocation,
    ticket_code:    ticketCode,
    qr_src:         qrSrc,
    gcal_url:       gcalUrl,
    tickets_url:    ticketsUrl,
    site_url:       SITE,
    banner_block:   bannerBlock,
    invoice_block:  invoiceBlock,
  };

  // Section-based path (preferred). If sections are present in DB, render
  // through the locked shell so the layout can't be broken. Falls back to
  // legacy html column, then to hardcoded HTML below.
  let subject: string | null = null;
  let html:    string | null = null;

  const stored = await loadTemplate("event_ticket");
  if (stored?.sections) {
    const sections = resolveSections("event_ticket", stored.sections) as unknown as EventTicketSections;
    html    = renderEventTicket(vars, sections);
    subject = applyVars(stored.subject ?? "Your ticket for {{event_title}} — {{ticket_code}}", vars);
  } else if (stored?.html) {
    subject = applyVars(stored.subject, vars);
    html    = applyVars(stored.html, vars);
  }

  subject = subject ?? `Your ticket for ${eventTitle} — ${ticketCode}`;
  html    = html    ?? `
<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">

    <!-- Brand mark -->
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:4px;color:#1B3A2D;">CFS</div>
      <div style="font-size:11px;letter-spacing:3px;color:#5A7A60;margin-top:2px;">COLET FAN SUPORTA</div>
    </div>

    <!-- Card -->
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">

      ${bannerBlock}

      <div style="padding:28px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">TICKET CONFIRMED ✦</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#1B3A2D;margin:14px 0 8px;">${eventTitle}</h1>
        <div style="font-size:13px;color:#3A5A30;letter-spacing:0.5px;">${dateStr}</div>
        <div style="font-size:13px;color:#5A7A60;margin-top:2px;">${timeStr} &nbsp;·&nbsp; ${eventLocation}</div>
      </div>

      <!-- QR + ID -->
      <div style="padding:20px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:14px;padding:16px;">
          <img src="${qrSrc}" alt="Ticket QR" width="200" height="200" style="display:block;width:200px;height:200px;" />
        </div>
        <div style="margin-top:14px;font-size:10px;letter-spacing:2px;color:#5A7A60;">TICKET ID</div>
        <div style="font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:700;color:#1B3A2D;letter-spacing:2px;margin-top:2px;">${ticketCode}</div>
        <div style="font-size:11px;color:#7A8E7A;margin-top:8px;">Scan at the door or show this ID to the CFS crew.</div>
      </div>

      <!-- CTAs -->
      <div style="padding:20px 28px 28px;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="padding:4px;">
              <a href="${gcalUrl}" target="_blank" style="display:inline-block;background:#1A8040;color:#FFFFFF;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;padding:12px 20px;border-radius:10px;box-shadow:0 4px 12px rgba(26,128,64,0.25);">ADD TO CALENDAR</a>
            </td>
            <td style="padding:4px;">
              <a href="${ticketsUrl}" target="_blank" style="display:inline-block;background:#FFFFFF;color:#1B3A2D;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;padding:11px 19px;border-radius:10px;border:1.5px solid #DDE8DD;">VIEW MY TICKETS</a>
            </td>
          </tr>
        </table>
      </div>

    </div>

    ${amountPaid != null && amountPaid > 0 ? `
    <!-- Invoice / Official Receipt -->
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;padding:22px 24px;margin-top:16px;">
      <div style="text-align:center;padding-bottom:14px;border-bottom:1px dashed #DDE8DD;">
        <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:3px;color:#1B3A2D;font-weight:700;">OFFICIAL RECEIPT</div>
        <div style="font-family:'Courier New',monospace;font-size:11px;color:#7A8E7A;margin-top:4px;letter-spacing:1px;">REF #${(paymongoRef ?? ticketCode).toString().slice(0, 20).toUpperCase()}</div>
      </div>
      <table style="width:100%;margin-top:14px;font-family:'Courier New',monospace;color:#1B3A2D;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 0;font-size:12px;">${tierName ?? "Event Ticket"}</td>
          <td style="text-align:right;padding:4px 0;font-size:12px;">₱${(subtotal ?? amountPaid).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
        </tr>
        ${fee != null && fee > 0 ? `
        <tr>
          <td style="padding:2px 0;font-size:11px;color:#7A8E7A;">Payment processing fee</td>
          <td style="text-align:right;padding:2px 0;font-size:11px;color:#7A8E7A;">₱${fee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
        </tr>` : ""}
        <tr><td colspan="2" style="border-top:1px dashed #DDE8DD;padding-top:8px;"></td></tr>
        <tr>
          <td style="font-weight:700;font-size:14px;letter-spacing:1px;">TOTAL PAID</td>
          <td style="text-align:right;font-weight:700;font-size:14px;color:#1A8040;">₱${amountPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding-top:10px;color:#7A8E7A;font-size:10px;letter-spacing:1.5px;">METHOD</td>
          <td style="text-align:right;padding-top:10px;color:#7A8E7A;font-size:10px;letter-spacing:1px;">${(paymentMethod ?? "ONLINE").toUpperCase().replace(/_/g, " ")}</td>
        </tr>
        <tr>
          <td style="color:#7A8E7A;font-size:10px;letter-spacing:1.5px;">DATE</td>
          <td style="text-align:right;color:#7A8E7A;font-size:10px;">${new Date(paidAt ?? Date.now()).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}</td>
        </tr>
      </table>
      <div style="text-align:center;margin-top:14px;padding-top:12px;border-top:1px dashed #DDE8DD;font-size:10px;color:#7A8E7A;letter-spacing:0.5px;">
        Keep this receipt for your records. Fund usage in quarterly reports.
      </div>
    </div>
    ` : ""}

    <!-- Reminders -->
    <div style="background:#EFF6EA;border:1px solid #DDE8DD;border-radius:12px;padding:16px 20px;margin-top:16px;font-size:12px;color:#3A5A30;line-height:1.6;">
      <div style="font-weight:700;letter-spacing:1.5px;font-size:11px;color:#1A8040;margin-bottom:6px;">BEFORE THE EVENT</div>
      Bring a valid ID. Doors typically open 30 minutes before start. Save this email — you'll need the QR or ticket ID to enter.
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:22px 8px 4px;font-size:11px;color:#7A8E7A;line-height:1.7;">
      See you there, kaFAM! ♥<br/>
      <a href="${SITE}" style="color:#1A8040;text-decoration:none;">coletfs.com</a> &nbsp;·&nbsp; @coletfansuporta
    </div>

  </div>
</div>
    `;

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject,
    html,
  });
}

// ─── EVENT TICKET BUNDLE (multiple tickets, one email) ──────────────────────
export async function sendEventTicketBundle({
  to, eventId, eventTitle, eventDate, eventEndDate, eventLocation, eventBanner,
  tickets, tierName, subtotal, fee, amountPaid, paymentMethod, paymongoRef, paidAt,
}: {
  to: string;
  eventId?: string;
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string;
  eventLocation: string;
  eventBanner?: string;
  tickets: { ticketNumber: string; ticketId: string }[];
  tierName?: string;
  subtotal?: number;
  fee?: number;
  amountPaid?: number;
  paymentMethod?: string;
  paymongoRef?: string;
  paidAt?: string;
}) {
  const SITE  = process.env.NEXT_PUBLIC_SITE_URL || "https://coletfs.com";
  const start = new Date(eventDate);
  const end   = eventEndDate ? new Date(eventEndDate) : new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const count = tickets.length;

  const dateStr = start.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = start.toLocaleTimeString("en-PH",  { hour: "2-digit", minute: "2-digit", hour12: true });

  const gcalUrl = "https://calendar.google.com/calendar/render?" + new URLSearchParams({
    action:   "TEMPLATE",
    text:     eventTitle,
    dates:    `${toGoogleCalendarDate(start.toISOString())}/${toGoogleCalendarDate(end.toISOString())}`,
    location: eventLocation,
    details:  `Your ${count} CFS tickets\n\nView tickets: ${SITE}/members/tickets`,
  }).toString();

  const ticketsUrl = `${SITE}/members/tickets`;

  const bannerBlock = eventBanner
    ? `<img src="${eventBanner}" alt="${eventTitle}" width="600" style="display:block;width:100%;height:auto;border-top-left-radius:16px;border-top-right-radius:16px;object-fit:cover;max-height:260px;" />`
    : `<div style="height:12px;background:linear-gradient(90deg,#1A8040 0%,#F5C82A 55%,#E88C4A 100%);border-top-left-radius:16px;border-top-right-radius:16px;"></div>`;

  const ticketCards = tickets.map((t, i) => {
    const code  = (t.ticketNumber ?? t.ticketId ?? "").toString().slice(0, 12).toUpperCase();
    const qrData = eventId ? `${SITE}/verify/${t.ticketId}` : `TICKET:${t.ticketId}`;
    const qrSrc  = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(qrData)}`;
    return `
      <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:14px;padding:20px;margin-top:${i === 0 ? 0 : 12}px;">
        <div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:9px;font-weight:700;letter-spacing:2px;padding:4px 10px;border-radius:999px;margin-bottom:10px;">TICKET ${i + 1} OF ${count}</div>
        <div style="text-align:center;">
          <div style="display:inline-block;background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:12px;padding:12px;">
            <img src="${qrSrc}" alt="Ticket QR" width="180" height="180" style="display:block;width:180px;height:180px;" />
          </div>
          <div style="margin-top:10px;font-size:9px;letter-spacing:2px;color:#5A7A60;">TICKET ID</div>
          <div style="font-family:'Courier New',Courier,monospace;font-size:16px;font-weight:700;color:#1B3A2D;letter-spacing:2px;margin-top:2px;">${code}</div>
        </div>
      </div>`;
  }).join("");

  const invoiceBlock = amountPaid != null && amountPaid > 0 ? `
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;padding:22px 24px;margin-top:16px;">
      <div style="text-align:center;padding-bottom:14px;border-bottom:1px dashed #DDE8DD;">
        <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:3px;color:#1B3A2D;font-weight:700;">OFFICIAL RECEIPT</div>
        <div style="font-family:'Courier New',monospace;font-size:11px;color:#7A8E7A;margin-top:4px;letter-spacing:1px;">REF #${(paymongoRef ?? tickets[0]?.ticketNumber ?? "").toString().slice(0, 20).toUpperCase()}</div>
      </div>
      <table style="width:100%;margin-top:14px;font-family:'Courier New',monospace;color:#1B3A2D;border-collapse:collapse;">
        <tr>
          <td style="padding:4px 0;font-size:12px;">${tierName ?? "Event Ticket"} × ${count}</td>
          <td style="text-align:right;padding:4px 0;font-size:12px;">₱${(subtotal ?? amountPaid).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
        </tr>
        ${fee != null && fee > 0 ? `
        <tr>
          <td style="padding:2px 0;font-size:11px;color:#7A8E7A;">Payment processing fee</td>
          <td style="text-align:right;padding:2px 0;font-size:11px;color:#7A8E7A;">₱${fee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
        </tr>` : ""}
        <tr><td colspan="2" style="border-top:1px dashed #DDE8DD;padding-top:8px;"></td></tr>
        <tr>
          <td style="font-weight:700;font-size:14px;letter-spacing:1px;">TOTAL PAID</td>
          <td style="text-align:right;font-weight:700;font-size:14px;color:#1A8040;">₱${amountPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding-top:10px;color:#7A8E7A;font-size:10px;letter-spacing:1.5px;">METHOD</td>
          <td style="text-align:right;padding-top:10px;color:#7A8E7A;font-size:10px;letter-spacing:1px;">${(paymentMethod ?? "ONLINE").toUpperCase().replace(/_/g, " ")}</td>
        </tr>
        <tr>
          <td style="color:#7A8E7A;font-size:10px;letter-spacing:1.5px;">DATE</td>
          <td style="text-align:right;color:#7A8E7A;font-size:10px;">${new Date(paidAt ?? Date.now()).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}</td>
        </tr>
      </table>
    </div>` : "";

  const subject = `Your ${count} tickets for ${eventTitle}`;
  const html = `
<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">

    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:4px;color:#1B3A2D;">CFS</div>
      <div style="font-size:11px;letter-spacing:3px;color:#5A7A60;margin-top:2px;">COLET FAN SUPORTA</div>
    </div>

    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">
      ${bannerBlock}
      <div style="padding:28px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">${count} TICKETS CONFIRMED ✦</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#1B3A2D;margin:14px 0 8px;">${eventTitle}</h1>
        <div style="font-size:13px;color:#3A5A30;letter-spacing:0.5px;">${dateStr}</div>
        <div style="font-size:13px;color:#5A7A60;margin-top:2px;">${timeStr} &nbsp;·&nbsp; ${eventLocation}</div>
      </div>
      <div style="padding:16px 28px 24px;">
        <p style="font-size:12px;color:#5A7A60;text-align:center;line-height:1.6;margin:0 0 12px;">Each ticket below has its own QR — scan any one to enter. Forward the codes to the friends coming with you.</p>
        ${ticketCards}
      </div>
      <div style="padding:0 28px 28px;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td style="padding:4px;">
              <a href="${gcalUrl}" target="_blank" style="display:inline-block;background:#1A8040;color:#FFFFFF;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;padding:12px 20px;border-radius:10px;box-shadow:0 4px 12px rgba(26,128,64,0.25);">ADD TO CALENDAR</a>
            </td>
            <td style="padding:4px;">
              <a href="${ticketsUrl}" target="_blank" style="display:inline-block;background:#FFFFFF;color:#1B3A2D;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1.5px;padding:11px 19px;border-radius:10px;border:1.5px solid #DDE8DD;">VIEW MY TICKETS</a>
            </td>
          </tr>
        </table>
      </div>
    </div>

    ${invoiceBlock}

    <div style="background:#EFF6EA;border:1px solid #DDE8DD;border-radius:12px;padding:16px 20px;margin-top:16px;font-size:12px;color:#3A5A30;line-height:1.6;">
      <div style="font-weight:700;letter-spacing:1.5px;font-size:11px;color:#1A8040;margin-bottom:6px;">BEFORE THE EVENT</div>
      Bring a valid ID. Doors typically open 30 minutes before start. Save this email — each attendee needs a QR or ticket ID to enter.
    </div>

    <div style="text-align:center;padding:22px 8px 4px;font-size:11px;color:#7A8E7A;line-height:1.7;">
      See you there, kaFAM! ♥<br/>
      <a href="${SITE}" style="color:#1A8040;text-decoration:none;">coletfs.com</a> &nbsp;·&nbsp; @coletfansuporta
    </div>

  </div>
</div>`;

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject,
    html,
  });
}

// ─── DONATION RECEIPT ────────────────────────────────────────────────────────
function makeBarcode(seed: string): string {
  // Generate pseudo-barcode SVG bars from the seed string
  const bars: string[] = [];
  let x = 0;
  const chars = (seed + seed).slice(0, 40);
  for (let i = 0; i < chars.length; i++) {
    const code = chars.charCodeAt(i);
    const w = (code % 3) + 1;   // 1, 2, or 3px wide
    const gap = (code % 2) + 1;
    if (i % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${w}" height="56" fill="#111"/>`);
    x += w + gap;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="56" style="display:block;margin:0 auto;">${bars.join("")}</svg>`;
}

export async function sendDonationReceipt({
  to, amount, message, donationId,
}: {
  to: string;
  amount: number;
  message?: string;
  donationId: string;
}) {
  const now    = new Date();
  const date   = now.toLocaleDateString("en-PH", { month: "2-digit", day: "2-digit", year: "numeric" }).replace(/\//g, "/");
  const time   = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true });
  const refNo  = donationId.slice(0, 12).toUpperCase();
  const dash   = "- - - - - - - - - - - - - - - - - - - - - -";
  const mono   = "Courier New, Courier, Lucida Console, monospace";

  const bodyHtml = `
  <div style="background:#ffffff;max-width:380px;margin:0 auto;padding:32px 28px;box-shadow:0 4px 20px rgba(0,0,0,0.12);">
    <div style="margin-bottom:18px;">
      ${makeBarcode(donationId)}
    </div>
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:3px;color:#111;margin-bottom:4px;">OFFICIAL RECEIPT</div>
      <div style="font-size:15px;font-weight:bold;letter-spacing:2px;color:#111;">CFS — COLET FAN SUPORTA</div>
      <div style="font-size:10px;color:#666;margin-top:4px;letter-spacing:1px;">BINI COLET FAN SOCIETY</div>
    </div>
    <div style="text-align:center;font-size:12px;color:#333;margin-bottom:18px;letter-spacing:1px;">
      ${date}&nbsp;&nbsp;&nbsp;${time}
    </div>
    <div style="color:#aaa;font-size:11px;text-align:center;margin-bottom:14px;letter-spacing:1px;">${dash}</div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;color:#888;letter-spacing:1px;">
      <tr>
        <td style="padding-bottom:8px;">DESCRIPTION</td>
        <td style="text-align:right;padding-bottom:8px;">AMT</td>
      </tr>
    </table>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#111;">
      <tr>
        <td style="padding:4px 0;">Fan Support Donation</td>
        <td style="text-align:right;padding:4px 0;">₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
      </tr>
      ${message ? `<tr><td colspan="2" style="padding:4px 0;font-size:11px;color:#666;font-style:italic;">"${message}"</td></tr>` : ""}
    </table>
    <div style="color:#aaa;font-size:11px;text-align:center;margin:14px 0;letter-spacing:1px;">${dash}</div>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="font-size:15px;font-weight:bold;color:#111;letter-spacing:1px;">TOTAL</td>
        <td style="text-align:right;font-size:15px;font-weight:bold;color:#111;">₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#888;padding-top:6px;letter-spacing:1px;">PAYMENT METHOD</td>
        <td style="text-align:right;font-size:11px;color:#888;padding-top:6px;">ONLINE</td>
      </tr>
      <tr>
        <td style="font-size:11px;color:#888;letter-spacing:1px;">REF NO.</td>
        <td style="text-align:right;font-size:11px;color:#888;">${refNo}</td>
      </tr>
    </table>
    <div style="color:#aaa;font-size:11px;text-align:center;margin:18px 0 14px;letter-spacing:1px;">${dash}</div>
    <div style="text-align:center;font-size:11px;color:#555;line-height:1.9;letter-spacing:0.5px;">
      <div>Thank you for supporting Colet! ♥</div>
      <div style="margin-top:4px;">Fund usage published in quarterly reports.</div>
      <div style="margin-top:8px;color:#888;">coletfs.com</div>
      <div style="color:#888;">@coletfansuporta</div>
    </div>
  </div>`;

  const vars = {
    ref_no: refNo,
    amount: Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 }),
    date_str: date,
    time_str: time,
    message: message ?? "",
    barcode_svg: makeBarcode(donationId),
    body_html: bodyHtml,
  };

  let subject: string | null = null;
  let html:    string | null = null;

  const stored = await loadTemplate("donation_receipt");
  if (stored?.sections) {
    const sections = resolveSections("donation_receipt", stored.sections) as unknown as DonationReceiptSections;
    html    = renderDonationReceipt(vars, sections);
    subject = applyVars(stored.subject ?? "Official Receipt #{{ref_no}} — CFS Donation", vars);
  } else if (stored?.html) {
    subject = applyVars(stored.subject, vars);
    html    = applyVars(stored.html, vars);
  }

  subject = subject ?? `Official Receipt #${refNo} — CFS Donation`;
  html    = html    ?? `<div style="background:#f0f0f0;padding:32px 0;font-family:${mono};">${bodyHtml}</div>`;

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject,
    html,
  });
}
