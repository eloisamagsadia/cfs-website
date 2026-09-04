import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentLink, tocentavos, calculateFee, type PaymentMethod } from "@/lib/paymongo";
import { logAudit } from "@/lib/audit";

// Creates a fresh PayMongo checkout link for a ticket the caller owns
// whose status is still pending_payment. Used when the original link
// has expired (PayMongo links live ~24h) or the buyer lost it.
//
// POST /api/members/regenerate-payment  { ticket_id }
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticket_id } = await req.json();
  if (!ticket_id) return NextResponse.json({ error: "ticket_id required" }, { status: 400 });

  const admin = createAdminClient();

  // Load the ticket, scoped to caller so nobody else can regenerate.
  const { data: ticket } = await (admin.from("event_tickets") as any)
    .select("id, ticket_number, bundle_id, status, tier_id, event_id, events:event_id(title), event_tiers:tier_id(name, price)")
    .eq("id", ticket_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if ((ticket as any).status !== "pending_payment") {
    return NextResponse.json({ error: "Ticket is not awaiting payment" }, { status: 400 });
  }

  const ref = (ticket as any).bundle_id ?? (ticket as any).id;

  // Recompute total: tier.price is the FLAT bundle total. Add QR PH fee
  // (that's what checkout defaults to, matching EventRegisterButton).
  const basePrice = Number((ticket as any).event_tiers?.price ?? 0);
  if (basePrice <= 0) return NextResponse.json({ error: "This ticket has no payable amount" }, { status: 400 });
  const method: PaymentMethod = "qrph";
  const fee = calculateFee(basePrice, method);
  const total = Math.round(basePrice + fee);

  // Grab any existing txn so we can preserve original metadata (payment_method choice).
  const { data: existingTxn } = await (admin.from("payment_transactions") as any)
    .select("id, metadata")
    .eq("reference_id", ref)
    .eq("user_id", userId)
    .eq("type", "ticket")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Bundle size for description enrichment
  let bundleSize = 1;
  if ((ticket as any).bundle_id) {
    const { count } = await (admin.from("event_tickets") as any)
      .select("id", { count: "exact", head: true })
      .eq("bundle_id", (ticket as any).bundle_id);
    bundleSize = count ?? 1;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const eventTitle = (ticket as any).events?.title ?? "CFS Event";
  const tierName = (ticket as any).event_tiers?.name ?? "Ticket";
  const description = bundleSize > 1
    ? `CFS · ${eventTitle} · ${tierName} × ${bundleSize} · REF ${(ticket as any).ticket_number}`
    : `CFS · ${eventTitle} · ${tierName} · REF ${(ticket as any).ticket_number}`;

  let link;
  try {
    link = await createPaymentLink({
      amount: tocentavos(total),
      description,
      referenceId: ref,
      type: "ticket",
      remarks: description.slice(0, 100),
      redirectUrl: `${appUrl}/payment/success?type=ticket&ref=${ref}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to create payment link" }, { status: 502 });
  }

  const newMetadata = {
    ...(((existingTxn as any)?.metadata as any) ?? {}),
    checkout_url: link.checkoutUrl,
    link_created_at: new Date().toISOString(),
    description,
    regenerated: true,
  };

  // Insert a fresh row so we keep the audit trail of the old attempts.
  await (admin.from("payment_transactions") as any).insert({
    user_id: userId,
    type: "ticket",
    reference_id: ref,
    payment_link_id: link.id,
    amount: total,
    currency: "PHP",
    status: "pending",
    metadata: newMetadata,
  });

  logAudit({
    userId,
    action: "regenerate_payment_link",
    target_type: "event_ticket",
    target_id: (ticket as any).id,
    details: { ref, new_link_id: link.id, amount: total },
    req,
  });

  return NextResponse.json({ checkout_url: link.checkoutUrl });
}
