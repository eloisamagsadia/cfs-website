import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/shop/stock  → all products sorted by stock ASC + 30-day units sold
export async function GET(_req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const [productsRes, ordersRes] = await Promise.all([
    (admin as any)
      .from("products")
      .select("id, name, price, images, stock, is_active, category_id")
      .order("stock", { ascending: true }),
    (admin as any)
      .from("orders")
      .select("items, created_at, payment_status")
      .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
      .in("payment_status", ["paid", "free"]),
  ]);

  if (productsRes.error) return NextResponse.json({ error: productsRes.error.message }, { status: 500 });

  const sold30d: Record<string, number> = {};
  for (const o of (ordersRes.data as any[]) ?? []) {
    for (const it of (o.items as any[]) ?? []) {
      const pid = it?.product_id ?? it?.product?.id;
      const qty = Number(it?.quantity ?? 0);
      if (!pid || !qty) continue;
      sold30d[pid] = (sold30d[pid] ?? 0) + qty;
    }
  }

  const products = (productsRes.data as any[]).map(p => ({
    ...p,
    sold_30d:  sold30d[p.id] ?? 0,
    image:     Array.isArray(p.images) ? p.images[0] ?? null : null,
  }));

  return NextResponse.json({ products });
}
