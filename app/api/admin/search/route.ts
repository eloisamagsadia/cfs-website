import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/search?q=...  → { events, products, members, orders, donations }
export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ events: [], products: [], members: [], orders: [], donations: [] });

  const admin = createAdminClient();
  const like  = `%${q}%`;
  // If q looks like a UUID prefix, allow the order/donation lookups to hit it
  const uuidLike = /^[0-9a-f-]{4,}$/i.test(q) ? `${q.toLowerCase()}%` : null;

  const [events, products, members, orders, donations] = await Promise.all([
    (admin as any).from("events").select("id, title, date, is_hidden").ilike("title", like).order("date", { ascending: false }).limit(5),
    (admin as any).from("products").select("id, name, price, stock, images").ilike("name", like).limit(5),
    (admin as any).from("profiles").select("id, display_name, email, avatar_url, role, is_banned").or(`display_name.ilike.${like},email.ilike.${like}`).limit(6),
    uuidLike
      ? (admin as any).from("orders").select("id, total, payment_status, created_at, profiles:user_id(display_name)").ilike("id", uuidLike).order("created_at", { ascending: false }).limit(5)
      : (admin as any).from("orders").select("id, total, payment_status, created_at, profiles:user_id(display_name)").order("created_at", { ascending: false }).limit(0),
    uuidLike
      ? (admin as any).from("donations").select("id, amount, status, created_at, profiles:user_id(display_name)").ilike("id", uuidLike).order("created_at", { ascending: false }).limit(5)
      : (admin as any).from("donations").select("id, amount, status, created_at, profiles:user_id(display_name)").order("created_at", { ascending: false }).limit(0),
  ]);

  return NextResponse.json({
    events:    events.data    ?? [],
    products:  products.data  ?? [],
    members:   members.data   ?? [],
    orders:    orders.data    ?? [],
    donations: donations.data ?? [],
  });
}
