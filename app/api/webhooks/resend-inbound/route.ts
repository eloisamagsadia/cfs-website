import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// Receives inbound emails and appends them to a contact_messages thread.
// Called by our Cloudflare Email Worker (see docs/inbound-worker.md).
// When a guest replies to an admin's outgoing email, our outgoing Reply-To
// was tokenized as
//    replies+<contact_message_id>@coletfs.com
// The Worker POSTs the parsed email here; we use the +<id> subaddress
// to route the reply into the right conversation.
//
// Route path kept as /resend-inbound purely for URL stability. Auth is
// a shared secret in `x-cfs-inbound-secret`, compared against
// CFS_INBOUND_WEBHOOK_SECRET (falls back to RESEND_INBOUND_WEBHOOK_SECRET
// for backward compat with the old env name).
//
// Public route — /api/webhooks(.*) is already in middleware.ts publicRoutes.
export async function POST(req: NextRequest) {
  const secret =
    process.env.CFS_INBOUND_WEBHOOK_SECRET ??
    process.env.RESEND_INBOUND_WEBHOOK_SECRET ??
    null;

  if (secret) {
    const shared = req.headers.get("x-cfs-inbound-secret");
    if (shared !== secret) {
      return NextResponse.json({ error: "Bad secret" }, { status: 401 });
    }
  } else {
    console.warn("[inbound] CFS_INBOUND_WEBHOOK_SECRET not set — accepting all requests. Set it in prod.");
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // Resend Inbound event shape (fields we care about). See:
  //   https://resend.com/docs/dashboard/webhooks/inbound-events
  // Field names may drift as the product evolves — the type is loose.
  const data = body.data ?? body;
  const to        = firstAddress(data.to ?? data.envelope?.to);
  const from      = firstAddress(data.from ?? data.envelope?.from);
  const fromName  = firstName(data.from);
  const subject   = data.subject ?? "";
  const text      = data.text ?? "";
  const html      = data.html ?? "";
  const messageId = data.message_id ?? data.id ?? null;

  if (!to) return NextResponse.json({ error: "Missing 'to' address" }, { status: 400 });

  // Extract the contact_message_id from the +subaddress. Accepts:
  //   replies+<uuid>@coletfs.com  (our tokenized Reply-To)
  //   replies@coletfs.com          (untokenized — cannot route, ignore)
  const plusMatch = to.match(/^[^@+]+\+([^@]+)@/i);
  if (!plusMatch) {
    console.warn("[resend-inbound] No +token subaddress in", to);
    return NextResponse.json({ ok: true, ignored: "no-token" });
  }
  const contactId = plusMatch[1].trim();

  const admin = createAdminClient();
  const { data: msg } = await (admin as any).from("contact_messages")
    .select("id, replies, status")
    .eq("id", contactId)
    .maybeSingle();
  if (!msg) {
    console.warn("[resend-inbound] Unknown contact_message_id:", contactId);
    return NextResponse.json({ ok: true, ignored: "unknown-id" });
  }

  // Strip out common reply-quote junk ("> On Wed, ...") for a cleaner
  // preview. Keep the full raw text in raw_body for reference.
  const cleaned = stripQuotedReply(text || htmlToText(html));

  const entry = {
    from:         "guest",       // marks this as inbound in the UI
    body:         cleaned,
    raw_body:     text || html || "",
    subject,
    sent_at:      new Date().toISOString(),
    sent_by:      null,
    sent_by_name: fromName ?? from ?? "Guest",
    from_email:   from ?? null,
    message_id:   messageId,
  };

  const currentThread = Array.isArray((msg as any).replies) ? (msg as any).replies : [];
  const nextThread    = [...currentThread, entry];

  // Flip status back to "new" so the reply shows up in the NEW filter
  // and gets attention. If it was archived/spam we leave it alone.
  const nextStatus = (msg as any).status === "replied" ? "new" : (msg as any).status;

  await (admin as any).from("contact_messages")
    .update({ replies: nextThread, status: nextStatus })
    .eq("id", contactId);

  logAudit({
    userId:      "system",
    action:      "inbound_contact_reply",
    target_type: "contact_message",
    target_id:   contactId,
    details:     { from, subject, chars: cleaned.length },
  });

  return NextResponse.json({ ok: true, appended: true });
}

function firstAddress(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return v.replace(/^[^<]*<|>.*$/g, "").trim();
  if (Array.isArray(v)) return firstAddress(v[0]);
  if (typeof v === "object") return firstAddress(v.email ?? v.address);
  return null;
}
function firstName(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") {
    // "Name <email>"
    const m = v.match(/^\s*"?([^"<]+?)"?\s*<[^>]+>/);
    return m ? m[1].trim() : null;
  }
  if (Array.isArray(v)) return firstName(v[0]);
  if (typeof v === "object") return v.name ?? v.display_name ?? null;
  return null;
}
function stripQuotedReply(s: string): string {
  if (!s) return "";
  // Cut at common quote markers so we don't dupe the original thread.
  const cutters = [
    /^\s*On .+ wrote:\s*$/im,
    /^\s*From:\s+.+$/im,
    /^\s*-{2,}\s*Original Message\s*-{2,}$/im,
    /^\s*_{5,}\s*$/m,
  ];
  let cut = s.length;
  for (const rx of cutters) {
    const m = s.match(rx);
    if (m && m.index != null && m.index < cut) cut = m.index;
  }
  return s.slice(0, cut).trim();
}
function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
