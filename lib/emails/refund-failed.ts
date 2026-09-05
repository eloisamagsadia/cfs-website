import { resend } from "./resend";

interface RefundFailedInput {
  email:        string;
  name:         string;
  amount:       number;                     // pesos
  reason?:      string | null;              // PayMongo-side failure text
  entityLabel?: string | null;              // e.g. "ticket cancellation" / "tier downgrade"
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]!));
}

function peso(n: number) {
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function sendRefundFailedEmail(input: RefundFailedInput) {
  const SITE      = process.env.NEXT_PUBLIC_SITE_URL || "https://coletfs.com";
  const FROM      = process.env.RESEND_FROM_EMAIL   || "noreply@coletfs.com";
  const FROM_NAME = process.env.RESEND_FROM_NAME    || "Colet Fan Suporta";

  const html = `<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:0.5px;color:#1B3A2D;">Colet Fan Suporta</div>
    </div>

    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">
      <div style="height:8px;background:linear-gradient(90deg,#8A1E27 0%,#B54345 50%,#D97706 100%);"></div>

      <div style="padding:30px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#FFE8EC;color:#8A1E27;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">REFUND NEEDS ATTENTION</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;color:#1B3A2D;margin:14px 0 6px;">We hit a snag on your refund</h1>
        <p style="font-size:14px;color:#4A7C59;line-height:1.6;margin:0 0 4px;">
          Hi ${escape(input.name)} — your <strong>${peso(input.amount)}</strong> refund${input.entityLabel ? ` for the ${escape(input.entityLabel)}` : ""} didn't go through automatically.
        </p>
      </div>

      <div style="padding:14px 28px 8px;">
        <div style="background:#FFE8EC;border:1px solid #F1C0C6;border-radius:10px;padding:12px 14px;font-size:13px;color:#8A1E27;line-height:1.6;">
          <strong>Why:</strong> ${escape(input.reason ?? "our payment processor rejected the automatic refund")}.
        </div>
      </div>

      <div style="padding:18px 28px 28px;">
        <div style="font-size:14px;color:#1B3A2D;line-height:1.65;margin:0 0 12px;">
          <strong>What happens next:</strong> our team will manually process your refund within one business day. You don't need to do anything — we'll email again once it's sent.
        </div>
        <div style="font-size:13px;color:#5A7A60;line-height:1.65;">
          If you'd like to check in or share a different payment method, just reply to this email.
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
    subject: `Your ${peso(input.amount)} refund needs attention`,
    html,
  });
}
