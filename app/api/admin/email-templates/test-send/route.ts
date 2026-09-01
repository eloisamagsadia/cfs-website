import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { applyVars } from "@/lib/email";
import { SAMPLE_VARS } from "@/lib/email-template-vars";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@cfs-binicolet.com";
const FROM_NAME = process.env.RESEND_FROM_NAME ?? "CFS Bini Colet";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return userId;
}

export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, subject, html, to } = await req.json();
  if (!key || !subject || !html) return NextResponse.json({ error: "Missing key/subject/html" }, { status: 400 });

  const sample = SAMPLE_VARS[key as keyof typeof SAMPLE_VARS] ?? {};

  let recipient: string | null = typeof to === "string" && to.trim() ? to.trim() : null;
  if (!recipient) {
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      recipient = clerkUser.emailAddresses[0]?.emailAddress ?? null;
    } catch {}
  }
  if (!recipient) return NextResponse.json({ error: "No recipient email — pass `to` or ensure your Clerk email is set" }, { status: 400 });

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM}>`,
      to: recipient,
      subject: `[TEST] ${applyVars(subject, sample)}`,
      html: applyVars(html, sample),
    });
    return NextResponse.json({ sent: true, to: recipient });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to send" }, { status: 500 });
  }
}
