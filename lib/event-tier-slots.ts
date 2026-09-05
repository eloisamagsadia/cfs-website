import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Live per-tier remaining count for an event, computed from
 * event_tickets. Replaces the stored slots_remaining counter, which
 * was never decremented on registration or incremented on cancel and
 * therefore drifted from reality the moment any ticket sold.
 *
 * Semantics:
 *   - capacity == null  → returns null for that tier (∞ / no cap)
 *   - capacity == N     → returns max(0, N − active_tickets)
 *
 * "Active tickets" = status in ('active', 'pending_payment'). Pending
 * payments hold a soft reservation; they're either completed by the
 * PayMongo webhook or swept to 'cancelled' by super/tickets-cleanup.
 */
export async function getTierRemainingMap(
  admin: SupabaseClient,
  eventId: string,
): Promise<Record<string, number | null>> {
  const [tiersRes, ticketsRes] = await Promise.all([
    (admin as any).from("event_tiers").select("id, capacity").eq("event_id", eventId),
    (admin as any).from("event_tickets").select("tier_id, status")
      .eq("event_id", eventId)
      .in("status", ["active", "pending_payment"]),
  ]);

  const taken: Record<string, number> = {};
  for (const t of (ticketsRes.data as any[]) ?? []) {
    if (t?.tier_id) taken[t.tier_id] = (taken[t.tier_id] ?? 0) + 1;
  }

  const remaining: Record<string, number | null> = {};
  for (const tier of (tiersRes.data as any[]) ?? []) {
    if (tier?.capacity == null) remaining[tier.id] = null;
    else remaining[tier.id] = Math.max(0, Number(tier.capacity) - (taken[tier.id] ?? 0));
  }
  return remaining;
}

/**
 * Enrich an already-fetched array of tier rows with a live
 * slots_remaining field (overwriting whatever the DB had stored).
 * Use this on any endpoint/page that returns tiers to the client so
 * the UI shows the correct count.
 */
export async function enrichTiersWithRemaining<T extends { id: string; capacity?: number | null }>(
  admin: SupabaseClient,
  eventId: string,
  tiers: T[],
): Promise<Array<T & { slots_remaining: number | null }>> {
  const map = await getTierRemainingMap(admin, eventId);
  return tiers.map(t => ({
    ...t,
    slots_remaining: t.id in map ? map[t.id] : (t.capacity ?? null),
  }));
}

/** Single-tier lookup — cheap because it reuses the map query. */
export async function getTierRemaining(
  admin: SupabaseClient,
  eventId: string,
  tierId: string,
): Promise<number | null> {
  const map = await getTierRemainingMap(admin, eventId);
  return map[tierId] ?? null;
}
