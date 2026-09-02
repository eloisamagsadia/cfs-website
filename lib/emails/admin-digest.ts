import { resend } from "./resend";

interface DigestStat { label: string; value: string; sub?: string; }
interface DigestEvent { title: string; when: string; registered: number; capacity: number | null; }
interface DigestPayload {
  admin_email:   string;
  admin_name:    string;
  period_label:  string;         // e.g. "Aug 26 – Sep 1"
  stats:         DigestStat[];
  action_items:  { label: string; count: number; href: string }[];
  upcoming:      DigestEvent[];
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]!));
}

export async function sendAdminDigest(p: DigestPayload) {
  const SITE     = process.env.NEXT_PUBLIC_SITE_URL || "https://coletfs.com";
  const FROM     = process.env.RESEND_FROM_EMAIL   || "noreply@coletfs.com";
  const FROM_NAME = process.env.RESEND_FROM_NAME    || "Colet Fan Suporta";

  const statsHtml = p.stats.map(s => `
    <td style="width:33%;padding:12px 10px;text-align:center;vertical-align:top;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#1B3A2D;line-height:1.1;">${escape(s.value)}</div>
      <div style="font-size:10px;letter-spacing:1.5px;color:#5A7A60;text-transform:uppercase;margin-top:4px;">${escape(s.label)}</div>
      ${s.sub ? `<div style="font-size:11px;color:#7A8E7A;margin-top:2px;">${escape(s.sub)}</div>` : ""}
    </td>
  `).join("");

  const actionItemsHtml = p.action_items.length === 0
    ? `<div style="font-size:14px;color:#156530;line-height:1.6;">✓ All clear — nothing waiting on you.</div>`
    : `<ul style="margin:0;padding-left:20px;font-size:14px;color:#1B3A2D;line-height:1.8;">
        ${p.action_items.map(a => `<li><a href="${SITE}${a.href}" style="color:#1A8040;font-weight:600;text-decoration:none;">${escape(a.label)}</a> — <strong>${a.count}</strong> ${a.count === 1 ? "item" : "items"}</li>`).join("")}
      </ul>`;

  const upcomingHtml = p.upcoming.length === 0
    ? `<div style="font-size:13px;color:#7A8E7A;font-style:italic;">No events scheduled this week.</div>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        ${p.upcoming.map(e => `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #E4EDE4;">
              <div style="font-size:13px;color:#1B3A2D;font-weight:600;">${escape(e.title)}</div>
              <div style="font-size:11px;color:#5A7A60;">${escape(e.when)} · ${e.registered}${e.capacity ? "/" + e.capacity : ""} registered</div>
            </td>
          </tr>
        `).join("")}
      </table>`;

  const html = `<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:0.5px;color:#1B3A2D;">Colet Fan Suporta</div>
    </div>

    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">
      <div style="height:8px;background:linear-gradient(90deg,#156530 0%,#1A8040 50%,#4ACB6E 100%);"></div>

      <div style="padding:30px 28px 8px;text-align:center;">
        <div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">WEEKLY DIGEST</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;color:#1B3A2D;margin:14px 0 6px;">Here's your week</h1>
        <p style="font-size:13px;color:#4A7C59;margin:0;">${escape(p.period_label)}</p>
      </div>

      <div style="padding:16px 20px 8px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:12px;">
          <tr>${statsHtml}</tr>
        </table>
      </div>

      <div style="padding:14px 28px 6px;">
        <div style="font-size:11px;letter-spacing:1.5px;color:#5A7A60;text-transform:uppercase;font-weight:700;margin-bottom:8px;">Needs your attention</div>
        ${actionItemsHtml}
      </div>

      <div style="padding:18px 28px 28px;">
        <div style="font-size:11px;letter-spacing:1.5px;color:#5A7A60;text-transform:uppercase;font-weight:700;margin-bottom:8px;">This week's events</div>
        ${upcomingHtml}

        <div style="text-align:center;padding:22px 0 2px;">
          <a href="${SITE}/admin"
             style="display:inline-block;background:#1A8040;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:1.5px;padding:12px 22px;border-radius:10px;">
            OPEN ADMIN
          </a>
        </div>
      </div>
    </div>

    <div style="text-align:center;padding:22px 8px 4px;font-size:11px;color:#7A8E7A;line-height:1.7;">
      You're receiving this because you're an admin at Colet Fan Suporta.<br/>
      Colet Fan Suporta · <a href="${SITE}" style="color:#7A8E7A;">coletfansuporta.com</a>
    </div>
  </div>
</div>`;

  await resend.emails.send({
    from: `${FROM_NAME} <${FROM}>`,
    to:   p.admin_email,
    subject: `Weekly digest — ${p.period_label}`,
    html,
  });
}
