import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns receipt-shaped data for a ticket the caller owns. Used by
// /members/tickets/[id] to display an in-account receipt so members
// still have their proof of purchase when the confirmation email
// didn't arrive (Resend free-tier daily cap, spam folder, typo).
//
// GET /api/members/receipt?ticket_id=xxx
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticketId = new URL(req.url).searchParams.get("ticket_id");
  if (!ticketId) return NextResponse.json({ error: "ticket_id required" }, { status: 400 });

  const admin = createAdminClient();

  // Load ticket scoped to caller so nobody can peek at someone else's receipt.
  const { data: ticket } = await (admin.from("event_tickets") as any)
    .select("id, ticket_number, status, payment_status, tier_id, bundle_id, event_id, created_at, qr_data, event_tiers:tier_id(name, price), events:event_id(title, date, location)")
    .eq("id", ticketId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  // Payment transaction — reference_id is bundle_id for new bundle purchases,
  // ticket.id for legacy solo purchases. Try bundle_id first.
  let txn: any = null;
  if ((ticket as any).bundle_id) {
    const { data } = await (admin.from("payment_transactions") as any)
      .select("amount, currency, status, paid_at, metadata, reference_id")
      .eq("reference_id", (ticket as any).bundle_id)
      .eq("type", "ticket")
      .maybeSingle();
    txn = data ?? null;
  }
  if (!txn) {
    const { data } = await (admin.from("payment_transactions") as any)
      .select("amount, currency, status, paid_at, metadata, reference_id")
      .eq("reference_id", (ticket as any).id)
      .eq("type", "ticket")
      .maybeSingle();
    txn = data ?? null;
  }

  // Count all tickets sharing this bundle so a bundle receipt can say
  // "4 tickets purchased" not just "1".
  let bundleCount = 1;
  if ((ticket as any).bundle_id) {
    const { count } = await (admin.from("event_tickets") as any)
      .select("id", { count: "exact", head: true })
      .eq("bundle_id", (ticket as any).bundle_id);
    bundleCount = count ?? 1;
  }

  const tier = (ticket as any).event_tiers as any;
  const event = (ticket as any).events as any;
  const perTicketPrice = Number(tier?.price ?? 0);
  const bundleTotal = perTicketPrice * bundleCount;
  const amountPaid = txn?.amount != null ? Number(txn.amount) : (perTicketPrice > 0 ? bundleTotal : 0);
  const fee = amountPaid > 0 && bundleTotal > 0 ? Math.max(0, +(amountPaid - bundleTotal).toFixed(2)) : 0;

  return NextResponse.json({
    ticket: {
      id: (ticket as any).id,
      ticket_number: (ticket as any).ticket_number,
      status: (ticket as any).status,
      payment_status: (ticket as any).payment_status,
      bundle_id: (ticket as any).bundle_id,
      bundle_size: bundleCount,
      created_at: (ticket as any).created_at,
      is_comp: (ticket as any)?.qr_data?.comp_source === "admin_manual",
    },
    event: {
      title: event?.title ?? null,
      date: event?.date ?? null,
      location: event?.location ?? null,
    },
    tier: {
      name: tier?.name ?? "General Admission",
      unit_price: perTicketPrice,
    },
    payment: txn ? {
      amount_paid: amountPaid,
      subtotal: bundleTotal,
      fee,
      currency: txn.currency ?? "PHP",
      status: txn.status,
      paid_at: txn.paid_at,
      method: (txn.metadata as any)?.payment_method ?? null,
      reference: txn.reference_id,
    } : null,
  });
}
