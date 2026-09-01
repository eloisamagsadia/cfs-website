import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const filter = new URL(req.url).searchParams.get("filter") ?? "pending";
  const admin  = createAdminClient();

  let q = (admin as any)
    .from("fan_letters")
    .select("id, title, content, is_approved, created_at, user_id, profiles:user_id(display_name, avatar_url)")
    .order("created_at", { ascending: false });

  if (filter === "pending")      q = q.eq("is_approved", false);
  else if (filter === "approved") q = q.eq("is_approved", true);
  // filter === "all" → no where clause

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ letters: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, approve } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("fan_letters")
    .update({ is_approved: !!approve })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    userId,
    action: approve ? "approve_fan_letter" : "unapprove_fan_letter",
    target_type: "fan_letter",
    target_id: id,
    details: { title: (data as any)?.title?.slice(0, 80) ?? null },
    req,
  });
  return NextResponse.json({ letter: data });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await (admin as any).from("fan_letters").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "delete_fan_letter", target_type: "fan_letter", target_id: id, req });
  return NextResponse.json({ ok: true });
}
