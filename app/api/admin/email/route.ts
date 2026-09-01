import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resend } from "@/lib/emails/resend";
import { applyVars } from "@/lib/email";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as any)?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipients, subject, html, message } = await req.json();
  if (!recipients?.length || !subject?.trim() || (!html?.trim() && !message?.trim())) {
    return NextResponse.json({ error: "Missing required fields (recipients, subject, html)" }, { status: 400 });
  }

  const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@coletfs.com";
  const FROM_NAME = process.env.RESEND_FROM_NAME ?? "Colet Fan Suporta";

  // Callers may still send `message` (plaintext) for backwards compat; wrap
  // it in a minimal shell so old flows keep working. New flows pass `html`.
  const rawHtml: string = html?.trim()
    ? String(html)
    : `<div style="background:#0F1A0B;padding:32px;font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1A2614;border:2px solid #2C4820;border-radius:12px;padding:24px;">
          <div style="color:#F0EAD6;font-size:14px;line-height:1.8;white-space:pre-wrap;">${String(message).replace(/</g, "&lt;")}</div>
        </div>
      </div>`;

  const errors: string[] = [];
  let sent = 0;

  for (const recipient of recipients) {
    try {
      const name = recipient.name ?? "there";
      const vars = { name, email: recipient.email ?? "" };
      // Support both {{name}} and legacy [NAME] placeholders.
      const legacySubject = String(subject).replace(/\[NAME\]/g, name);
      const legacyHtml    = rawHtml.replace(/\[NAME\]/g, name);
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM}>`,
        to: recipient.email,
        subject: applyVars(legacySubject, vars),
        html: applyVars(legacyHtml, vars),
      });
      sent++;
    } catch (e: any) {
      errors.push(`${recipient.email}: ${e.message}`);
    }
  }

  await logAudit({
    userId,
    action: "send_manual_email",
    target_type: "recipients",
    details: {
      subject: String(subject).slice(0, 200),
      recipient_count: recipients.length,
      sent,
      failed: errors.length,
    },
    req,
  });

  return NextResponse.json({ sent, errors });
}
