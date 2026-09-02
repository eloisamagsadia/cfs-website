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

  let link;
  try {
    link = await createPaymentLink({
      amount: centavos,
      description: description ?? `CFS ${type}`,
      referenceId: ref ?? userId,
      type,
      remarks: `CFS ${type}`,
      redirectUrl,
    });
  } catch (e: any) {
    // Roll back pending donation if link creation fails
    if (type === "donation" && ref) {
      await (supabase.from("donations") as any).delete().eq("id", ref);
    }
    return NextResponse.json({ error: e.message ?? "Failed to create payment link" }, { status: 502 });
  }

  await (supabase.from("payment_transactions") as any).insert({
    user_id: userId,
    type,
    reference_id: ref,
    payment_link_id: link.id,
    amount: Number(amount),
    currency: "PHP",
    status: "pending",
    metadata: metadata ?? null,
  });

  return NextResponse.json({ checkout_url: link.checkoutUrl, payment_link_id: link.id, reference_id: ref });
}
