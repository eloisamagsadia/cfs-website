import { resend } from "./resend";

interface SessionAlertInput {
  email:       string;
  name:        string;
  ip?:         string | null;
  userAgent?:  string | null;
  device?:     string | null;   // e.g. "Chrome on Macintosh"
  location?:   string | null;   // e.g. "San Pedro, Philippines"
  signInType?: string | null;   // e.g. "OAuth", "Password"
  when?:       Date;
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]!));
}

function fmt(d: Date) {
  return d.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }) + " (PHT)";
}

export async function sendSessionAlertEmail(input: SessionAlertInput) {
  const SITE     = process.env.NEXT_PUBLIC_SITE_URL || "https://coletfs.com";
  const FROM     = process.env.RESEND_FROM_EMAIL   || "noreply@coletfs.com";
  const FROM_NAME = process.env.RESEND_FROM_NAME    || "Colet Fan Suporta";

  const when   = input.when ?? new Date();
  const rows: [string, string][] = [
    ["Sign in",  input.signInType || "Web"],
    ["Device",   input.device     || input.userAgent || "Unknown device"],
    ["Location", input.location   || "Unknown"],
    ["IP",       input.ip         || "Unknown"],
    ["Time",     fmt(when)],
  ];

  const html = `<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:0.5px;color:#1B3A2D;">Colet Fan Suporta</div>
    </div>

    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">
      <div style="height:8px;background:linear-gradient(90deg,#156530 0%,#1A8040 50%,#4ACB6E 100%);"></div>

      <div style="padding:30px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">SECURITY NOTICE</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;color:#1B3A2D;margin:14px 0 6px;">New sign in to your account</h1>
        <p style="font-size:14px;color:#4A7C59;line-height:1.6;margin:0 0 4px;">
          Hi ${escape(input.name)} — a new device just signed in to your Colet Fan Suporta account.
        </p>
      </div>

      <div style="padding:14px 28px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:12px;">
          ${rows.map(([k, v]) => `
            <tr>
              <td style="padding:10px 16px;font-size:12px;color:#5A7A60;letter-spacing:1px;text-transform:uppercase;width:110px;">${k}</td>
              <td style="padding:10px 16px 10px 0;font-size:14px;color:#1B3A2D;font-weight:600;word-break:break-word;">${escape(String(v))}</td>
            </tr>
          `).join("")}
        </table>
      </div>

      <div style="padding:20px 28px 28px;">
        <div style="font-size:14px;color:#1B3A2D;line-height:1.65;margin:0 0 14px;">
          <strong>Was this you?</strong> Great — no action needed. If not, protect your account now:
        </div>
        <ol style="font-size:14px;color:#3A5A30;line-height:1.7;padding-left:20px;margin:0 0 18px;">
          <li>Sign out of every device from
            <a href="${SITE}/members/account/settings" style="color:#1A8040;font-weight:600;">Account settings</a>.
          </li>
          <li>Change your password (or your OAuth provider's password) immediately.</li>
          <li>Reply to this email so our team can help lock the account down.</li>
        </ol>
        <div style="text-align:center;padding:6px 0 2px;">
          <a href="${SITE}/members/account/settings"
             style="display:inline-block;background:#1A8040;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1.5px;padding:12px 22px;border-radius:10px;">
            REVIEW ACCOUNT
          </a>
        </div>
      </div>
    </div>

    <div style="text-align:center;padding:22px 8px 4px;font-size:11px;color:#7A8E7A;line-height:1.7;">
      You're receiving this because a sign-in happened on your account.<br/>
      Colet Fan Suporta · <a href="${SITE}" style="color:#7A8E7A;">coletfansuporta.com</a>
    </div>
  </div>
</div>`;

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to:   input.email,
    subject: "New sign in to your Colet Fan Suporta account",
    html,
  });
}
