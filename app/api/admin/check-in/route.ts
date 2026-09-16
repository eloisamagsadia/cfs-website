import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient();

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  const isEventStaff = !!(sessionClaims?.metadata as any)?.is_event_staff;
  const allowed = ["admin", "super_admin"].includes(role ?? "") || isEventStaff;
  if (!userId || !allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticket_id: rawTicketId } = await req.json();
  if (!rawTicketId) return NextResponse.json({ error: "Missing ticket_id" }, { status: 400 });

  const supabase = db();

  // Normalise whatever the scanner produced. Three QR formats exist in the
  // wild and only one used to work:
  //
  //   website  {"ticket_id":"<uuid>","ticket_number":"CFS-…"}  worked
  //   email    https://coletfs.com/verify/<uuid>               "Ticket not found"
  //   manual   CFS-XXXX / a bare uuid                          worked
  //
  // Emailed tickets encoded a verify URL, so the whole URL was used as the id
  // and every scan failed at the door — which is why staff had to issue comp
  // tickets to replace them. Normalising here rather than in the email fixes
  // tickets ALREADY sitting in people's inboxes, which a template change
  // cannot reach.
  const normaliseTicketId = (input: unknown): string => {
    let v = String(input ?? "").trim();
    // JSON payload from the website QR (the client already tries this, but a
    // different scanner app may hand us the raw string).
    if (v.startsWith("{")) {
      try {
        const o = JSON.parse(v);
        v = String(o.ticket_id ?? o.id ?? o.ticket_number ?? v).trim();
      } catch { /* fall through and treat as plain text */ }
    }
    // Verify URL from the emailed QR — take the last non-empty path segment.
    if (/^https?:\/\//i.test(v)) {
      try {
        const seg = new URL(v).pathname.split("/").filter(Boolean);
        if (seg.length) v = decodeURIComponent(seg[seg.length - 1]);
      } catch { /* malformed URL: leave as-is so the lookup fails honestly */ }
    }
    return v;
  };

  const ticket_id = normaliseTicketId(rawTicketId);
  if (!ticket_id) return NextResponse.json({ error: "Unreadable ticket code" }, { status: 400 });

  // Support lookup by UUID or ticket number (CFS-XXXX)
  const isTicketNumber = ticket_id.toUpperCase().startsWith("CFS-");
  const { data: ticket } = await (supabase as any)
    .from("event_tickets")
    .select(`
      *,
      profiles:user_id(id, display_name, avatar_url),
      event_tiers:tier_id(id, name, price, color),
      events:event_id(id, title, date, location)
    `)
    .eq(isTicketNumber ? "ticket_number" : "id", isTicketNumber ? ticket_id.toUpperCase() : ticket_id)
    .single();

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.status === "used") return NextResponse.json({ error: "Ticket already used", ticket }, { status: 409 });
  if (ticket.status === "cancelled") return NextResponse.json({ error: "Ticket is cancelled", ticket }, { status: 400 });
  if (ticket.status === "pending_payment") return NextResponse.json({ error: "Payment not completed", ticket }, { status: 400 });

  // Mark as used
  const { data: updated, error } = await (supabase as any)
    .from("event_tickets")
    .update({
      status: "used",
      checked_in_at: new Date().toISOString(),
      checked_in_by: userId,
    })
    .eq("id", ticket.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, ticket: { ...ticket, ...updated } });
}

export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  const isEventStaff = !!(sessionClaims?.metadata as any)?.is_event_staff;
  const allowed = ["admin", "super_admin"].includes(role ?? "") || isEventStaff;
  if (!userId || !allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticket_id = new URL(req.url).searchParams.get("ticket_id");
  if (!ticket_id) return NextResponse.json({ error: "Missing ticket_id" }, { status: 400 });

  const isTicketNumber = ticket_id.toUpperCase().startsWith("CFS-");
  const { data: ticket } = await (db() as any)
    .from("event_tickets")
    .select(`
      *,
      profiles:user_id(id, display_name, avatar_url),
      event_tiers:tier_id(id, name, price, color),
      events:event_id(id, title, date, location)
    `)
    .eq(isTicketNumber ? "ticket_number" : "id", isTicketNumber ? ticket_id.toUpperCase() : ticket_id)
    .single();

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}
