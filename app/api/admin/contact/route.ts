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

// GET /api/admin/contact?status=new|replied|archived|spam|all
export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = new URL(req.url).searchParams.get("status") ?? "new";
  const admin  = createAdminClient();

  let q = (admin as any).from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
  if (status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

// PATCH /api/admin/contact  { id, status, reply_note? }
export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status, reply_note } = body ?? {};
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
  if (!["new", "replied", "archived", "spam"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const patch: Record<string, unknown> = { status };
  if (reply_note !== undefined) patch.reply_note = reply_note;
  if (status !== "new")         { patch.handled_by = userId; patch.handled_at = new Date().toISOString(); }

  const admin = createAdminClient();
  const { data, error } = await (admin as any).from("contact_messages").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "update_contact_message", target_type: "contact_message", target_id: id, details: { status }, req });
  return NextResponse.json({ message: data });
}

// DELETE /api/admin/contact?id=...
export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await (admin as any).from("contact_messages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({ userId, action: "delete_contact_message", target_type: "contact_message", target_id: id, req });
  return NextResponse.json({ ok: true });
}
