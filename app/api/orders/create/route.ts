import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items, subtotal, shipping_fee, total, shipping_address } = await req.json();
  if (!items?.length || !shipping_address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createAdminClient();

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

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
