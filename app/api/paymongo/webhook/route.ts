import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/paymongo";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paymongo-signature") ?? "";

  // TODO: re-enable signature verification before launch
  const isValid = await verifyWebhookSignature(rawBody, signature);
  if (!isValid) console.warn("[paymongo] Signature verification failed — proceeding anyway (bypass enabled)");

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

  const { data: txn } = await supabase
    .from("payment_transactions")
    .select("reference_id, type")
    .eq("payment_link_id", linkId)
    .single();

  console.log("[paymongo] txn lookup:", txn);
  if (!txn) return NextResponse.json({ received: true });

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
      await (supabase.from("donations") as any)
        .update({ status: "completed", paymongo_ref: eventData.id })
        .eq("id", reference);
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
