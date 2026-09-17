import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Read-only list of product categories for the admin product forms.
//
// /api/super/categories already exists but is gated to super_admin, while
// adding products is an admin task. Without this the create form asked staff to
// paste a raw UUID from the database, which is a trap: a wrong or blank value
// leaves the product with no category, so it never appears under any category
// filter in the shop and its URL reads /shop/undefined/<id>.
export async function GET() {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await (createAdminClient() as any)
    .from("product_categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}
