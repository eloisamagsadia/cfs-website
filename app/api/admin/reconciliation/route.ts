import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Payment reconciliation: "did anyone pay us and not get what they paid for?"
//
// Nothing asked that question before. The Sept 14 event exposed a webhook bug
// where payments reached PayMongo but tickets were never marked paid — and it
// stayed invisible until attendees were at the door. That bug is fixed, but the
// blind spot it exposed is not: a provider outage, a bad deploy or a
// half-applied refund would play out exactly the same way.
//
// Read-only by design. It reports; a human decides.

const db = () => createAdminClient();

type Row = {
  id: string;
  type: string;
  amount: number;
  created_at: string;
  paid_at: string | null;
  reference_id: string;
  buyer: string | null;
  buyer_role: string | null;
  /** Why this was flagged, in words a human can act on. */
  reason: string;
  /** Deep link to whatever the money should have produced. */
  href: string | null;
};

export async function GET() {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = db();

  const [{ data: txns }, { data: tickets }, { data: orders }, { data: donations }, { data: profiles }] =
    await Promise.all([
      (supabase as any).from("payment_transactions")
        .select("id, reference_id, type, status, amount, created_at, paid_at, user_id")
        .order("created_at", { ascending: false }),
      (supabase as any).from("event_tickets").select("id, bundle_id, status, payment_status, ticket_number"),
      (supabase as any).from("orders").select("id, payment_status, order_status"),
      (supabase as any).from("donations").select("id, status"),
      (supabase as any).from("profiles").select("id, display_name, role"),
    ]);

  const byId       = new Map<string, any>((tickets ?? []).map((t: any) => [t.id, t]));
  const byBundle   = new Map<string, any[]>();
  for (const t of tickets ?? []) {
    if (!t.bundle_id) continue;
    byBundle.set(t.bundle_id, [...(byBundle.get(t.bundle_id) ?? []), t]);
  }
  const orderById    = new Map<string, any>((orders ?? []).map((o: any) => [o.id, o]));
  const donationById = new Map<string, any>((donations ?? []).map((d: any) => [d.id, d]));
  const profileById  = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));

  const unresolved: Row[] = [];
  let abandoned = 0;
  let abandonedValue = 0;
  let matched = 0;

  for (const t of (txns ?? []) as any[]) {
    const prof = t.user_id ? profileById.get(t.user_id) : null;
    const base = {
      id: t.id,
      type: t.type,
      amount: Number(t.amount ?? 0),
      created_at: t.created_at,
      paid_at: t.paid_at ?? null,
      reference_id: t.reference_id,
      buyer: prof?.display_name ?? null,
      buyer_role: prof?.role ?? null,
    };

    if (t.status !== "paid") {
      // A pending transaction whose ticket IS paid is the inverse failure:
      // the member is fine, our bookkeeping is not. Worth surfacing.
      const rows = byBundle.get(t.reference_id) ?? (byId.has(t.reference_id) ? [byId.get(t.reference_id)] : []);
      if (rows.length && rows.some((r: any) => r.payment_status === "paid")) {
        unresolved.push({ ...base, reason: "Transaction still pending but the ticket is paid — bookkeeping mismatch", href: null });
      } else {
        // Abandoned checkout. Expected and high-volume: if these were alarms
        // the page would cry wolf and nobody would read it.
        abandoned += 1;
        abandonedValue += base.amount;
      }
      continue;
    }

    // ── Paid. Did it produce anything? ──
    if (t.type === "ticket") {
      const rows = byBundle.get(t.reference_id) ?? (byId.has(t.reference_id) ? [byId.get(t.reference_id)] : []);
      if (!rows.length) {
        unresolved.push({ ...base, reason: "Paid, but no ticket exists for this reference", href: null });
      } else if (!rows.some((r: any) => r.payment_status === "paid")) {
        const states = rows.map((r: any) => `${r.ticket_number}: ${r.status}`).join(", ");
        unresolved.push({ ...base, reason: `Paid, but the ticket is not (${states})`, href: `/admin/events` });
      } else matched += 1;
    } else if (t.type === "order") {
      const o = orderById.get(t.reference_id);
      if (!o) unresolved.push({ ...base, reason: "Paid, but no order exists for this reference", href: null });
      else if (o.payment_status !== "paid") unresolved.push({ ...base, reason: `Paid, but the order is "${o.payment_status}"`, href: `/admin/orders/${o.id}` });
      else matched += 1;
    } else if (t.type === "donation") {
      const d = donationById.get(t.reference_id);
      if (!d) unresolved.push({ ...base, reason: "Paid, but no donation exists for this reference", href: null });
      else if (d.status !== "completed") unresolved.push({ ...base, reason: `Paid, but the donation is "${d.status}"`, href: `/admin/donations` });
      else matched += 1;
    } else if (t.type === "tier_upgrade") {
      // The reference is the ticket being upgraded. It should still be a live,
      // paid ticket — an upgrade against a cancelled ticket means money taken
      // for a seat that no longer exists.
      const tk = byId.get(t.reference_id);
      if (!tk) unresolved.push({ ...base, reason: "Upgrade paid, but the ticket no longer exists", href: null });
      else if (tk.status === "cancelled") unresolved.push({ ...base, reason: `Upgrade paid, but ticket ${tk.ticket_number} is cancelled`, href: `/admin/events` });
      else matched += 1;
    } else matched += 1;
  }

  // Collapse by reference. A member who kept hitting "pay" generates one
  // payment_transactions row per link — one upgrade attempt produced NINE —
  // but the webhook marks them all paid together off a single payment, which
  // the identical paid_at across them proves. Reporting nine rows for one
  // problem would make the page look alarming and be wrong, and a page that
  // overstates gets ignored. `attempts` keeps the retry count visible, since
  // repeated retries are themselves a symptom worth seeing.
  const grouped = new Map<string, Row & { attempts: number }>();
  for (const r of unresolved) {
    const key = `${r.type}:${r.reference_id}:${r.reason}`;
    const seen = grouped.get(key);
    if (!seen) grouped.set(key, { ...r, attempts: 1 });
    else {
      seen.attempts += 1;
      // Keep the earliest occurrence as the representative row.
      if (r.created_at < seen.created_at) seen.created_at = r.created_at;
    }
  }
  const deduped = Array.from(grouped.values())
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return NextResponse.json({
    unresolved: deduped,
    summary: {
      /** Rows before collapsing retries — kept so the gap is never silent. */
      rawRows: unresolved.length,
      total: (txns ?? []).length,
      matched,
      unresolvedCount: deduped.length,
      unresolvedValue: deduped.reduce((s, r) => s + r.amount, 0),
      abandoned,
      abandonedValue,
    },
  });
}
