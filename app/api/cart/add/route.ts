import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admins/super_admins can buy hidden products so the full purchase
  // workflow stays testable while the shop is closed to the public.
  // Mirrors the preview rule on the product detail page.
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const isPrivileged = role === "admin" || role === "super_admin";

  const { product_id, quantity = 1, variant = null } = await req.json();
  if (!product_id) return NextResponse.json({ error: "Missing product_id" }, { status: 400 });

  // Quantity is client-supplied. Without this a negative value sails past the
  // stock check below (wanted < stock), landing a negative quantity in the
  // cart and a negative line total at checkout.
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
    return NextResponse.json({ error: "Quantity must be a whole number between 1 and 999." }, { status: 400 });
  }

  // The product detail page can be reached by direct URL, and listings are the
  // only place is_active is filtered — so validate here rather than trusting
  // that the client came from a legitimate listing. Unpublished products must
  // not be addable to a cart.
  const { data: productRaw } = await (((supabase.from("products") as any) as any) as any)
    .select("id, name, is_active, stock").eq("id", product_id).maybeSingle();
  const product = productRaw as any;
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (!product.is_active && !isPrivileged) {
    return NextResponse.json({ error: "This product is not available." }, { status: 403 });
  }

  const { data: existingRaw } = await (((supabase.from("cart_items") as any) as any) as any).select("*").eq("user_id", userId).eq("product_id", product_id).maybeSingle();
  const existing = existingRaw as any;

  // Catch an oversell here rather than letting the buyer fill in a whole
  // shipping form before /api/orders/create rejects it. That remains the
  // authoritative gate — this is the early, friendlier one.
  const stock = Number(product.stock) || 0;
  const wanted = (existing?.quantity ?? 0) + qty;
  if (wanted > stock) {
    return NextResponse.json(
      { error: stock === 0 ? "This product is out of stock." : `Only ${stock} left in stock.` },
      { status: 409 },
    );
  }

  if (existing) {
    const { data, error } = await (((supabase.from("cart_items") as any) as any) as any).update({ quantity: existing.quantity + qty }).eq("id", existing.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cartItem: data });
  }

  const { data, error } = await (((supabase.from("cart_items") as any) as any) as any).insert({ user_id: userId, product_id, quantity: qty, variant }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cartItem: data });
}
