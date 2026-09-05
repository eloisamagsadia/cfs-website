import { resend } from "./resend";

interface RefundSucceededInput {
  email:        string;
  name:         string;
  amount:       number;                     // pesos
  eta?:         string;                     // default "3–5 business days"
  reason?:      string | null;
  entityLabel?: string | null;              // e.g. "ticket cancellation" / "tier downgrade" / "order"
  refundRef?:   string | null;              // PayMongo ref for support lookups
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]!));
}

function peso(n: number) {
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function sendRefundSucceededEmail(input: RefundSucceededInput) {
  const SITE      = process.env.NEXT_PUBLIC_SITE_URL || "https://coletfs.com";
  const FROM      = process.env.RESEND_FROM_EMAIL   || "noreply@coletfs.com";
  const FROM_NAME = process.env.RESEND_FROM_NAME    || "Colet Fan Suporta";
  const eta       = input.eta ?? "3–5 business days";

  const rows: [string, string][] = [
    ["Amount",      peso(input.amount)],
    ["Expected in", eta],
    ...(input.entityLabel ? [["Reason", input.entityLabel] as [string, string]] : []),
    ...(input.refundRef   ? [["Reference", input.refundRef]  as [string, string]] : []),
  ];

  const html = `<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:0.5px;color:#1B3A2D;">Colet Fan Suporta</div>
    </div>

    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">
      <div style="height:8px;background:linear-gradient(90deg,#156530 0%,#1A8040 50%,#4ACB6E 100%);"></div>

      <div style="padding:30px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">REFUND SENT</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;color:#1B3A2D;margin:14px 0 6px;">Your refund is on its way</h1>
        <p style="font-size:14px;color:#4A7C59;line-height:1.6;margin:0 0 4px;">
          Hi ${escape(input.name)} — we've sent <strong>${peso(input.amount)}</strong> back to your original payment method.
        </p>
      </div>

      <div style="padding:14px 28px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:12px;">
          ${rows.map(([k, v]) => `
            <tr>
              <td style="padding:10px 16px;font-size:12px;color:#5A7A60;letter-spacing:1px;text-transform:uppercase;width:120px;vertical-align:top;">${k}</td>
              <td style="padding:10px 16px 10px 0;font-size:14px;color:#1B3A2D;font-weight:600;word-break:break-word;">${escape(String(v))}</td>
            </tr>
          `).join("")}
        </table>
      </div>

      <div style="padding:18px 28px 28px;">
        <div style="font-size:13px;color:#5A7A60;line-height:1.65;">
          You should see the refund in your bank or e-wallet within <strong>${escape(eta)}</strong>. If it takes longer than that, reply to this email and we'll check with PayMongo for you.
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
    subject: `Your ${peso(input.amount)} refund is on its way`,
    html,
  });
}
