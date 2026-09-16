import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrementProductStock } from "@/lib/stock";
import { sendOrderConfirmation, sendOrderShipped } from "@/lib/email";
import { resolveTrackingUrl } from "@/lib/couriers";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return userId;
}

export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const { data, error } = await (admin.from("orders") as any).select("*, profiles:user_id(id, display_name, avatar_url)").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ order: data });
  }
  const { data, error } = await (admin.from("orders") as any).select("*, profiles:user_id(id, display_name)").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, order_status, payment_status, courier, tracking_number, tracking_url } = body;
  if (!id) return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  const payload: Record<string, any> = {};
  if (order_status !== undefined) payload.order_status = order_status;
  if (payment_status !== undefined) payload.payment_status = payment_status;
  if (courier !== undefined) payload.courier = courier?.trim() || null;
  if (tracking_number !== undefined) payload.tracking_number = tracking_number?.trim() || null;
  if (tracking_url !== undefined) payload.tracking_url = tracking_url?.trim() || null;
  const admin = createAdminClient();

  // Read the pre-update row so we can tell a genuine transition into `shipped`
  // from a re-save of an order that was already shipped. shipped_at is the
  // "already emailed" flag: it is stamped once and never cleared here.
  const { data: beforeRaw } = await (admin.from("orders") as any)
    .select("order_status, shipped_at").eq("id", id).maybeSingle();
  const before = beforeRaw as any;
  const isShipTransition = order_status === "shipped" && !before?.shipped_at;
  if (isShipTransition) payload.shipped_at = new Date().toISOString();

  const { data, error } = await (admin.from("orders") as any).update(payload).eq("id", id).select("*, profiles:user_id(id, display_name)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Shipped notice — best effort. A mail failure must not fail the status
  // update, or staff would see an error on an order that did change.
  if (isShipTransition && data?.user_id) {
    try {
      // Same resolution order the PayMongo webhook uses: the profiles row
      // first, falling back to the auth provider if it has no email cached.
      const { data: profile } = await (admin.from("profiles") as any)
        .select("email").eq("id", data.user_id).maybeSingle();
      let email = (profile as any)?.email as string | null;
      if (!email) {
        const u = await clerkClient.users.getUser(data.user_id);
        email = u.emailAddresses?.[0]?.emailAddress ?? null;
      }
      if (email) {
        await sendOrderShipped({
          to: email,
          orderId: data.id,
          courier: data.courier,
          trackingNumber: data.tracking_number,
          trackingUrl: resolveTrackingUrl(data.courier, data.tracking_number, data.tracking_url),
          shippingAddress: data.shipping_address,
        });
      }
    } catch (e: any) {
      console.error("[orders] shipped email failed:", e?.message ?? e);
    }
  }

  // Notify member of order status update
  if (data?.user_id && (order_status || payment_status)) {
    const statusMsg = order_status
      ? `Your order status has been updated to: ${order_status.replace("_", " ").toUpperCase()}`
      : `Your payment status has been updated to: ${payment_status.replace("_", " ").toUpperCase()}`;
    await (admin.from("notifications") as any).insert({
      user_id: data.user_id,
      type: "order_update",
      title: "Order Update",
      message: statusMsg,
      link: "/members/orders",
      is_read: false,
    });
  }

  await logAudit({ userId, action: "update_order", target_type: "order", target_id: id, details: { order_status, payment_status, courier, tracking_number, shipped_email_sent: isShipTransition }, req });
  return NextResponse.json({ order: data });
}

export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { user_id, items, subtotal, shipping_fee, discount, total, shipping_address, payment_status, order_status, notes } = body;
  if (!user_id || !items?.length) return NextResponse.json({ error: "user_id and items are required" }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await (admin.from("orders") as any).insert({
    user_id,
    items,
    subtotal: subtotal ?? 0,
    shipping_fee: shipping_fee ?? 0,
    discount: discount ?? 0,
    total: total ?? 0,
    shipping_address: shipping_address ?? {},
    payment_status: payment_status ?? "pending",
    order_status: order_status ?? "pending",
    notes: notes ?? null,
  }).select("*, profiles:user_id(id, display_name)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // A manually recorded sale moves real stock too — otherwise counts drift
  // every time staff log a cash or in-person order.
  if ((payment_status ?? "pending") === "paid") {
    await decrementProductStock(admin, items);
  }

  // Send order confirmation email
  try {
    const { data: profile } = await (admin.from("profiles") as any).select("email").eq("id", user_id).single();
    if (profile?.email) {
      await sendOrderConfirmation({
        to: profile.email,
        orderId: data.id,
        items: data.items ?? [],
        total: data.total ?? 0,
        shippingAddress: data.shipping_address ?? {},
      });
    }
  } catch (e) {
    console.error("Failed to send order confirmation email:", e);
  }

  await logAudit({ userId, action: "create_order", target_type: "order", target_id: (data as any)?.id, details: { total, item_count: items.length }, req });
  return NextResponse.json({ order: data }, { status: 201 });
}
