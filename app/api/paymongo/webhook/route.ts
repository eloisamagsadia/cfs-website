import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/paymongo";
import { sendDonationReceipt, sendEventTicket, sendEventTicketBundle } from "@/lib/email";
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

  const supabase = createAdminClient();

  // ─── Refund events ────────────────────────────────────────────────
  // Fired after we call POST /v1/refunds from the admin. Keyed by the
  // refund id (ref_xxx) which we stored in refunds.paymongo_ref.
  //
  // PayMongo event names on our webhook:
  //   payment.refund.updated  → status transitions (pending / succeeded / failed)
  //   payment.refunded        → convenience "payment is fully refunded" signal (treat as succeeded)
  if (eventType === "payment.refund.updated" || eventType === "payment.refunded") {
    const refundId = eventData.id as string | undefined;
    const attrs    = eventData.attributes ?? {};
    // payment.refunded doesn't carry a refund status — treat it as succeeded.
    const pmStatus = (eventType === "payment.refunded"
      ? "succeeded"
      : attrs.status) as "pending" | "succeeded" | "failed" | undefined;
    if (!refundId || !pmStatus) return NextResponse.json({ received: true });

    const { data: row } = await (supabase.from("refunds") as any)
      .select("id, status, entity_type, entity_id, note")
      .eq("paymongo_ref", refundId)
      .maybeSingle();
    if (!row) return NextResponse.json({ received: true, refund_id: refundId, matched: false });

    // Idempotent — already-final status, don't rewrite
    if (row.status === "completed" || row.status === "failed") return NextResponse.json({ received: true, refund_id: refundId, idempotent: true });

    if (pmStatus === "succeeded") {
      const patch: any = { status: "completed", processed_at: new Date().toISOString() };
      await (supabase.from("refunds") as any).update(patch).eq("id", row.id);

      // Same downstream sync as the admin PATCH handler — mirror it so
      // webhook-completed refunds behave identically to manually-marked ones.
      if (row.entity_type === "order") {
        await (supabase.from("orders") as any).update({ payment_status: "refunded" }).eq("id", row.entity_id);
      } else if (row.entity_type === "donation") {
        await (supabase.from("donations") as any).update({ status: "refunded" }).eq("id", row.entity_id);
      } else if (row.entity_type === "event_registration") {
        const byBundle = await (supabase.from("event_tickets") as any)
          .update({ status: "cancelled", payment_status: "refunded" })
          .eq("bundle_id", row.entity_id).select("id");
        if (!byBundle.data?.length) {
          await (supabase.from("event_tickets") as any)
            .update({ status: "cancelled", payment_status: "refunded" })
            .eq("id", row.entity_id);
        }
      } else if (row.entity_type === "event_ticket") {
        const note  = String(row?.note ?? "");
        const match = note.match(/\[tier_change_target:([0-9a-f-]{36})\]/i);
        if (match) {
          // Tier downgrade — swap the tier, don't cancel
          await (supabase.from("event_tickets") as any).update({ tier_id: match[1] }).eq("id", row.entity_id);
        } else {
          await (supabase.from("event_tickets") as any)
            .update({ status: "cancelled", payment_status: "refunded" })
            .eq("id", row.entity_id);
        }
      }
    } else if (pmStatus === "failed") {
      const reason = attrs.failure_reason ?? attrs.reason ?? "unknown";
      await (supabase.from("refunds") as any)
        .update({
          status: "failed",
          note:   `${row.note ?? ""}\n[paymongo_failed:${new Date().toISOString()}] ${reason}`,
        })
        .eq("id", row.id);
    }
    // pmStatus === "pending" — stay in processing, nothing to update

    return NextResponse.json({ received: true, refund_id: refundId, pm_status: pmStatus });
  }

  // ─── Payment/link events ──────────────────────────────────────────
  // PayMongo does not forward custom metadata from links to webhook events.
  // Instead, look up the payment_transactions row by payment_link_id to get reference_id + type.
  // For link.* events, the link ID is eventData.id.
  // For payment.* events, the link ID is in eventData.attributes.source.id.
  const linkId = eventData.id ?? eventData.attributes?.source?.id;
  if (!linkId) return NextResponse.json({ received: true });

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
      // Reference may be a bundle_id (new flow, one row or many) or a legacy ticket.id.
      // Try bundle_id first; if nothing matched, fall back to updating by ticket id.
      let tickets: any[] = [];
      const byBundle = await (supabase.from("event_tickets") as any)
        .update({ status: "active", payment_status: "paid" })
        .eq("bundle_id", reference)
        .select("id, ticket_number, user_id, event_id, event_tiers:tier_id(name, price), events:event_id(id, title, date, location, banner_url, price)");
      if (byBundle.data?.length) {
        tickets = byBundle.data;
      } else {
        const byId = await (supabase.from("event_tickets") as any)
          .update({ status: "active", payment_status: "paid" })
          .eq("id", reference)
          .select("id, ticket_number, user_id, event_id, event_tiers:tier_id(name, price), events:event_id(id, title, date, location, banner_url, price)");
        tickets = byId.data ?? [];
      }

      const first = tickets[0];
      if (first?.user_id && first?.events) {
        const { data: profile } = await supabase
          .from("profiles").select("email").eq("id", first.user_id).single();
        let email = (profile as any)?.email as string | null;
        if (!email) {
          try {
            const clerkUser = await clerkClient.users.getUser(first.user_id);
            email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
          } catch {}
        }
        if (email) {
          const ev   = first.events as any;
          const tier = first.event_tiers as any;

          // PayMongo shape: for payment.paid, eventData IS the payment.
          // For link.payment.paid, payment nested at eventData.attributes.payments[0].
          const payment       = eventData.attributes?.source ? eventData : eventData.attributes?.payments?.[0];
          const paidCentavos  = payment?.attributes?.amount ?? eventData.attributes?.amount ?? 0;
          const amountPaid    = paidCentavos ? paidCentavos / 100 : undefined;
          const paymentMethod = payment?.attributes?.source?.type ?? undefined;
          const paymongoRef   = payment?.id ?? eventData.id;
          const perTicketPrice = Number(tier?.price ?? ev.price ?? 0) || 0;
          const subtotal      = perTicketPrice > 0 ? perTicketPrice * tickets.length : undefined;
          const fee           = amountPaid != null && subtotal != null ? Math.max(0, +(amountPaid - subtotal).toFixed(2)) : undefined;

          if (tickets.length > 1) {
            sendEventTicketBundle({
              to: email,
              eventId: ev.id,
              eventTitle: ev.title,
              eventDate: ev.date,
              eventLocation: ev.location ?? "TBA",
              eventBanner: ev.banner_url ?? undefined,
              tickets: tickets.map((t: any) => ({ ticketNumber: t.ticket_number, ticketId: t.id })),
              tierName: tier?.name ?? "General Admission",
              subtotal,
              fee,
              amountPaid,
              paymentMethod,
              paymongoRef,
              paidAt: new Date().toISOString(),
            }).catch(() => {});
          } else {
            sendEventTicket({
              to: email,
              eventId: ev.id,
              eventTitle: ev.title,
              eventDate: ev.date,
              eventLocation: ev.location ?? "TBA",
              eventBanner: ev.banner_url ?? undefined,
              registrationId: first.ticket_number ?? first.id,
              tierName: tier?.name ?? "General Admission",
              subtotal: perTicketPrice > 0 ? perTicketPrice : undefined,
              fee,
              amountPaid,
              paymentMethod,
              paymongoRef,
              paidAt: new Date().toISOString(),
            }).catch(() => {});
          }
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

    if (type === "tier_upgrade") {
      // reference_id = ticket id. metadata carries new_tier_id.
      // payment_transactions row was created via /api/paymongo/create-link with the
      // metadata forwarded, but re-read it just to be sure we have the target tier.
      const { data: txnRow } = await (supabase.from("payment_transactions") as any)
        .select("metadata")
        .eq("reference_id", reference)
        .eq("type", "tier_upgrade")
        .maybeSingle();
      const newTierId = (txnRow?.metadata as any)?.new_tier_id;
      if (newTierId) {
        await (supabase.from("event_tickets") as any).update({ tier_id: newTierId }).eq("id", reference);
      }
    }
  }

  if (eventType === "payment.failed" || eventType === "link.payment.failed") {
    await (supabase.from("payment_transactions") as any)
      .update({ status: "failed" })
      .eq("reference_id", reference)
      .eq("type", type);

    if (type === "ticket") {
      // Try bundle_id first (new flow); fall back to ticket.id (legacy).
      const byBundle = await (supabase.from("event_tickets") as any)
        .update({ payment_status: "failed" })
        .eq("bundle_id", reference)
        .select("id");
      if (!byBundle.data?.length) {
        await (supabase.from("event_tickets") as any)
          .update({ payment_status: "failed" })
          .eq("id", reference);
      }
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
