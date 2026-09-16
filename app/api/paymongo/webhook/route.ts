import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/paymongo";
import { sendDonationReceipt, sendEventTicket, sendEventTicketBundle, sendOrderConfirmation } from "@/lib/email";
import { notifyRefundOutcome } from "@/lib/refund-notifications";
import { decrementProductStock, restockProductStock, coversWholeOrder } from "@/lib/stock";
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
      .select("id, status, entity_type, entity_id, note, user_id, amount, reason, paymongo_ref")
      .eq("paymongo_ref", refundId)
      .maybeSingle();
    if (!row) return NextResponse.json({ received: true, refund_id: refundId, matched: false });

    // Idempotent — already-final status, don't rewrite
    if (row.status === "completed" || row.status === "failed") return NextResponse.json({ received: true, refund_id: refundId, idempotent: true });

    if (pmStatus === "succeeded") {
      const patch: any = { status: "completed", processed_at: new Date().toISOString() };
      await (supabase.from("refunds") as any).update(patch).eq("id", row.id);

      // Fire the member-facing "refund sent" notif + email
      try { await notifyRefundOutcome(supabase as any, row as any, "succeeded"); } catch {}

      // Same downstream sync as the admin PATCH handler — mirror it so
      // webhook-completed refunds behave identically to manually-marked ones.
      if (row.entity_type === "order") {
        // Claim the transition so a replayed refund webhook can't restock twice.
        const { data: refunded } = await (supabase.from("orders") as any)
          .update({ payment_status: "refunded" })
          .eq("id", row.entity_id)
          .neq("payment_status", "refunded")
          .select("id, items, total")
          .maybeSingle();
        // Refunded goods were still counted as sold — put them back, but only
        // for a full refund. Restocking every item on a partial refund would
        // inflate inventory and let the shop oversell again.
        if (refunded && coversWholeOrder(row.amount, (refunded as any).total)) {
          await restockProductStock(supabase, (refunded as any).items);
        }
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
      const reason  = attrs.failure_reason ?? attrs.reason ?? "unknown";
      const newNote = `${row.note ?? ""}\n[paymongo_failed:${new Date().toISOString()}] ${reason}`;
      await (supabase.from("refunds") as any)
        .update({ status: "failed", note: newNote })
        .eq("id", row.id);

      // notifyRefundOutcome parses the reason from row.note, so pass the
      // updated note through here.
      try { await notifyRefundOutcome(supabase as any, { ...row, note: newNote } as any, "failed"); } catch {}
    }
    // pmStatus === "pending" — stay in processing, nothing to update

    return NextResponse.json({ received: true, refund_id: refundId, pm_status: pmStatus });
  }

  // ─── Payment/link events ──────────────────────────────────────────
  // PayMongo does not forward custom metadata from links to webhook events.
  // Instead, look up the payment_transactions row by payment_link_id to get reference_id + type.
  // For link.* events, the link ID is eventData.id.
  // For payment.* events, the link ID is in eventData.attributes.source.id.
  // For link.* events the link id IS eventData.id. For payment.* events
  // eventData.id is the PAYMENT id (pay_…) and the link lives at
  // attributes.source.id.
  //
  // This used to be `eventData.id ?? eventData.attributes?.source?.id`, which
  // always picked eventData.id because it is always present. So every
  // payment.paid event looked up a pay_… id in payment_link_id — a column that
  // only ever holds link_… ids — found nothing, and returned 200 without
  // marking the ticket paid. The money reached PayMongo and the ticket stayed
  // pending, which is exactly the "pumapasok sa paymongo pero hindi
  // nag-uupdate yung status" report from the Sept 14 event.
  //
  // Both candidates are tried so either event shape resolves.
  const candidateLinkIds = [eventData.attributes?.source?.id, eventData.id].filter(Boolean);
  if (!candidateLinkIds.length) return NextResponse.json({ received: true });

  // maybeSingle + limit rather than .single(): a duplicate payment_link_id
  // (possible via regenerate-payment) made .single() error and silently drop
  // the webhook the same way a miss did.
  const { data: txnRows } = await (supabase.from("payment_transactions") as any)
    .select("reference_id, type, status")
    .in("payment_link_id", candidateLinkIds)
    .order("created_at", { ascending: false })
    .limit(1);

  const txn = (txnRows ?? [])[0];
  if (!txn) {
    // Worth seeing in logs: a paid webhook we could not match is money taken
    // with nothing updated, and it used to fail completely silently.
    console.error("[paymongo] no payment_transactions row for", { eventType, candidateLinkIds });
    return NextResponse.json({ received: true });
  }

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
      // Conditional on payment_status = 'pending' so a retried webhook can't
      // claim the same order twice — only the transition returns a row, and
      // only that row decrements stock.
      const { data: claimed } = await (supabase.from("orders") as any)
        .update({ payment_status: "paid", paymongo_ref: eventData.id, order_status: "processing" })
        .eq("id", reference)
        .eq("payment_status", "pending")
        .select("id, items, user_id, total, shipping_address")
        .maybeSingle();

      if (claimed) {
        const order = claimed as any;
        await decrementProductStock(supabase, order.items);

        // Buyers of a shop order got no receipt at all — tickets and donations
        // both send one, and /payment/success promises an email. Sent from the
        // same claim branch so a retried webhook can't email twice.
        try {
          const { data: profile } = await (supabase.from("profiles") as any)
            .select("email").eq("id", order.user_id).maybeSingle();
          let email = (profile as any)?.email as string | null;
          if (!email && order.user_id) {
            try {
              const clerkUser = await clerkClient.users.getUser(order.user_id);
              email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
            } catch {}
          }
          if (email) {
            await sendOrderConfirmation({
              to: email,
              orderId: order.id,
              items: order.items ?? [],
              total: order.total ?? 0,
              shippingAddress: order.shipping_address ?? {},
            });
          }
        } catch (e) {
          console.error("Failed to send order confirmation email:", e);
        }
      }
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

        // Drop a "your upgrade is confirmed" in-app notif. Best-effort;
        // we don't want a Supabase hiccup to fail the webhook.
        try {
          const { data: ticket } = await (supabase.from("event_tickets") as any)
            .select("user_id, event_id, ticket_number")
            .eq("id", reference)
            .maybeSingle();
          // Was "event_ticket_tiers", which does not exist — the table is
          // `event_tiers`. The query 404'd, tier came back null, and every
          // upgrade notice silently fell back to the generic wording without
          // the tier name. Caught by the generated types; the stub's
          // Record<string, any> accepted any table name at all.
          const { data: tier } = await (supabase.from("event_tiers") as any)
            .select("name")
            .eq("id", newTierId)
            .maybeSingle();
          if (ticket?.user_id) {
            await (supabase.from("notifications") as any).insert({
              user_id: ticket.user_id,
              type:    "tier_upgrade_completed",
              title:   "Ticket upgraded",
              message: tier?.name
                ? `Your ticket is now on the ${tier.name} tier. Check your ticket wallet for the updated pass.`
                : "Your ticket upgrade has been applied. Check your ticket wallet for the updated pass.",
              link:    `/members/tickets`,
              is_read: false,
            });
          }
        } catch {}
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
