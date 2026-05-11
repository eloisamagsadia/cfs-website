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
export async function sendDonationReceipt({
  to, amount, message, donationId,
}: {
  to: string;
  amount: number;
  message?: string;
  donationId: string;
}) {
  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to,
    subject: `♥ Thank you for your donation to CFS!`,
    html: `
      <div style="background:#0F1A0B;padding:32px;font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#3CCE2A;font-size:28px;letter-spacing:4px;margin:0;">CFS</h1>
        </div>
        <div style="background:#3D0A18;border:2px solid #F04060;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
          <div style="font-size:40px;margin-bottom:12px;">♥</div>
          <h2 style="color:#F0EAD6;font-size:22px;letter-spacing:2px;margin:0 0 8px;">SALAMAT!</h2>
          <p style="color:#F04060;font-size:28px;font-weight:bold;margin:0 0 8px;">₱${amount.toLocaleString()}</p>
          <p style="color:#8AAA78;font-size:13px;margin:0;">Donation #${donationId.slice(0, 8).toUpperCase()}</p>
          ${message ? `<p style="color:#F0EAD6;font-style:italic;font-size:14px;margin-top:12px;">"${message}"</p>` : ""}
        </div>
        <p style="color:#8AAA78;font-size:14px;text-align:center;line-height:1.8;">
          Your donation helps CFS do more for Colet and the entire Bini community.<br/>
          All fund usage is published in our quarterly transparency reports. ♥
        </p>
      </div>
    `,
  });
}
