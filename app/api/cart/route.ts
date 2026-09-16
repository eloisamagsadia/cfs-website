import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const isPrivileged = role === "admin" || role === "super_admin";
  const { data } = await admin().from("cart_items").select("*, products(name,price,images,is_active)").eq("user_id", userId);
  // A product hidden after it was added to a cart must drop out of that
  // cart too, otherwise "hidden from the shop" still checks out. The
  // cart_items row is left alone, so the item returns if it's unhidden.
  // Admins keep hidden items so they can test the purchase flow.
  const items = isPrivileged
    ? (data ?? [])
    : (data ?? []).filter((i: any) => i.products?.is_active !== false);
  return NextResponse.json({ items });
}

export async function DELETE(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await admin().from("cart_items").delete().eq("id", id).eq("user_id", userId);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, quantity } = await req.json();
  // Same client-supplied quantity hazard as /api/cart/add — this handler had
  // no validation at all, so a negative or fractional value went straight in.
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
    return NextResponse.json({ error: "Quantity must be a whole number between 1 and 999." }, { status: 400 });
  }
  const { data: row } = await admin()
    .from("cart_items").select("product_id").eq("id", id).eq("user_id", userId).maybeSingle();
  if (!row) return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  const { data: prod } = await admin()
    .from("products").select("stock").eq("id", (row as any).product_id).maybeSingle();
  const stock = Number((prod as any)?.stock) || 0;
  if (qty > stock) {
    return NextResponse.json(
      { error: stock === 0 ? "This product is out of stock." : `Only ${stock} left in stock.` },
      { status: 409 },
    );
  }
  const { data } = await admin().from("cart_items").update({ quantity: qty }).eq("id", id).eq("user_id", userId).select().single();
  return NextResponse.json({ cartItem: data });
}
