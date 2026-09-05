import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * List a member's refundable purchases, grouped by kind, so the New
 * Refund form doesn't force admins to paste UUIDs from Supabase.
 *
 * GET /api/admin/refunds/refundable?user_id=<clerk_id>
 *
 * Refundable = paid AND not already refunded / cancelled. We DON'T
 * exclude rows that already have a pending refund row — a duplicate
 * refund is caught downstream by the refunds insert / paymongo/process
 * idempotency, and this way an admin can still see "there's already a
 * pending refund" instead of nothing.
 *
 * Super-admin only (parity with the refunds routes).
 */

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

export async function GET(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Super admin only" }, { status: 403 });

  const target = new URL(req.url).searchParams.get("user_id")?.trim();
  if (!target) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const admin = createAdminClient();

  const [tickets, orders, donations] = await Promise.all([
    (admin as any)
      .from("event_tickets")
      .select("id, ticket_number, amount_paid, payment_status, status, created_at, event_id, events:event_id(title)")
      .eq("user_id", target)
      .eq("payment_status", "paid")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(20),
    (admin as any)
      .from("orders")
      .select("id, total, payment_status, order_status, created_at")
      .eq("user_id", target)
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(20),
    (admin as any)
      .from("donations")
      .select("id, amount, status, created_at, message")
      .eq("user_id", target)
      .in("status", ["completed", "succeeded", "paid"])
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    tickets:   (tickets.data   ?? []).map((t: any) => ({
      id:            t.id,
      ticket_number: t.ticket_number,
      amount:        Number(t.amount_paid ?? 0),
      event_title:   t.events?.title ?? "Event",
      created_at:    t.created_at,
    })),
    orders:    (orders.data    ?? []).map((o: any) => ({
      id:         o.id,
      total:      Number(o.total ?? 0),
      created_at: o.created_at,
    })),
    donations: (donations.data ?? []).map((d: any) => ({
      id:         d.id,
      amount:     Number(d.amount ?? 0),
      message:    d.message ?? null,
      created_at: d.created_at,
    })),
  });
}
