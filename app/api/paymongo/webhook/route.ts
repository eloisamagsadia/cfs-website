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
  const eventType = payload.data?.attributes?.type;
  const eventData = payload.data?.attributes?.data;
  if (!eventType || !eventData) return NextResponse.json({ received: true });

  const { reference, type } = (eventData.attributes?.metadata ?? {}) as { reference?: string; type?: string };
  if (!reference || !type) return NextResponse.json({ received: true });

  const supabase = createAdminClient();

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
