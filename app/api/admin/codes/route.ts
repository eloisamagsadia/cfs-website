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
  const { data, error } = await (admin.from("promo_codes") as any).select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ codes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { code, discount_type, discount_value, max_uses, expires_at } = body;
  if (!code?.trim()) return NextResponse.json({ error: "Code is required" }, { status: 400 });
  if (!discount_value || isNaN(Number(discount_value))) return NextResponse.json({ error: "Valid discount value required" }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await (admin.from("promo_codes") as any).insert({
    code: code.trim().toUpperCase(), discount_type: discount_type || "percent",
    discount_value: Number(discount_value), max_uses: max_uses ? Number(max_uses) : null,
    expires_at: expires_at || null, is_active: true, used_count: 0,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, is_active } = body;
  if (!id) return NextResponse.json({ error: "Code ID required" }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await (admin.from("promo_codes") as any).update({ is_active }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code: data });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Code ID required" }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await (admin.from("promo_codes") as any).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
