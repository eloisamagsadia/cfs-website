import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

export async function GET(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to   = searchParams.get("to")   || new Date().toISOString();

  const admin = createAdminClient();

  // Donations — completed only
  const donationsQ = (admin.from("donations") as any)
    .select("amount, created_at")
    .eq("status", "completed")
    .gte("created_at", from)
    .lte("created_at", to);

  // Orders — paid only
  const ordersQ = (admin.from("orders") as any)
    .select("total, created_at")
    .eq("payment_status", "paid")
    .gte("created_at", from)
    .lte("created_at", to);

  // Tickets — active or used only, with joined tier/event for price
  const ticketsQ = (admin.from("event_tickets") as any)
    .select("created_at, event_tiers:tier_id(price), events:event_id(price)")
    .in("status", ["active", "used"])
    .eq("payment_status", "paid")
    .gte("created_at", from)
    .lte("created_at", to);

  const [d, o, t] = await Promise.all([donationsQ, ordersQ, ticketsQ]);

  if (d.error) return NextResponse.json({ error: d.error.message }, { status: 500 });
  if (o.error) return NextResponse.json({ error: o.error.message }, { status: 500 });
  if (t.error) return NextResponse.json({ error: t.error.message }, { status: 500 });

  const donations_total = (d.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
  const donations_count = d.data?.length ?? 0;

  const orders_total = (o.data ?? []).reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);
  const orders_count = o.data?.length ?? 0;

  const tickets_total = (t.data ?? []).reduce((s: number, r: any) => {
    const price = Number(r.event_tiers?.price ?? r.events?.price ?? 0);
    return s + price;
  }, 0);
  const tickets_count = t.data?.length ?? 0;

  return NextResponse.json({
    range: { from, to },
    donations: { total: donations_total, count: donations_count },
    orders:    { total: orders_total,    count: orders_count },
    tickets:   { total: tickets_total,   count: tickets_count },
    grand_total: donations_total + orders_total + tickets_total,
  });
}
