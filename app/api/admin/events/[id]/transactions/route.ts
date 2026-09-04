import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns every payment attempt for an event — paid, pending,
// abandoned, failed — so admins can trace exactly what happened
// during a live sale (buyer picked GCash then closed the tab, PayMongo
// timed out on QR PH, etc.).
//
// GET /api/admin/events/[id]/transactions
//
// Only admin/super_admin can hit this (route middleware enforces the
// /admin prefix; we double-check role here for safety).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const eventId = params.id;
  const admin = createAdminClient();

  // Pull every ticket for this event, keyed by bundle so we can identify
  // both bundle purchases (multiple tickets share bundle_id) and legacy
  // solo purchases (bundle_id null, reference == ticket.id).
  const { data: tickets } = await (admin.from("event_tickets") as any)
    .select("id, bundle_id, user_id, status, payment_status, created_at, event_tiers:tier_id(name, price), profiles:user_id(display_name, email)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  const rows = (tickets ?? []) as any[];
  if (rows.length === 0) {
    return NextResponse.json({ event_id: eventId, transactions: [], summary: emptySummary() });
  }

  // Collect every reference PayMongo might have used for this event: each
  // bundle_id (bundle purchases) and each ticket.id (solo purchases with
  // no bundle_id). Then fetch matching payment_transactions in one shot.
  const refs = new Set<string>();
  for (const t of rows) {
    if (t.bundle_id) refs.add(t.bundle_id);
    else refs.add(t.id);
  }
  const refList = Array.from(refs);

  // NOTE: payment_transactions has NO email or method columns — buyer email
  // lives on profiles (already joined via the tickets query above); the
  // payment method is stored in metadata.payment_method. Selecting phantom
  // columns fails the whole request silently (returns 0 rows), which was
  // making every active ticket classify as "COMP" on the timeline.
  const { data: txns } = await (admin.from("payment_transactions") as any)
    .select("id, reference_id, user_id, amount, currency, status, payment_link_id, paid_at, created_at, metadata, type")
    .in("reference_id", refList)
    .eq("type", "ticket")
    .order("created_at", { ascending: false });

  const txnByRef = new Map<string, any>();
  for (const t of (txns ?? [])) {
    const existing = txnByRef.get(t.reference_id);
    // Keep the newest attempt per reference (latest created_at wins).
    if (!existing || new Date(t.created_at) > new Date(existing.created_at)) {
      txnByRef.set(t.reference_id, t);
    }
  }

  // Group tickets by bundle_id (or ticket.id for solos) so each
  // transaction row represents ONE payment attempt.
  const groups = new Map<string, { ref: string; tickets: any[] }>();
  for (const t of rows) {
    const key = t.bundle_id ?? t.id;
    if (!groups.has(key)) groups.set(key, { ref: key, tickets: [] });
    groups.get(key)!.tickets.push(t);
  }

  const now = Date.now();
  const ABANDON_MS = 15 * 60 * 1000; // 15 min without webhook = abandoned

  const transactions = Array.from(groups.values()).map(({ ref, tickets: bundleTickets }) => {
    const firstTicket = bundleTickets[0];
    const txn = txnByRef.get(ref);
    const buyer = firstTicket.profiles ?? {};
    const tier  = firstTicket.event_tiers ?? {};

    // Classify what actually happened to this attempt:
    //   paid       → txn.status = paid   OR ticket.status = active
    //   failed     → txn.status = failed
    //   abandoned  → still pending, older than 15 min (buyer walked)
    //   pending    → still pending, within 15 min (in-flight)
    //   comp       → no txn, ticket active (manual admin issuance)
    const anyActive = bundleTickets.some(t => t.status === "active");
    const anyCancelled = bundleTickets.some(t => t.status === "cancelled");
    let outcome: "paid" | "failed" | "abandoned" | "pending" | "cancelled" | "comp";
    if (!txn && anyActive) outcome = "comp";
    else if (txn?.status === "paid" || anyActive) outcome = "paid";
    else if (txn?.status === "failed") outcome = "failed";
    else if (anyCancelled && !anyActive) outcome = "cancelled";
    else if (txn && (now - new Date(txn.created_at).getTime()) > ABANDON_MS) outcome = "abandoned";
    else outcome = "pending";

    return {
      ref,
      outcome,
      bundle_size: bundleTickets.length,
      tier_name: tier.name ?? "General",
      buyer: {
        user_id: firstTicket.user_id,
        name: buyer.display_name ?? null,
        email: buyer.email ?? null,
      },
      amount:  txn?.amount != null ? Number(txn.amount) : (Number(tier?.price ?? 0) * bundleTickets.length),
      currency: txn?.currency ?? "PHP",
      method:  (txn?.metadata as any)?.payment_method ?? null,
      payment_link_id: txn?.payment_link_id ?? null,
      txn_status: txn?.status ?? null,
      created_at: txn?.created_at ?? firstTicket.created_at,
      paid_at:    txn?.paid_at ?? null,
      ticket_ids: bundleTickets.map(t => t.id),
    };
  });

  // Sort newest-first so live-monitoring shows the freshest attempt on top.
  transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Summary strip counts for the top of the page.
  const summary = {
    total:     transactions.length,
    paid:      transactions.filter(t => t.outcome === "paid").length,
    pending:   transactions.filter(t => t.outcome === "pending").length,
    abandoned: transactions.filter(t => t.outcome === "abandoned").length,
    failed:    transactions.filter(t => t.outcome === "failed").length,
    cancelled: transactions.filter(t => t.outcome === "cancelled").length,
    comp:      transactions.filter(t => t.outcome === "comp").length,
    revenue:   transactions.filter(t => t.outcome === "paid").reduce((s, t) => s + t.amount, 0),
  };

  return NextResponse.json({ event_id: eventId, transactions, summary });
}

function emptySummary() {
  return { total: 0, paid: 0, pending: 0, abandoned: 0, failed: 0, cancelled: 0, comp: 0, revenue: 0 };
}
