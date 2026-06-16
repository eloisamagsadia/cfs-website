import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@cfs-binicolet.com";
const FROM_NAME = process.env.RESEND_FROM_NAME ?? "CFS Bini Colet";

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
    .map(i => `<tr><td style="padding:8px 0;color:#F0EAD6;font-family:sans-serif;">${i.products?.name ?? "Item"} × ${i.quantity}</td><td style="padding:8px 0;color:#F07228;text-align:right;font-family:sans-serif;">₱${((i.products?.price ?? 0) * i.quantity).toLocaleString()}</td></tr>`)
    .join("");

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject: `✦ Order Confirmed! #${orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="background:#0F1A0B;padding:32px;font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#3CCE2A;font-size:28px;letter-spacing:4px;margin:0;">CFS</h1>
          <p style="color:#8AAA78;margin:4px 0;">Colet Fan Suporta</p>
        </div>
        <div style="background:#1A2614;border:2px solid #2C4820;border-radius:12px;padding:24px;margin-bottom:20px;">
          <h2 style="color:#F0EAD6;font-size:18px;letter-spacing:2px;margin:0 0 8px;">ORDER CONFIRMED ✦</h2>
          <p style="color:#8AAA78;font-size:14px;margin:0 0 16px;">Order ID: <strong style="color:#F5C82A;">#${orderId.slice(0, 8).toUpperCase()}</strong></p>
          <table style="width:100%;border-collapse:collapse;border-top:1px solid #2C4820;">
            ${itemRows}
            <tr><td colspan="2" style="border-top:1px solid #2C4820;padding-top:8px;"></td></tr>
            <tr><td style="color:#F0EAD6;font-weight:bold;padding:4px 0;font-family:sans-serif;">TOTAL</td><td style="color:#F07228;font-weight:bold;text-align:right;font-family:sans-serif;">₱${total.toLocaleString()}</td></tr>
          </table>
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
    `,
  });
}

// ─── EVENT TICKET CONFIRMATION ────────────────────────────────────────────────
export async function sendEventTicket({
  to, eventTitle, eventDate, eventLocation, registrationId, qrCode,
}: {
  to: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  registrationId: string;
  qrCode?: string;
}) {
  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject: `🎫 Your ticket for ${eventTitle}`,
    html: `
      <div style="background:#0F1A0B;padding:32px;font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#3CCE2A;font-size:28px;letter-spacing:4px;margin:0;">CFS</h1>
          <p style="color:#8AAA78;margin:4px 0;">Colet Fan Suporta</p>
        </div>
        <div style="background:#1A3D14;border:2px solid #3CCE2A;border-radius:12px;padding:24px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">🎫</div>
          <h2 style="color:#F0EAD6;font-size:20px;letter-spacing:2px;margin:0 0 6px;">${eventTitle}</h2>
          <p style="color:#3CCE2A;font-size:14px;margin:0 0 4px;">${new Date(eventDate).toLocaleDateString("en-PH", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
          <p style="color:#8AAA78;font-size:14px;margin:0 0 20px;">📍 ${eventLocation}</p>
          <div style="background:#0F1A0B;border-radius:8px;padding:12px;display:inline-block;">
            <p style="color:#F5C82A;font-size:12px;letter-spacing:2px;margin:0 0 4px;">TICKET ID</p>
            <p style="color:#F0EAD6;font-size:16px;font-weight:bold;margin:0;">${registrationId.slice(0, 12).toUpperCase()}</p>
          </div>
        </div>
        <p style="color:#5A7A50;font-size:12px;text-align:center;margin-top:20px;">
          Please present this email or your ticket ID at the event. See you there! ✦
        </p>
      </div>
    `,
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

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject: `Official Receipt #${refNo} — CFS Donation`,
    html: `
<div style="background:#f0f0f0;padding:32px 0;font-family:${mono};">
  <div style="background:#ffffff;max-width:380px;margin:0 auto;padding:32px 28px;box-shadow:0 4px 20px rgba(0,0,0,0.12);">

    <!-- Barcode -->
    <div style="margin-bottom:18px;">
      ${makeBarcode(donationId)}
    </div>

    <!-- Header -->
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:3px;color:#111;margin-bottom:4px;">OFFICIAL RECEIPT</div>
      <div style="font-size:15px;font-weight:bold;letter-spacing:2px;color:#111;">CFS — COLET FAN SUPORTA</div>
      <div style="font-size:10px;color:#666;margin-top:4px;letter-spacing:1px;">BINI COLET FAN SOCIETY</div>
    </div>

    <!-- Date / Time -->
    <div style="text-align:center;font-size:12px;color:#333;margin-bottom:18px;letter-spacing:1px;">
      ${date}&nbsp;&nbsp;&nbsp;${time}
    </div>

    <!-- Divider -->
    <div style="color:#aaa;font-size:11px;text-align:center;margin-bottom:14px;letter-spacing:1px;">${dash}</div>

    <!-- Column headers -->
    <table style="width:100%;border-collapse:collapse;font-size:11px;color:#888;letter-spacing:1px;">
      <tr>
        <td style="padding-bottom:8px;">DESCRIPTION</td>
        <td style="text-align:right;padding-bottom:8px;">AMT</td>
      </tr>
    </table>

    <!-- Line items -->
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#111;">
      <tr>
        <td style="padding:4px 0;">Fan Support Donation</td>
        <td style="text-align:right;padding:4px 0;">₱${Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
      </tr>
      ${message ? `<tr><td colspan="2" style="padding:4px 0;font-size:11px;color:#666;font-style:italic;">"${message}"</td></tr>` : ""}
    </table>

    <!-- Divider -->
    <div style="color:#aaa;font-size:11px;text-align:center;margin:14px 0;letter-spacing:1px;">${dash}</div>

    <!-- Total -->
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

    <!-- Divider -->
    <div style="color:#aaa;font-size:11px;text-align:center;margin:18px 0 14px;letter-spacing:1px;">${dash}</div>

    <!-- Footer -->
    <div style="text-align:center;font-size:11px;color:#555;line-height:1.9;letter-spacing:0.5px;">
      <div>Thank you for supporting Colet! ♥</div>
      <div style="margin-top:4px;">Fund usage published in quarterly reports.</div>
      <div style="margin-top:8px;color:#888;">coletfs.com</div>
      <div style="color:#888;">@coletfansuporta</div>
    </div>

  </div>
</div>
    `,
  });
}
