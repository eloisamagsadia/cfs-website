import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, subtotal } = await req.json();
  if (!code?.trim()) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  // Use admin client to bypass RLS on promo_codes table
  const admin = createAdminClient();
  const { data: promoRaw, error } = await admin
    .from("promo_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single();

  const promo = promoRaw as any;
  if (error || !promo) return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });

  if (!promo.is_active) return NextResponse.json({ error: "This code is no longer active" }, { status: 400 });

  if (promo.expires_at && new Date(promo.expires_at) < new Date())
    return NextResponse.json({ error: "This code has expired" }, { status: 400 });

  if (promo.max_uses && promo.used_count >= promo.max_uses)
    return NextResponse.json({ error: "This code has reached its usage limit" }, { status: 400 });

  const discount = promo.discount_type === "percent"
    ? Math.round((subtotal * promo.discount_value) / 100)
    : promo.discount_value;

  return NextResponse.json({
    valid: true,
    code: promo.code,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    discount,
    promo_code_id: promo.id,
  });
}
