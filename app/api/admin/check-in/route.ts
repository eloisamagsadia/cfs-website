import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticket_id } = await req.json();
  if (!ticket_id) return NextResponse.json({ error: "Missing ticket_id" }, { status: 400 });

  const supabase = db();

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
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
