import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") return null;
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
  const { id, order_status, payment_status } = body;
  if (!id) return NextResponse.json({ error: "Order ID required" }, { status: 400 });
  const payload: Record<string, any> = {};
  if (order_status !== undefined) payload.order_status = order_status;
  if (payment_status !== undefined) payload.payment_status = payment_status;
  const admin = createAdminClient();
  const { data, error } = await (admin.from("orders") as any).update(payload).eq("id", id).select("*, profiles:user_id(id, display_name)").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
