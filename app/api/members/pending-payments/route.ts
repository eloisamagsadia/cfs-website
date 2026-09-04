import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Lists the caller's tickets that are still awaiting payment, together
// with the original PayMongo checkout_url (if we still have it) so the
// buyer can resume the same payment session — no need to start over.
//
// GET /api/members/pending-payments
export async function GET(_req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Load pending-payment tickets. Group by bundle so a Bundle of Four
  // shows up as one payment obligation, not four.
  const { data: tickets } = await (admin.from("event_tickets") as any)
    .select("id, ticket_number, bundle_id, event_id, tier_id, created_at, events:event_id(title, date, location), event_tiers:tier_id(name, price)")
    .eq("user_id", userId)
    .eq("status", "pending_payment")
    .order("created_at", { ascending: false });

  const rows = (tickets ?? []) as any[];
  if (rows.length === 0) return NextResponse.json({ pending: [] });

  // Group by bundle_id (or ticket.id for solos).
  const groups = new Map<string, { ref: string; items: any[] }>();
  for (const t of rows) {
    const key = t.bundle_id ?? t.id;
    if (!groups.has(key)) groups.set(key, { ref: key, items: [] });
    groups.get(key)!.items.push(t);
  }

  const refs = Array.from(groups.keys());
  const { data: txns } = await (admin.from("payment_transactions") as any)
    .select("reference_id, amount, currency, status, metadata, created_at, payment_link_id")
    .in("reference_id", refs)
    .eq("type", "ticket")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const txnByRef = new Map<string, any>();
  for (const t of (txns ?? [])) {
    // Keep the newest attempt per reference (latest wins).
    const existing = txnByRef.get(t.reference_id);
    if (!existing || new Date(t.created_at) > new Date(existing.created_at)) {
      txnByRef.set(t.reference_id, t);
    }
  }

  const now = Date.now();
  const LINK_TTL_MS = 23 * 60 * 60 * 1000; // treat >23h old as likely expired

  const pending = Array.from(groups.values()).map(({ ref, items }) => {
    const first = items[0];
    const txn = txnByRef.get(ref);
    const meta = (txn?.metadata as any) ?? {};
    const linkCreated = meta.link_created_at ? new Date(meta.link_created_at).getTime() : (txn?.created_at ? new Date(txn.created_at).getTime() : 0);
    const link_maybe_expired = linkCreated > 0 && (now - linkCreated) > LINK_TTL_MS;
    return {
      ref,
      ticket_id: first.id,
      ticket_number: first.ticket_number,
      bundle_size: items.length,
      created_at: first.created_at,
      event: {
        title: first.events?.title ?? "Event",
        date:  first.events?.date  ?? null,
        location: first.events?.location ?? null,
      },
      tier: {
        name: first.event_tiers?.name ?? "General",
        price: Number(first.event_tiers?.price ?? 0),
      },
      amount: txn?.amount != null ? Number(txn.amount) : Number(first.event_tiers?.price ?? 0),
      checkout_url: meta.checkout_url ?? null,
      link_created_at: meta.link_created_at ?? null,
      link_maybe_expired,
      payment_link_id: txn?.payment_link_id ?? null,
    };
  });

  return NextResponse.json({ pending });
}
