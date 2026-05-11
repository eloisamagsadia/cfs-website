import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await admin().from("cart_items").select("*, products(name,price,images)").eq("user_id", userId);
  return NextResponse.json({ items: data ?? [] });
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
