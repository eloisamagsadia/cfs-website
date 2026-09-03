import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

const resend    = new Resend(process.env.RESEND_API_KEY);
const FROM      = process.env.RESEND_FROM_EMAIL ?? "noreply@coletfs.com";
const FROM_NAME = process.env.RESEND_FROM_NAME  ?? "Colet Fan Suporta";
const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? "https://coletfansuporta.com";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return userId;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]!));
}

function renderShell(bodyHtml: string, unsubscribeUrl: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;background:#FAF6EE;padding:24px 12px;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#1B3A2D;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #DDE8DD;border-radius:12px;overflow:hidden;">
    <tr><td style="height:6px;background:linear-gradient(90deg,#156530 0%,#1A8040 50%,#4ACB6E 100%);"></td></tr>
    <tr><td style="padding:28px 32px 8px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:3px;color:#156530;">COLET FAN SUPORTA</div>
    </td></tr>
    <tr><td style="padding:12px 32px 28px;font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#1B3A2D;">
      ${bodyHtml}
    </td></tr>
    <tr><td style="padding:18px 32px;background:#F7FAF5;border-top:1px solid #E4EDE4;text-align:center;font-size:12px;color:#5A7A60;">
      You're receiving this because you subscribed at coletfansuporta.com.<br/>
      <a href="${unsubscribeUrl}" style="color:#8A1E27;text-decoration:underline;">Unsubscribe</a>
    </td></tr>
  </table>
</body></html>`;
}

// POST /api/admin/newsletter/broadcast  { subject, body, test_to?, scope? }
export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const subject = String(body?.subject ?? "").trim();
  const raw     = String(body?.body    ?? "").trim();
  const testTo  = body?.test_to ? String(body.test_to).trim() : "";
  const scope   = String(body?.scope ?? "active");

  if (!subject) return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  if (!raw)     return NextResponse.json({ error: "Body is required" }, { status: 400 });

  // Body accepts light HTML — if it looks like plain text, wrap paragraphs
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(raw);
  const bodyHtml = looksLikeHtml
    ? raw
    : raw.split(/\n{2,}/).map(p => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`).join("");

  // TEST send — one address, dummy unsubscribe link
  if (testTo) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo)) return NextResponse.json({ error: "Invalid test email" }, { status: 400 });
    const html = renderShell(bodyHtml, `${SITE_URL}/api/newsletter/unsubscribe?token=preview`);
    await resend.emails.send({ from: `${FROM_NAME} <${FROM}>`, to: testTo, subject: `[TEST] ${subject}`, html });
    await logAudit({ userId, action: "newsletter_test_send", target_type: "newsletter", details: { subject, to: testTo }, req });
    return NextResponse.json({ ok: true, test: true, sent_to: testTo });
  }

  // Real send
  const admin = createAdminClient();
  let q = (admin as any).from("newsletter_subscribers").select("id, email, unsubscribe_token").is("unsubscribed_at", null);
  if (scope !== "active" && scope !== "all") q = q.eq("source", scope);
  const { data: subs, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recipients = (subs as any[]) ?? [];
  if (recipients.length === 0) return NextResponse.json({ error: "No active subscribers to send to." }, { status: 400 });

  // One broadcast_id ties every recipient row + audit_log entry together, so
  // the history panel can aggregate open/bounce counts per send.
  const broadcastId = (globalThis as any).crypto?.randomUUID?.() ?? require("crypto").randomUUID();

  // Send in modest batches to avoid hammering Resend / running into rate limits
  const CHUNK = 20;
  let sent = 0, failed = 0;
  const errors: string[] = [];
  const deliveryRows: any[] = [];

  for (let i = 0; i < recipients.length; i += CHUNK) {
    const batch = recipients.slice(i, i + CHUNK);
    const results = await Promise.allSettled(batch.map(async (r: any) => {
      const url = `${SITE_URL}/api/newsletter/unsubscribe?token=${r.unsubscribe_token}`;
      const html = renderShell(bodyHtml, url);
      const res  = await resend.emails.send({ from: `${FROM_NAME} <${FROM}>`, to: r.email, subject, html });
      return { email: r.email, message_id: (res as any)?.data?.id ?? (res as any)?.id ?? null };
    }));
    for (const res of results) {
      if (res.status === "fulfilled") {
        sent++;
        const { email, message_id } = res.value as any;
        deliveryRows.push({ broadcast_id: broadcastId, message_id, email, subject, kind: "newsletter" });
      } else {
        failed++;
        errors.push(String((res as PromiseRejectedResult).reason?.message ?? "unknown"));
      }
    }
  }

  // Persist per-recipient send records so the Resend webhook can attach
  // delivery / open / bounce events by message_id later.
  if (deliveryRows.length > 0) {
    await (admin as any).from("email_deliveries").insert(deliveryRows);
  }

  await logAudit({
    userId,
    action: "newsletter_broadcast",
    target_type: "newsletter",
    target_id: broadcastId,
    details: { subject, scope, sent, failed, total: recipients.length, broadcast_id: broadcastId },
    req,
  });

  return NextResponse.json({ ok: true, sent, failed, total: recipients.length, broadcast_id: broadcastId, sample_errors: errors.slice(0, 3) });
}
