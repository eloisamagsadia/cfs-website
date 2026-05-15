import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resend } from "@/lib/emails/resend";

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as any)?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { recipients, subject, message } = await req.json();
  if (!recipients?.length || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@coletfs.com";
  const FROM_NAME = process.env.RESEND_FROM_NAME ?? "CFS Bini Colet";

  const errors: string[] = [];
  let sent = 0;

  for (const recipient of recipients) {
    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM}>`,
        to: recipient.email,
        subject: subject.replace(/\[NAME\]/g, recipient.name ?? "there"),
        html: `
          <div style="background:#0F1A0B;padding:32px;font-family:sans-serif;max-width:600px;margin:0 auto;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="color:#3CCE2A;font-size:28px;letter-spacing:4px;margin:0;">CFS</h1>
              <p style="color:#8AAA78;margin:4px 0;">Colet Fan Suporta</p>
            </div>
            <div style="background:#1A2614;border:2px solid #2C4820;border-radius:12px;padding:24px;">
              <p style="color:#8AAA78;font-size:13px;margin:0 0 4px;">Hi ${recipient.name ?? "there"},</p>
              <div style="color:#F0EAD6;font-size:14px;line-height:1.8;white-space:pre-wrap;">${message.replace(/\[NAME\]/g, recipient.name ?? "there")}</div>
            </div>
            <p style="color:#5A7A50;font-size:12px;text-align:center;margin-top:20px;">
              CFS Bini Colet Fan Club — coletfs.com
            </p>
          </div>
        `,
      });
      sent++;
    } catch (e: any) {
      errors.push(`${recipient.email}: ${e.message}`);
    }
  }

  return NextResponse.json({ sent, errors });
}
