import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// PATCH /api/admin/products/bulk  { ids: string[], is_active: boolean }
// Hides or shows many products in one round-trip — picking them off one at a
// time is the slow path this exists to replace.
export async function PATCH(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { ids, is_active } = body ?? {};
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "ids required" }, { status: 400 });
  if (ids.length > 200) return NextResponse.json({ error: "Max 200 products per bulk operation" }, { status: 400 });
  if (typeof is_active !== "boolean") return NextResponse.json({ error: "is_active must be true or false" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("products")
    .update({ is_active })
    .in("id", ids)
    .select("id, name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const updated = (data as any[]) ?? [];

  logAudit({
    userId,
    action: is_active ? "bulk_show_products" : "bulk_hide_products",
    target_type: "product",
    target_id: updated.map(p => p.id).join(","),
    details: { count: updated.length, is_active, names: updated.map(p => p.name) },
    req,
  });

  return NextResponse.json({ updated: updated.length, ids: updated.map(p => p.id) });
}
