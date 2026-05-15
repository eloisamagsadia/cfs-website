import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmation } from "@/lib/email";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return userId;
}

export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const { data, error } = await (admin.from("orders") as any).select("*, profiles:user_id(id, display_name, avatar_url)").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ order: data });
  }
  const { data, error } = await (admin.from("orders") as any).select("*, profiles:user_id(id, display_name)").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, order_status, payment_status } = body;
  if (!id) return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  const payload: Record<string, any> = {};
  if (order_status !== undefined) payload.order_status = order_status;
  if (payment_status !== undefined) payload.payment_status = payment_status;
  const admin = createAdminClient();
  const { data, error } = await (admin.from("orders") as any).update(payload).eq("id", id).select("*, profiles:user_id(id, display_name)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}

export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { user_id, items, subtotal, shipping_fee, discount, total, shipping_address, payment_status, order_status, notes } = body;
  if (!user_id || !items?.length) return NextResponse.json({ error: "user_id and items are required" }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await (admin.from("orders") as any).insert({
    user_id,
    items,
    subtotal: subtotal ?? 0,
    shipping_fee: shipping_fee ?? 0,
    discount: discount ?? 0,
    total: total ?? 0,
    shipping_address: shipping_address ?? {},
    payment_status: payment_status ?? "pending",
    order_status: order_status ?? "pending",
    notes: notes ?? null,
  }).select("*, profiles:user_id(id, display_name)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send order confirmation email
  try {
    const { data: profile } = await (admin.from("profiles") as any).select("email").eq("id", user_id).single();
    if (profile?.email) {
      await sendOrderConfirmation({
        to: profile.email,
        orderId: data.id,
        items: data.items ?? [],
        total: data.total ?? 0,
        shippingAddress: data.shipping_address ?? {},
      });
    }
  } catch (e) {
    console.error("Failed to send order confirmation email:", e);
  }

  return NextResponse.json({ order: data }, { status: 201 });
}
