import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/paymongo";
import { sendDonationReceipt, sendEventTicket } from "@/lib/email";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("paymongo-signature") ?? "";

  const isValid = await verifyWebhookSignature(rawBody, signature);
  if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const payload = JSON.parse(rawBody);
  const eventType = payload.data?.attributes?.type;
  const eventData = payload.data?.attributes?.data;
  if (!eventType || !eventData) return NextResponse.json({ received: true });

  // PayMongo does not forward custom metadata from links to webhook events.
  // Instead, look up the payment_transactions row by payment_link_id to get reference_id + type.
  // For link.* events, the link ID is eventData.id.
  // For payment.* events, the link ID is in eventData.attributes.source.id.
  const linkId = eventData.id ?? eventData.attributes?.source?.id;
  if (!linkId) return NextResponse.json({ received: true });

  const supabase = createAdminClient();

  const { data: txn } = await (supabase.from("payment_transactions") as any)
    .select("reference_id, type, status")
    .eq("payment_link_id", linkId)
    .single();

  if (!txn) return NextResponse.json({ received: true });

  if (txn.status === "paid") {
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
      const { data: ticket } = await (supabase.from("event_tickets") as any)
        .update({ status: "active", payment_status: "paid" })
        .eq("id", reference)
        .select("id, ticket_number, user_id, event_id, event_tiers:tier_id(name, price), events:event_id(id, title, date, location, banner_url, price)")
        .single();

      if (ticket?.user_id && ticket?.events) {
        const { data: profile } = await supabase
          .from("profiles").select("email").eq("id", ticket.user_id).single();
        let email = (profile as any)?.email as string | null;
        if (!email) {
          try {
            const clerkUser = await clerkClient.users.getUser(ticket.user_id);
            email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
          } catch {}
        }
        if (email) {
          const ev   = ticket.events as any;
          const tier = ticket.event_tiers as any;

          // PayMongo shape: for payment.paid, eventData IS the payment.
          // For link.payment.paid, payment nested at eventData.attributes.payments[0].
          const payment       = eventData.attributes?.source ? eventData : eventData.attributes?.payments?.[0];
          const paidCentavos  = payment?.attributes?.amount ?? eventData.attributes?.amount ?? 0;
          const amountPaid    = paidCentavos ? paidCentavos / 100 : undefined;
          const paymentMethod = payment?.attributes?.source?.type ?? undefined;
          const paymongoRef   = payment?.id ?? eventData.id;
          const subtotal      = Number(tier?.price ?? ev.price ?? 0) || undefined;
          const fee           = amountPaid != null && subtotal != null ? Math.max(0, +(amountPaid - subtotal).toFixed(2)) : undefined;

          sendEventTicket({
            to: email,
            eventId: ev.id,
            eventTitle: ev.title,
            eventDate: ev.date,
            eventLocation: ev.location ?? "TBA",
            eventBanner: ev.banner_url ?? undefined,
            registrationId: ticket.ticket_number ?? ticket.id,
            tierName: tier?.name ?? "General Admission",
            subtotal,
            fee,
            amountPaid,
            paymentMethod,
            paymongoRef,
            paidAt: new Date().toISOString(),
          }).catch(() => {});
        }
      }
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
