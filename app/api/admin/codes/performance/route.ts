import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/codes/performance?days=90  → per-code stats + totals
export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const days = Math.max(1, Math.min(365, parseInt(new URL(req.url).searchParams.get("days") ?? "90") || 90));
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const admin = createAdminClient();
  const [codesRes, ordersRes] = await Promise.all([
    (admin as any).from("promo_codes").select("*").order("created_at", { ascending: false }),
    (admin as any).from("orders")
      .select("id, promo_code_id, discount, subtotal, total, payment_status, created_at, user_id")
      .not("promo_code_id", "is", null)
      .gte("created_at", since),
  ]);
  if (codesRes.error) return NextResponse.json({ error: codesRes.error.message }, { status: 500 });

  const stats: Record<string, { redemptions: number; paid_redemptions: number; discount_given: number; revenue: number; last_used: string | null; unique_customers: Set<string> }> = {};

  for (const o of (ordersRes.data as any[]) ?? []) {
    const cid = o.promo_code_id;
    if (!cid) continue;
    stats[cid] ??= { redemptions: 0, paid_redemptions: 0, discount_given: 0, revenue: 0, last_used: null, unique_customers: new Set<string>() };
    const s = stats[cid];
    s.redemptions++;
    if (o.payment_status === "paid" || o.payment_status === "free") {
      s.paid_redemptions++;
      s.discount_given += Number(o.discount ?? 0);
      s.revenue        += Number(o.total ?? 0);
    }
    if (o.user_id) s.unique_customers.add(o.user_id);
    if (!s.last_used || o.created_at > s.last_used) s.last_used = o.created_at;
  }

  const codes = (codesRes.data as any[]).map(c => {
    const s = stats[c.id];
    return {
      ...c,
      redemptions:      s?.redemptions      ?? 0,
      paid_redemptions: s?.paid_redemptions ?? 0,
      discount_given:   Number(s?.discount_given ?? 0),
      revenue:          Number(s?.revenue        ?? 0),
      unique_customers: s?.unique_customers?.size ?? 0,
      last_used:        s?.last_used ?? null,
    };
  });

  const totals = codes.reduce((a, c) => ({
    redemptions:      a.redemptions      + c.paid_redemptions,
    discount_given:   a.discount_given   + c.discount_given,
    revenue:          a.revenue          + c.revenue,
  }), { redemptions: 0, discount_given: 0, revenue: 0 });

  return NextResponse.json({ codes, totals, window_days: days });
}
