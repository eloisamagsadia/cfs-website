import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// PATCH /api/admin/orders/bulk  { ids: string[], order_status?, payment_status? }
export async function PATCH(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { ids, order_status, payment_status } = body ?? {};
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "ids required" }, { status: 400 });
  if (ids.length > 200) return NextResponse.json({ error: "Max 200 orders per bulk operation" }, { status: 400 });
  if (!order_status && !payment_status) return NextResponse.json({ error: "Nothing to change" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (order_status)   patch.order_status   = order_status;
  if (payment_status) patch.payment_status = payment_status;

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("orders")
    .update(patch)
    .in("id", ids)
    .select("id, user_id, order_status");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const updated = (data as any[]) ?? [];

  // Drop one notification per member whose status changed to something visible
  if (order_status) {
    const rows = updated
      .filter(o => !!o.user_id)
      .map(o => ({
        user_id: o.user_id,
        type: "order_update",
        title: "Order status updated",
        message: `Your order is now ${order_status.replace("_", " ").toUpperCase()}.`,
        link: `/members/orders`,
        is_read: false,
      }));
    if (rows.length) await (admin as any).from("notifications").insert(rows);
  }

  await logAudit({
    userId,
    action: "bulk_update_orders",
    target_type: "order",
    details: { count: updated.length, order_status, payment_status },
    req,
  });
  return NextResponse.json({ updated: updated.length });
}
