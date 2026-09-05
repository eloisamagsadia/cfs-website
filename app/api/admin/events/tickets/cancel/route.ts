import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { promoteNextWaitlist } from "@/lib/waitlist-promote";
import { sendTicketCancelledEmail } from "@/lib/emails/ticket-cancelled";
import { logAudit } from "@/lib/audit";

/**
 * Admin ticket cancel orchestrator.
 *
 * POST { ticket_id, reason?, refund?, refund_amount?, notify_member?, promote_waitlist? }
 *
 * Runs the whole ticket-cancellation workflow in one call:
 *   1. Marks the ticket cancelled + payment_status = refunded
 *   2. If refund=true AND the ticket had a paid payment_id: creates a
 *      refund row and (if step 1's PayMongo API is enabled) fires the
 *      /api/admin/refunds/paymongo/process endpoint. Otherwise the row
 *      just sits in `pending` for manual processing.
 *   3. If promote_waitlist=true: calls promoteNextWaitlist(event_id, 1)
 *      so the next in line gets notified about the freed seat.
 *   4. If notify_member=true (default): sends the branded cancellation
 *      email with refund amount + expected timing.
 *   5. Audit-logs cancel_ticket with the whole detail chain.
 *
 * Guards: admin/super only, ticket must exist, not already cancelled.
 */

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return { userId, isSuper: role === "super_admin" };
}

export async function POST(req: NextRequest) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ticket_id       = String(body?.ticket_id ?? "").trim();
  const reason          = (body?.reason ?? null) as string | null;
  const wantRefund      = body?.refund !== false;         // default true
  const wantPromote     = body?.promote_waitlist !== false; // default true
  const wantNotify      = body?.notify_member !== false;   // default true
  const refundAmountIn  = body?.refund_amount as number | undefined;
  if (!ticket_id) return NextResponse.json({ error: "ticket_id required" }, { status: 400 });

  const admin = createAdminClient();

  // Load ticket + event + tier for the email
  const { data: ticket } = await (admin as any)
    .from("event_tickets")
    .select("id, ticket_number, status, payment_status, payment_id, user_id, event_id, tier_id, event_tiers:tier_id(name, price), events:event_id(title, date)")
    .eq("id", ticket_id)
    .maybeSingle();
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.status === "cancelled") {
    return NextResponse.json({ error: "Ticket is already cancelled" }, { status: 400 });
  }

  const wasPaid = ticket.payment_status === "paid" && !!ticket.payment_id;
  const perTicketPrice = Number((ticket as any).event_tiers?.price ?? 0);
  const inferredAmount = perTicketPrice > 0 ? perTicketPrice : Number(refundAmountIn ?? 0);
  const finalAmount    = Number(refundAmountIn ?? inferredAmount);
  const shouldRefund   = wantRefund && wasPaid && finalAmount > 0;

  // ─── 1. Cancel the ticket
  const { error: cErr } = await (admin as any)
    .from("event_tickets")
    .update({
      status: "cancelled",
      payment_status: shouldRefund ? "refunded" : ticket.payment_status,
    })
    .eq("id", ticket_id);
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  // ─── 2. Optional refund row (+ optional auto-process via PayMongo)
  let refundRowId: string | null = null;
  let refundAutoProcessed = false;
  let refundAutoError: string | null = null;

  if (shouldRefund) {
    const { data: refund, error: rErr } = await (admin as any)
      .from("refunds")
      .insert({
        entity_type: "event_ticket",
        entity_id:   ticket_id,
        user_id:     ticket.user_id,
        amount:      finalAmount,
        reason:      reason ?? "Ticket cancellation",
        note:        `Admin ticket cancel. Original payment: ${ticket.payment_id}. Ticket #${ticket.ticket_number}.`,
        requested_by: actor.userId,
        status:      "pending",
      })
      .select("id")
      .single();
    if (!rErr && refund) {
      refundRowId = (refund as any).id;

      // Fire the PayMongo auto-process only if the caller is super_admin
      // (that endpoint is super-only) and only if the PayMongo API is
      // enabled — errors here are non-fatal, we still complete the cancel.
      if (actor.isSuper) {
        try {
          const origin = new URL(req.url).origin;
          const res = await fetch(`${origin}/api/admin/refunds/paymongo/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") ?? "" },
            body: JSON.stringify({ refund_id: refundRowId, reason: "requested_by_customer" }),
          });
          const d = await res.json().catch(() => ({}));
          if (res.ok) refundAutoProcessed = true;
          else refundAutoError = d.error ?? `PayMongo call failed (${res.status})`;
        } catch (e: any) {
          refundAutoError = e?.message ?? "PayMongo call failed";
        }
      }
    }
  }

  // ─── 3. Waitlist auto-promote
  let promoted: number = 0;
  if (wantPromote) {
    try {
      const result = await promoteNextWaitlist(ticket.event_id, 1);
      promoted = result.promoted.length;
    } catch {}
  }

  // ─── 4. Email the member
  let emailed = false;
  let emailError: string | null = null;
  if (wantNotify && ticket.user_id) {
    try {
      // Grab the member's email + display name (from profiles, fall back to Clerk)
      const { data: profile } = await (admin as any)
        .from("profiles").select("email, display_name").eq("id", ticket.user_id).maybeSingle();
      let email = (profile as any)?.email as string | null;
      let name  = (profile as any)?.display_name as string | null;
      if (!email) {
        try {
          const u = await clerkClient.users.getUser(ticket.user_id);
          email = u.emailAddresses?.[0]?.emailAddress ?? null;
          if (!name) name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || null;
        } catch {}
      }
      if (email) {
        await sendTicketCancelledEmail({
          email,
          name: name ?? "there",
          eventTitle:   (ticket as any).events?.title ?? "your event",
          eventDate:    (ticket as any).events?.date ?? null,
          ticketNumber: ticket.ticket_number ?? ticket_id.slice(0, 8),
          refundAmount: shouldRefund ? finalAmount : null,
          refundEta:    shouldRefund ? "3–5 business days" : null,
          reason:       reason ?? null,
        });
        emailed = true;
      }
    } catch (e: any) {
      emailError = e?.message ?? "email failed";
    }
  }

  // ─── 5. Audit trail
  await logAudit({
    userId: actor.userId,
    action: "cancel_ticket",
    target_type: "event_ticket",
    target_id: ticket_id,
    details: {
      event_id: ticket.event_id,
      user_id: ticket.user_id,
      reason,
      refund: shouldRefund ? { refund_id: refundRowId, amount: finalAmount, auto_processed: refundAutoProcessed, auto_error: refundAutoError } : null,
      waitlist_promoted: promoted,
      emailed,
      email_error: emailError,
    },
    req,
  });

  return NextResponse.json({
    ok: true,
    cancelled: true,
    refund: shouldRefund ? {
      refund_id: refundRowId,
      amount: finalAmount,
      auto_processed: refundAutoProcessed,
      auto_error: refundAutoError,
    } : null,
    waitlist_promoted: promoted,
    emailed,
    email_error: emailError,
  });
}
