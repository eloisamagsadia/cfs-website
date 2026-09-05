import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveUserId } from "@/lib/effective-user";
import { calculateFee } from "@/lib/paymongo";
import { getTierRemainingMap } from "@/lib/event-tier-slots";
import { logAudit } from "@/lib/audit";

/**
 * Self-service tier change.
 *
 * GET  ?ticket_id=uuid → returns { current, options: [{ tier, delta, direction, eligible, reason? }] }
 * POST { ticket_id, new_tier_id, method? } → executes the change
 *   - upgrade  → returns { checkout_url } for the delta payment
 *   - same    → swaps immediately, returns { swapped: true }
 *   - downgrade → creates pending refund row for admin, returns { pending_refund_id }
 *
 * Guards:
 *   - ticket must be owned by caller, status=active
 *   - event must be > 12h away, not cancelled, not past
 *   - target tier must belong to same event, have slots_remaining > 0 (unless null=∞)
 *   - bundle_size compatibility (can't change tier if it's a bundle head/child — MVP)
 */
const MIN_HOURS_BEFORE_EVENT = 12;

async function loadContext(ticketId: string, userId: string) {
  const admin = createAdminClient();
  const { data: t } = await (admin as any)
    .from("event_tickets")
    .select("id, user_id, event_id, tier_id, status, payment_status, payment_id, bundle_id")
    .eq("id", ticketId)
    .maybeSingle();
  if (!t) return { error: { status: 404, msg: "Ticket not found" } };
  if (t.user_id !== userId) return { error: { status: 403, msg: "Not your ticket" } };
  if (t.status !== "active") return { error: { status: 400, msg: "Only active tickets can change tier" } };
  if (t.bundle_id) return { error: { status: 400, msg: "Bundle tickets can't be changed self-serve. Contact support." } };

  const { data: event } = await (admin as any).from("events").select("id, title, date, status").eq("id", t.event_id).maybeSingle();
  if (!event) return { error: { status: 404, msg: "Event not found" } };
  if (event.status === "cancelled") return { error: { status: 400, msg: "Event is cancelled" } };
  const eventTime = new Date(event.date).getTime();
  if (eventTime < Date.now()) return { error: { status: 400, msg: "Event has already ended" } };
  if (eventTime - Date.now() < MIN_HOURS_BEFORE_EVENT * 3600_000) {
    return { error: { status: 400, msg: `Tier change locks ${MIN_HOURS_BEFORE_EVENT}h before the event.` } };
  }

  const { data: tiers } = await (admin as any)
    .from("event_tiers")
    .select("id, name, price, color, capacity, is_active, bundle_size")
    .eq("event_id", t.event_id)
    .order("price");

  // Overlay live remaining count. event_tiers.slots_remaining exists but is
  // never decremented anywhere — trust the live compute, not the stored value.
  const remainingMap = await getTierRemainingMap(admin, t.event_id);
  const tiersEnriched = ((tiers ?? []) as any[]).map(x => ({
    ...x,
    slots_remaining: x.id in remainingMap ? remainingMap[x.id] : (x.capacity ?? null),
  }));

  return { ticket: t, event, tiers: tiersEnriched, admin };
}

export async function GET(req: NextRequest) {
  const { userId: realId } = auth();
  if (!realId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = getEffectiveUserId() ?? realId;

  const ticketId = new URL(req.url).searchParams.get("ticket_id");
  if (!ticketId) return NextResponse.json({ error: "ticket_id required" }, { status: 400 });

  const ctx = await loadContext(ticketId, userId);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error.msg }, { status: ctx.error.status });

  const currentTier = ctx.tiers.find(x => x.id === ctx.ticket.tier_id) ?? null;
  const currentPrice = Number(currentTier?.price ?? 0);

  const options = ctx.tiers
    .filter(x => x.id !== ctx.ticket.tier_id)
    .map(x => {
      const price = Number(x.price ?? 0);
      const delta = price - currentPrice;
      let eligible = true;
      let reason: string | null = null;
      if (x.is_active === false)                                     { eligible = false; reason = "Tier is inactive"; }
      else if (x.bundle_size && x.bundle_size > 1)                   { eligible = false; reason = "Bundle tier — contact support to switch"; }
      else if (x.slots_remaining !== null && x.slots_remaining <= 0) { eligible = false; reason = "No slots left"; }
      return {
        tier: x,
        current_price: currentPrice,
        new_price: price,
        delta,
        direction: delta > 0 ? "upgrade" : delta < 0 ? "downgrade" : "same",
        eligible,
        reason,
      };
    });

  return NextResponse.json({
    current: { tier: currentTier, ticket: ctx.ticket, event: ctx.event },
    options,
    hours_until_event: Math.floor((new Date(ctx.event.date).getTime() - Date.now()) / 3600000),
  });
}

