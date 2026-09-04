import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentLink, tocentavos } from "@/lib/paymongo";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, donation_amount, description, type, reference_id, metadata, success_url } = await req.json();

  if (!amount || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const isManual = type === "donation" && metadata?.is_manual === true;
  const centavos = tocentavos(Number(amount));
  if (!isManual && centavos < 2000) {
    return NextResponse.json({ error: "Minimum amount is ₱20" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let ref = reference_id ?? null;
  const rawDriveIds: string[] = Array.isArray(metadata?.drive_ids) ? metadata.drive_ids : [];

  // For donations: create a pending record so the webhook (or admin, for manual) can update it
  if (type === "donation") {
    const { data: donation, error } = await (supabase.from("donations") as any)
      .insert({
        user_id: userId,
        amount: Number(amount),
        donation_amount: donation_amount ? Number(donation_amount) : null,
        message: metadata?.message ?? null,
        is_anonymous: metadata?.anonymous ?? false,
        payment_method: metadata?.payment_method ?? null,
        payment_channel: metadata?.payment_channel ?? metadata?.payment_method ?? null,
        drive_ids: rawDriveIds,
        is_manual: isManual,
        status: isManual ? "pending_manual" : "pending",
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "Failed to create donation record" }, { status: 500 });
    ref = donation.id;

    if (rawDriveIds.length > 0 && donation_amount) {
      const perDrive = Number(donation_amount) / rawDriveIds.length;
      const rows = rawDriveIds.map(id => ({ donation_id: ref, drive_id: id, amount: perDrive }));
      await (supabase.from("donation_drive_allocations") as any).insert(rows);
    }

    logAudit({
      userId,
      action: "make_donation",
      target_type: "donation",
      target_id: ref,
      details: {
        amount: Number(amount),
        donation_amount: donation_amount ? Number(donation_amount) : null,
        is_anonymous: !!metadata?.anonymous,
        is_manual: isManual,
        drive_count: rawDriveIds.length,
      },
      req,
    });
  }

  // Manual donations skip PayMongo entirely — the /payment/manual screen shows instructions.
  if (isManual) {
    await (supabase.from("payment_transactions") as any).insert({
      user_id: userId,
      type,
      reference_id: ref,
      payment_link_id: null,
      amount: Number(amount),
      currency: "PHP",
      status: "pending_manual",
      metadata: metadata ?? null,
    });
    return NextResponse.json({ manual: true, reference_id: ref });
  }

  const redirectUrl =
    success_url ??
    `${appUrl}/payment/success?type=${type}${ref ? `&ref=${ref}` : ""}`;

  // Build a rich, searchable description PayMongo will show in its
  // dashboard. CFS staff can then Ctrl+F for the ticket number, the
  // buyer's name, or the event, and land on the exact transaction.
  // Falls back to the client-provided description for types we don't
  // know how to enrich (donations already carry their own context).
  const enrichedDescription = await buildEnrichedDescription({
    supabase, type, ref, userId, fallback: description,
  });
  const enrichedRemarks = enrichedDescription.slice(0, 100); // PayMongo remarks cap

  let link;
  try {
    link = await createPaymentLink({
      amount: centavos,
      description: enrichedDescription,
      referenceId: ref ?? userId,
      type,
      remarks: enrichedRemarks,
      redirectUrl,
    });
  } catch (e: any) {
    // Roll back pending donation if link creation fails
    if (type === "donation" && ref) {
      await (supabase.from("donations") as any).delete().eq("id", ref);
    }
    return NextResponse.json({ error: e.message ?? "Failed to create payment link" }, { status: 502 });
  }

  // Store checkout_url + expiry hint inside metadata so a buyer who
  // closed the tab can resume the same payment from /members/tickets/[id]
  // without us having to re-create the link.
  const enrichedMetadata = {
    ...(metadata ?? {}),
    checkout_url: link.checkoutUrl,
    link_created_at: new Date().toISOString(),
    description: enrichedDescription,
  };

  await (supabase.from("payment_transactions") as any).insert({
    user_id: userId,
    type,
    reference_id: ref,
    payment_link_id: link.id,
    amount: Number(amount),
    currency: "PHP",
    status: "pending",
    metadata: enrichedMetadata,
  });

  return NextResponse.json({ checkout_url: link.checkoutUrl, payment_link_id: link.id, reference_id: ref });
}

// Build the description string PayMongo shows next to each transaction
// in its dashboard. Format:
//   "CFS · <EventTitle> · <TierName> × <qty> · <BuyerName> · REF <ticketNumber>"
// Keeping the "CFS" prefix + event title first makes the dashboard easy
// to filter by event when many are live at once.
async function buildEnrichedDescription({
  supabase, type, ref, userId, fallback,
}: {
  supabase: ReturnType<typeof createAdminClient>;
  type: string;
  ref: string | null;
  userId: string;
  fallback?: string;
}): Promise<string> {
  if (type !== "ticket" || !ref) return fallback ?? `CFS ${type}`;

  // ref is either a bundle_id (bundle purchase) or a ticket.id (solo).
  // Look up the first ticket for either shape.
  const { data: tByBundle } = await (supabase.from("event_tickets") as any)
    .select("ticket_number, event_tiers:tier_id(name), events:event_id(title), profiles:user_id(display_name)")
    .eq("bundle_id", ref)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { count: bundleCount } = tByBundle
    ? await (supabase.from("event_tickets") as any).select("id", { count: "exact", head: true }).eq("bundle_id", ref)
    : { count: 0 };

  const t = tByBundle ?? await (async () => {
    const { data } = await (supabase.from("event_tickets") as any)
      .select("ticket_number, event_tiers:tier_id(name), events:event_id(title), profiles:user_id(display_name)")
      .eq("id", ref)
      .maybeSingle();
    return data;
  })();

  if (!t) return fallback ?? `CFS ticket`;

  const event = (t as any).events ?? {};
  const tier = (t as any).event_tiers ?? {};
  const profile = (t as any).profiles ?? {};
  const qty = bundleCount && bundleCount > 1 ? ` × ${bundleCount}` : "";
  const tierName = tier.name ?? "Ticket";
  const eventTitle = event.title ?? "CFS Event";
  const buyer = profile.display_name ?? "Guest";
  const num = (t as any).ticket_number ?? ref.slice(0, 8);

  return `CFS · ${eventTitle} · ${tierName}${qty} · ${buyer} · REF ${num}`;
}
