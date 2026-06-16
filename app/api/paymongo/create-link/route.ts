import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaymentLink, tocentavos } from "@/lib/paymongo";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, donation_amount, description, type, reference_id, metadata, success_url, failed_url } = await req.json();

  if (!amount || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const centavos = tocentavos(Number(amount));
  if (centavos < 2000) {
    return NextResponse.json({ error: "Minimum amount is ₱20" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let ref = reference_id ?? null;

  // For donations: create a pending record so the webhook can update it
  if (type === "donation") {
    const { data: donation, error } = await (supabase.from("donations") as any)
      .insert({
        user_id: userId,
        amount: Number(amount),
        donation_amount: donation_amount ? Number(donation_amount) : null,
        message: metadata?.message ?? null,
        is_anonymous: metadata?.anonymous ?? false,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: "Failed to create donation record" }, { status: 500 });
    ref = donation.id;
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
