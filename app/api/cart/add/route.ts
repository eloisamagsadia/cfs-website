import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product_id, quantity = 1, variant = null } = await req.json();
  if (!product_id) return NextResponse.json({ error: "Missing product_id" }, { status: 400 });

  const { data: existingRaw } = await (((supabase.from("cart_items") as any) as any) as any).select("*").eq("user_id", userId).eq("product_id", product_id).single();
  const existing = existingRaw as any;
  if (existing) {
    const { data, error } = await (((supabase.from("cart_items") as any) as any) as any).update({ quantity: existing.quantity + quantity }).eq("id", existing.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cartItem: data });
  }

  const { data, error } = await (((supabase.from("cart_items") as any) as any) as any).insert({ user_id: userId, product_id, quantity, variant }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cartItem: data });
}
