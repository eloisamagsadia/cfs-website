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

// GET /api/admin/members/tags?member_id=... → tags for one member
// GET /api/admin/members/tags                → { [member_id]: tag[] }  (batch, all)
export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = new URL(req.url).searchParams.get("member_id");
  const admin    = createAdminClient();

  if (memberId) {
    const { data, error } = await (admin as any)
      .from("member_tag_assignments")
      .select("tag:tag_id(id, name, color, description)")
      .eq("member_id", memberId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const tags = (data as any[]).map(r => r.tag).filter(Boolean);
    return NextResponse.json({ tags });
  }

  // Batch — one query, group in memory
  const { data, error } = await (admin as any)
    .from("member_tag_assignments")
    .select("member_id, tag:tag_id(id, name, color)");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byMember: Record<string, any[]> = {};
  for (const r of (data as any[]) ?? []) {
    if (!r.tag) continue;
    (byMember[r.member_id] ??= []).push(r.tag);
  }
  return NextResponse.json({ byMember });
}

// POST /api/admin/members/tags  { member_id, tag_id }  → assign
export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { member_id, tag_id } = await req.json();
  if (!member_id || !tag_id) return NextResponse.json({ error: "member_id and tag_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("member_tag_assignments")
    .upsert({ member_id, tag_id, assigned_by: userId }, { onConflict: "member_id,tag_id" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "assign_tag", target_type: "profile", target_id: member_id, details: { tag_id }, req });
  return NextResponse.json({ assignment: data });
}

// DELETE /api/admin/members/tags?member_id=...&tag_id=...  → unassign
export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url    = new URL(req.url);
  const member = url.searchParams.get("member_id");
  const tag    = url.searchParams.get("tag_id");
  if (!member || !tag) return NextResponse.json({ error: "member_id and tag_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await (admin as any).from("member_tag_assignments").delete().eq("member_id", member).eq("tag_id", tag);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "unassign_tag", target_type: "profile", target_id: member, details: { tag_id: tag }, req });
  return NextResponse.json({ ok: true });
}
