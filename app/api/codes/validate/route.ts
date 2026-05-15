import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { code, subtotal, cart_items } = body;

  if (!code?.trim()) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  const admin = createAdminClient();
  const { data: promo, error } = await (admin.from("promo_codes") as any)
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !promo) return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });

  // Check expiry
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
  }

  // Check max uses
  if (promo.max_uses && (promo.used_count ?? 0) >= promo.max_uses) {
    return NextResponse.json({ error: "This promo code has reached its usage limit" }, { status: 400 });
  }

  // Check product restriction
  const hasProductRestriction = promo.product_ids?.length > 0;
  let eligibleSubtotal = subtotal ?? 0;

  if (hasProductRestriction && cart_items?.length) {
    const eligibleItems = cart_items.filter((item: any) =>
      promo.product_ids.includes(item.product_id)
    );
    if (eligibleItems.length === 0) {
      return NextResponse.json({ error: "This code does not apply to any items in your cart" }, { status: 400 });
    }
    eligibleSubtotal = eligibleItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity, 0
    );
  }

  // Calculate discount
  let discount = 0;
  if (promo.discount_type === "percent") {
    discount = Math.round((eligibleSubtotal * promo.discount_value) / 100);
  } else {
    discount = Math.min(promo.discount_value, eligibleSubtotal);
  }

  return NextResponse.json({
    valid: true,
    code: promo.code,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    discount,
    promo_code_id: promo.id,
    eligible_product_ids: hasProductRestriction ? promo.product_ids : null,
  });
}