export async function POST(req: NextRequest) {
  const { userId: realId } = auth();
  if (!realId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = getEffectiveUserId() ?? realId;

  const { ticket_id, new_tier_id } = await req.json();
  if (!ticket_id || !new_tier_id) return NextResponse.json({ error: "ticket_id + new_tier_id required" }, { status: 400 });

  const ctx = await loadContext(ticket_id, userId);
  if ("error" in ctx) return NextResponse.json({ error: ctx.error.msg }, { status: ctx.error.status });

  if (new_tier_id === ctx.ticket.tier_id) return NextResponse.json({ error: "Already on that tier" }, { status: 400 });

  const target = ctx.tiers.find(x => x.id === new_tier_id);
  if (!target) return NextResponse.json({ error: "Target tier not found" }, { status: 404 });
  if (target.is_active === false) return NextResponse.json({ error: "Tier is inactive" }, { status: 400 });
  if (target.bundle_size && target.bundle_size > 1) return NextResponse.json({ error: "Bundle tier can't be swapped self-serve. Contact support." }, { status: 400 });
  if (target.slots_remaining !== null && target.slots_remaining <= 0) return NextResponse.json({ error: "No slots left in that tier" }, { status: 400 });

  const currentTier = ctx.tiers.find(x => x.id === ctx.ticket.tier_id);
  const currentPrice = Number(currentTier?.price ?? 0);
  const newPrice     = Number(target.price ?? 0);
  const delta        = newPrice - currentPrice;

  // ─── same price → instant swap
  if (delta === 0) {
    const { error } = await (ctx.admin as any).from("event_tickets").update({ tier_id: new_tier_id }).eq("id", ticket_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit({ userId, action: "tier_change_same", target_type: "event_ticket", target_id: ticket_id, details: { from: ctx.ticket.tier_id, to: new_tier_id, price: newPrice } });
    return NextResponse.json({ swapped: true, direction: "same" });
  }

  // ─── upgrade → create PayMongo checkout for delta
  if (delta > 0) {
    const amount = Math.round(delta + calculateFee(delta, "qrph"));
    const origin = new URL(req.url).origin;
    const payRes = await fetch(`${origin}/api/paymongo/create-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") ?? "" },
      body: JSON.stringify({
        amount,
        description: `${ctx.event.title} — tier upgrade to ${target.name}`,
        type: "tier_upgrade",
        reference_id: ticket_id,
        success_url: `${origin}/members/tickets/${ticket_id}?tier_change=success`,
        metadata: { payment_method: "qrph", new_tier_id, ticket_id, delta },
      }),
    });
    const payData = await payRes.json();
    if (!payRes.ok) return NextResponse.json({ error: payData.error ?? "Could not create checkout" }, { status: 500 });

    await logAudit({ userId, action: "tier_change_upgrade_started", target_type: "event_ticket", target_id: ticket_id, details: { from: ctx.ticket.tier_id, to: new_tier_id, delta, amount } });
    return NextResponse.json({ direction: "upgrade", checkout_url: payData.checkout_url, delta });
  }

  // ─── downgrade → pending refund row for admin
  const refundAmount = Math.abs(delta);
  const { data: refund, error: rErr } = await (ctx.admin as any)
    .from("refunds")
    .insert({
      entity_type: "event_ticket",
      entity_id: ticket_id,
      user_id: userId,
      amount: refundAmount,
      reason: `Tier downgrade: ${currentTier?.name ?? "?"} → ${target.name}`,
      // Machine-readable marker lets the admin refund handler swap the tier
      // (instead of cancelling the ticket) when this refund is marked complete.
      note: `[tier_change_target:${new_tier_id}] Member self-service request. Original payment: ${ctx.ticket.payment_id ?? "n/a"}. Tier change: ${currentTier?.name ?? "?"} → ${target.name}.`,
      requested_by: userId,
      status: "pending",
    })
    .select().single();
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  await logAudit({ userId, action: "tier_change_downgrade_requested", target_type: "event_ticket", target_id: ticket_id, details: { from: ctx.ticket.tier_id, to: new_tier_id, refund_id: (refund as any).id, refund_amount: refundAmount } });
  return NextResponse.json({ direction: "downgrade", pending_refund_id: (refund as any).id, refund_amount: refundAmount });
}
