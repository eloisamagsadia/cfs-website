import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product_id, quantity = 1, variant = null } = await req.json();
  if (!product_id) return NextResponse.json({ error: "Missing product_id" }, { status: 400 });

  const { data: existing } = await supabase.from("cart_items").select("*").eq("user_id", userId).eq("product_id", product_id).single();
  if (existing) {
    const { data, error } = await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cartItem: data });
  }

  const { data, error } = await supabase.from("cart_items").insert({ user_id: userId, product_id, quantity, variant }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cartItem: data });
}
