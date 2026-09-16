import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const isPrivileged = role === "admin" || role === "super_admin";

  const { items, subtotal, shipping_fee, total, shipping_address } = await req.json();
  if (!items?.length || !shipping_address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Last line of defence for hidden products: the client posts whatever it
  // had in memory, so a cart loaded before the product was hidden would
  // otherwise still place an order for it. Admins are exempt — they need to
  // be able to run a real purchase through a hidden product to test it.
  const productIds = items.map((i: any) => i.product_id).filter(Boolean);
  const { data: liveProducts } = await (supabase.from("products") as any)
    .select("id, name, is_active")
    .in("id", productIds);
  const unavailable = isPrivileged ? [] : (liveProducts ?? []).filter((p: any) => !p.is_active);
  if (unavailable.length || (liveProducts ?? []).length !== new Set(productIds).size) {
    const names = unavailable.map((p: any) => p.name).filter(Boolean).join(", ");
    return NextResponse.json(
      { error: names ? `No longer available: ${names}. Please remove it from your cart.` : "One or more items are no longer available." },
      { status: 409 },
    );
  }

  const { data: order, error } = await (supabase.from("orders") as any)
    .insert({
      user_id: userId,
      items: items.map((i: any) => ({
        product_id: i.product_id,
        name: i.products?.name,
        quantity: i.quantity,
        unit_price: i.products?.price ?? 0,
      })),
      subtotal,
      shipping_fee,
      discount: 0,
      total,
      shipping_address,
      payment_status: "pending",
      order_status: "pending",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await (supabase.from("order_items") as any).insert(
    items.map((i: any) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.products?.price ?? 0,
    }))
  );

  logAudit({
    userId,
    action: "place_order",
    target_type: "order",
    target_id: order.id,
    details: { item_count: items.length, subtotal, shipping_fee, total },
    req,
  });

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
