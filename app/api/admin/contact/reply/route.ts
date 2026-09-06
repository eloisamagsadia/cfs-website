import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { Resend } from "resend";

// Reply to a contact message directly from /admin/contact — sends the
// email via Resend, records the reply text in contact_messages, and
// flips status to "replied" in one call. Admin no longer has to leave
// the panel just to open Gmail.
//
// POST /api/admin/contact/reply  { id, body }
export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, body } = await req.json().catch(() => ({}));
  if (!id || !body || typeof body !== "string" || body.trim().length < 2) {
    return NextResponse.json({ error: "id and non-empty body required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: msg } = await (admin as any).from("contact_messages")
    .select("id, name, email, topic, message, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  // Reply-To = the admin's own email so the sender's next reply lands
  // in that admin's inbox (noreply@ replies would be lost).
  let adminEmail: string | null = null;
  let adminName: string | null = null;
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    adminEmail = clerkUser.emailAddresses[0]?.emailAddress ?? null;
    adminName  = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "CFS Team";
  } catch { /* fall back to no reply-to */ }

  const FROM      = process.env.RESEND_FROM_EMAIL ?? "noreply@coletfs.com";
  const FROM_NAME = process.env.RESEND_FROM_NAME  ?? "Colet Fan Suporta";
  const resend    = new Resend(process.env.RESEND_API_KEY);

  // Tokenized Reply-To so guest replies land in Resend Inbound and can
  // be routed back to this exact conversation. The webhook at
  // /api/webhooks/resend-inbound parses the +<id> subaddress and appends
  // the guest's reply to contact_messages.replies. Falls back to the
  // admin's own email if the inbound domain isn't configured yet.
  const INBOUND_DOMAIN  = process.env.RESEND_INBOUND_DOMAIN ?? null;
  const INBOUND_LOCAL   = process.env.RESEND_INBOUND_LOCAL  ?? "replies";
  const tokenReplyTo    = INBOUND_DOMAIN ? `${INBOUND_LOCAL}+${id}@${INBOUND_DOMAIN}` : null;
  const finalReplyTo    = tokenReplyTo ?? adminEmail ?? undefined;

  const replyHtml = String(body)
    .split("\n")
    .map(line => `<p style="margin:0 0 12px;line-height:1.55;color:#1B3A2D;">${escapeHtml(line) || "&nbsp;"}</p>`)
    .join("");
  const originalQuote = String(msg.message)
    .split("\n")
    .map(line => `<div style="color:#7A8E7A;">&gt; ${escapeHtml(line) || "&nbsp;"}</div>`)
    .join("");
  const sentAt = new Date(msg.created_at).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#FAF6EE;font-family:'Barlow','Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:24px 20px;">
      <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:14px;padding:24px;">
        <div style="text-align:center;padding-bottom:14px;border-bottom:2px solid #1B3A2D;margin-bottom:16px;">
          <div style="font-family:Righteous,Arial,sans-serif;font-size:12px;letter-spacing:3px;color:#1A8040;">+ COLET FAN SUPORTA +</div>
          <div style="font-family:'DM Serif Display',Georgia,serif;font-size:15px;color:#1B3A2D;margin-top:4px;">Bini Colet Fansupport Community of the Philippines</div>
        </div>
        <p style="margin:0 0 12px;color:#1B3A2D;font-size:14px;">Hi ${escapeHtml(msg.name)},</p>
        <p style="margin:0 0 16px;color:#5A7A60;font-size:13px;">Thanks for reaching out. Here's our reply:</p>
        <div style="background:#F7FAF5;border-left:3px solid #1A8040;padding:14px 16px;border-radius:0 8px 8px 0;margin-bottom:20px;font-size:14px;">
          ${replyHtml}
        </div>
        <p style="margin:0 0 8px;color:#7A8E7A;font-size:11px;letter-spacing:1px;text-transform:uppercase;">You can reply directly to this email.</p>
        <details style="margin-top:16px;padding-top:14px;border-top:1px dashed #DDE8DD;">
          <summary style="cursor:pointer;font-size:12px;color:#7A8E7A;">Your original message (sent ${sentAt})</summary>
          <div style="margin-top:10px;padding:10px;background:#F7FAF5;border-radius:6px;font-size:12px;line-height:1.55;">${originalQuote}</div>
        </details>
        <div style="text-align:center;margin-top:20px;padding-top:14px;border-top:1px dashed #DDE8DD;font-size:11px;color:#7A8E7A;">
          — ${escapeHtml(adminName ?? "CFS Team")}, Colet Fan Suporta<br>
          <a href="https://coletfs.com" style="color:#1A8040;text-decoration:none;">coletfs.com</a>
        </div>
      </div>
    </div>
  </body></html>`;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM}>`,
      to: msg.email,
      subject: `Re: your message to Colet Fan Suporta`,
      html,
      reply_to: finalReplyTo,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Failed to send email: ${e.message ?? "unknown"}` }, { status: 502 });
  }

  // Append the reply to the JSONB thread so /admin/contact can render
  // the full conversation history. Falls back to just updating reply_note
  // if the replies column hasn't been added yet (migration not run).
  const now = new Date().toISOString();
  const newReply = {
    from:         "admin",       // distinguishes from inbound "guest" entries
    body,
    sent_at:      now,
    sent_by:      userId,
    sent_by_name: adminName,
  };

  // Load existing thread so we can append.
  const { data: existing } = await (admin as any).from("contact_messages")
    .select("replies")
    .eq("id", id)
    .maybeSingle();
  const currentThread = Array.isArray((existing as any)?.replies) ? (existing as any).replies : [];
  const nextThread = [...currentThread, newReply];

  const updatePayload: Record<string, unknown> = {
    status:     "replied",
    reply_note: body,           // kept for backward compat
    handled_by: userId,
    handled_at: now,
    replies:    nextThread,
  };

  let updErr = (await (admin as any).from("contact_messages").update(updatePayload).eq("id", id)).error;
  if (updErr && /replies/i.test(String(updErr.message ?? ""))) {
    // Column doesn't exist yet — retry without it.
    delete updatePayload.replies;
    updErr = (await (admin as any).from("contact_messages").update(updatePayload).eq("id", id)).error;
  }
  if (updErr) console.error("[contact/reply] update failed:", updErr);

  await logAudit({
    userId,
    action:      "reply_contact_message",
    target_type: "contact_message",
    target_id:   id,
    details:     { to: msg.email, chars: body.length },
    req,
  });

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
