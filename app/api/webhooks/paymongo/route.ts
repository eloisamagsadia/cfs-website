import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/paymongo";
import { sendOrderConfirmation, sendEventTicket, sendDonationReceipt } from "@/lib/email";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paymongo-signature") ?? "";

  const isValid = await verifyWebhookSignature(rawBody, signature);
  if (!isValid) return NextResponse.json({ error:"Invalid signature" }, { status:401 });

  const payload = JSON.parse(rawBody);
  const eventType = payload.data?.attributes?.type;
  const eventData = payload.data?.attributes?.data;
  if (!eventType || !eventData) return NextResponse.json({ received:true });

  const supabase = createAdminClient();

  if (eventType === "payment.paid") {
    const { reference, type } = eventData.attributes?.metadata ?? {};

    if (type === "order" && reference) {
      const { data: orderRaw } = await (((supabase.from("orders") as any) as any) as any).update({ payment_status:"paid", paymongo_ref:eventData.id, order_status:"processing" }).eq("id", reference).select("*, profiles(*)").single();
  const order = orderRaw as any;
      if (order) {
        try {
          await sendOrderConfirmation({ to:(order as any).profiles?.email ?? "", orderId:order.id, items:order.items, total:order.total, shippingAddress:order.shipping_address });
        } catch (e) { console.error("Email error:", e); }
      }
    }

    if (type === "registration" && reference) {
      const { data: regRaw } = await (((supabase.from("event_registrations") as any) as any) as any).update({ payment_status:"paid", paymongo_ref:eventData.id }).eq("id", reference).select("*, events(*), profiles(*)").single();
  const reg = regRaw as any;
      if (reg) {
        try {
          await sendEventTicket({ to:(reg as any).profiles?.email ?? "", eventTitle:(reg as any).events?.title ?? "Event", eventDate:(reg as any).events?.date ?? "", eventLocation:(reg as any).events?.location ?? "", registrationId:reg.id });
        } catch (e) { console.error("Email error:", e); }
      }
    }

    if (type === "donation" && reference) {
      const { data: donationRaw } = await (((supabase.from("donations") as any) as any) as any).update({ status:"completed", paymongo_ref:eventData.id }).eq("id", reference).select("*, profiles(*)").single();
  const donation = donationRaw as any;
      if (donation) {
        try {
          await sendDonationReceipt({ to:(donation as any).profiles?.email ?? "", amount:donation.amount, message:donation.message, donationId:donation.id });
        } catch (e) { console.error("Email error:", e); }
      }
    }
  }

  if (eventType === "payment.failed") {
    const { reference, type } = eventData.attributes?.metadata ?? {};
    if (type === "order") await (((supabase.from("orders") as any) as any) as any).update({ payment_status:"failed" }).eq("id", reference);
    if (type === "registration") await (((supabase.from("event_registrations") as any) as any) as any).update({ payment_status:"failed" }).eq("id", reference);
    if (type === "donation") await (((supabase.from("donations") as any) as any) as any).update({ status:"failed" }).eq("id", reference);
  }

  return NextResponse.json({ received:true });
}
