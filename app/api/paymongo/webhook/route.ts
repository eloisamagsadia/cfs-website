import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/paymongo";
import { sendDonationReceipt } from "@/lib/email";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paymongo-signature") ?? "";

  const isValid = await verifyWebhookSignature(rawBody, signature);
  if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const payload = JSON.parse(rawBody);
  console.log("[paymongo] Event:", payload.data?.attributes?.type,
    "metadata:", JSON.stringify(payload.data?.attributes?.data?.attributes?.metadata));
  const eventType = payload.data?.attributes?.type;
  const eventData = payload.data?.attributes?.data;
  if (!eventType || !eventData) return NextResponse.json({ received: true });

  // PayMongo does not forward custom metadata from links to webhook events.
  // Instead, look up the payment_transactions row by payment_link_id to get reference_id + type.
  // For link.* events, the link ID is eventData.id.
  // For payment.* events, the link ID is in eventData.attributes.source.id.
  const linkId = eventData.id ?? eventData.attributes?.source?.id;
  console.log("[paymongo] linkId:", linkId);
  if (!linkId) return NextResponse.json({ received: true });

  const supabase = createAdminClient();

  const { data: txn } = await (supabase.from("payment_transactions") as any)
    .select("reference_id, type, status")
    .eq("payment_link_id", linkId)
    .single();

  console.log("[paymongo] txn lookup:", txn);
  if (!txn) return NextResponse.json({ received: true });

  if (txn.status === "paid") {
    console.log("[paymongo] Already processed, skipping");
    return NextResponse.json({ received: true });
  }

  const reference = txn.reference_id as string;
  const type = txn.type as string;

  if (eventType === "payment.paid" || eventType === "link.payment.paid") {
    await (supabase.from("payment_transactions") as any)
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("reference_id", reference)
      .eq("type", type);

    if (type === "ticket") {
      await (supabase.from("event_tickets") as any)
        .update({ status: "active", payment_status: "paid" })
        .eq("id", reference);
    }

    if (type === "donation") {
      const { data: donation } = await (supabase.from("donations") as any)
        .update({ status: "completed", paymongo_ref: eventData.id })
        .eq("id", reference)
        .select("amount, message, user_id")
        .single();

      if (donation?.user_id) {
        const { data: profile } = await supabase
          .from("profiles").select("email").eq("id", donation.user_id).single();
        let email = profile?.email as string | null;
        if (!email) {
          try {
            const clerkUser = await clerkClient.users.getUser(donation.user_id);
            email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
          } catch {}
        }
        if (email) {
          sendDonationReceipt({
            to: email,
            amount: Number(donation.amount),
            message: donation.message ?? undefined,
            donationId: reference,
          }).catch(() => {});
        }
      }
    }

    if (type === "order") {
      await (supabase.from("orders") as any)
        .update({ payment_status: "paid", paymongo_ref: eventData.id, order_status: "processing" })
        .eq("id", reference);
    }
  }

  if (eventType === "payment.failed" || eventType === "link.payment.failed") {
    await (supabase.from("payment_transactions") as any)
      .update({ status: "failed" })
      .eq("reference_id", reference)
      .eq("type", type);

    if (type === "ticket") {
      await (supabase.from("event_tickets") as any)
        .update({ payment_status: "failed" })
        .eq("id", reference);
    }

    if (type === "donation") {
      await (supabase.from("donations") as any)
        .update({ status: "failed" })
        .eq("id", reference);
    }

    if (type === "order") {
      await (supabase.from("orders") as any)
        .update({ payment_status: "failed" })
        .eq("id", reference);
    }
  }

  return NextResponse.json({ received: true });
}
