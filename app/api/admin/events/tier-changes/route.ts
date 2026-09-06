import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cross-event tier change report.
 *
 * GET /api/admin/events/tier-changes?range=30d|90d|all&event_id=<uuid>
 *
 * Reads from audit_log for the three tier-change actions logged by
 * /api/events/tier-change:
 *
 *   - tier_change_same              (instant swap, no money)
 *   - tier_change_upgrade_started   (upgrade checkout created —
 *                                    completion is confirmed when
 *                                    payment.paid webhook lands; here
 *                                    we cross-check payment_transactions
 *                                    for the status)
 *   - tier_change_downgrade_requested (refund row created,
 *                                    admin-processed)
 *
 * Then batch-loads profiles, tiers (from + to), events, refunds, and
 * payment_transactions so the client can render a single self-contained
 * table without follow-up requests.
 */
async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return userId;
}

const ACTIONS = [
  "tier_change_same",
  "tier_change_upgrade_started",
  "tier_change_downgrade_requested",
];

export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const url     = new URL(req.url);
  const range   = url.searchParams.get("range") ?? "30d";
  const eventId = url.searchParams.get("event_id");

  const now     = Date.now();
  const rangeMs = range === "all" ? null : range === "90d" ? 90 * 86400000 : 30 * 86400000;

  const admin = createAdminClient();

  let q = (admin as any)
    .from("audit_log")
    .select("id, user_id, action, target_type, target_id, details, created_at")
    .in("action", ACTIONS)
    .order("created_at", { ascending: false })
    .limit(500);
  if (rangeMs !== null) q = q.gte("created_at", new Date(now - rangeMs).toISOString());

  const { data: audit, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  let rows = (audit ?? []) as any[];

  // Collect ids to batch-fetch
  const userIds  = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
  const tierIds  = Array.from(new Set(rows.flatMap(r => [r.details?.from, r.details?.to]).filter(Boolean)));
  const ticketIds = Array.from(new Set(rows.map(r => r.target_id).filter(Boolean)));
  const refundIds = Array.from(new Set(rows.map(r => r.details?.refund_id).filter(Boolean)));

  const [profilesRes, tiersRes, ticketsRes, refundsRes, txnsRes] = await Promise.all([
    userIds.length
      ? (admin as any).from("profiles").select("id, display_name, email, avatar_url").in("id", userIds)
      : Promise.resolve({ data: [] }),
    tierIds.length
      ? (admin as any).from("event_tiers").select("id, name, price, event_id, events:event_id(id, title, date)").in("id", tierIds)
      : Promise.resolve({ data: [] }),
    ticketIds.length
      ? (admin as any).from("event_tickets").select("id, ticket_number, tier_id, event_id").in("id", ticketIds)
      : Promise.resolve({ data: [] }),
    refundIds.length
      ? (admin as any).from("refunds").select("id, status, amount, paymongo_ref, processed_at").in("id", refundIds)
      : Promise.resolve({ data: [] }),
    ticketIds.length
      ? (admin as any).from("payment_transactions").select("reference_id, status, paid_at, metadata").eq("type", "tier_upgrade").in("reference_id", ticketIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profiles = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));
  const tiers    = new Map((tiersRes.data ?? []).map((t: any) => [t.id, t]));
  const tickets  = new Map((ticketsRes.data ?? []).map((t: any) => [t.id, t]));
  const refunds  = new Map((refundsRes.data ?? []).map((r: any) => [r.id, r]));

  // Payment txns can be many per ticket (retries); index by reference_id
  // and pick the most recent paid one for the upgrade completion signal.
  const txnByTicket = new Map<string, any>();
  for (const tx of (txnsRes.data ?? []) as any[]) {
    const existing = txnByTicket.get(tx.reference_id);
    if (!existing || (tx.paid_at && (!existing.paid_at || tx.paid_at > existing.paid_at))) {
      txnByTicket.set(tx.reference_id, tx);
    }
  }

  const events = rows.map(r => {
    const fromTier = tiers.get(r.details?.from);
    const toTier   = tiers.get(r.details?.to);
    const eventInfo = (fromTier as any)?.events ?? (toTier as any)?.events ?? null;
    const ticket   = tickets.get(r.target_id);
    const profile  = profiles.get(r.user_id);
    const refund   = r.details?.refund_id ? refunds.get(r.details.refund_id) : null;
    const txn      = txnByTicket.get(r.target_id);

    let direction: "upgrade" | "downgrade" | "same" = "same";
    if (r.action === "tier_change_upgrade_started")     direction = "upgrade";
    if (r.action === "tier_change_downgrade_requested") direction = "downgrade";

    // Completion status
    let completion: "completed" | "pending" | "abandoned" | "same_swap" = "same_swap";
    if (direction === "same") {
      completion = "same_swap";
    } else if (direction === "upgrade") {
      // Completed only when payment_transactions row for this ticket is paid
      completion = txn?.status === "paid" ? "completed" : "pending";
    } else {
      // Completed only when the refund row is completed
      completion = (refund as any)?.status === "completed" ? "completed" : "pending";
    }

    return {
      id:           r.id,
      at:           r.created_at,
      action:       r.action,
      direction,
      completion,
      amount:       Number(r.details?.delta ?? r.details?.refund_amount ?? 0),
      ticket:       ticket ? { id: (ticket as any).id, ticket_number: (ticket as any).ticket_number } : null,
      event:        eventInfo,
      from_tier:    fromTier ? { id: (fromTier as any).id, name: (fromTier as any).name, price: Number((fromTier as any).price ?? 0) } : null,
      to_tier:      toTier   ? { id: (toTier   as any).id, name: (toTier   as any).name, price: Number((toTier   as any).price ?? 0) } : null,
      member:       profile ? { id: (profile as any).id, display_name: (profile as any).display_name, email: (profile as any).email, avatar_url: (profile as any).avatar_url } : null,
      refund:       refund ? { id: (refund as any).id, status: (refund as any).status, amount: Number((refund as any).amount ?? 0), paymongo_ref: (refund as any).paymongo_ref } : null,
    };
  });

  // Optional event filter (client also has it, but doing it server-side
  // shrinks payload for events with many changes).
  const filtered = eventId ? events.filter(e => (e.event as any)?.id === eventId) : events;

  // Rollup counts for the summary bar
  const summary = {
    total:      filtered.length,
    upgrades:   filtered.filter(e => e.direction === "upgrade").length,
    downgrades: filtered.filter(e => e.direction === "downgrade").length,
    same:       filtered.filter(e => e.direction === "same").length,
    upgrade_revenue:   filtered.filter(e => e.direction === "upgrade"   && e.completion === "completed").reduce((s, e) => s + e.amount, 0),
    downgrade_refunds: filtered.filter(e => e.direction === "downgrade" && e.completion === "completed").reduce((s, e) => s + e.amount, 0),
    pending_upgrades:  filtered.filter(e => e.direction === "upgrade"   && e.completion === "pending").length,
    pending_downgrades: filtered.filter(e => e.direction === "downgrade" && e.completion === "pending").length,
  };

  return NextResponse.json({ range, events: filtered, summary });
}
