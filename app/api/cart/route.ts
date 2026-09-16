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
  const { data } = await admin().from("cart_items").update({ quantity }).eq("id", id).eq("user_id", userId).select().single();
  return NextResponse.json({ cartItem: data });
}
