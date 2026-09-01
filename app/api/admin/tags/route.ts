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

// GET /api/admin/tags → all tags with usage_count
export async function GET() {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const [tagsRes, countsRes] = await Promise.all([
    (admin as any).from("member_tags").select("*").order("sort_order").order("name"),
    (admin as any).from("member_tag_assignments").select("tag_id"),
  ]);
  if (tagsRes.error) return NextResponse.json({ error: tagsRes.error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  for (const r of (countsRes.data as any[]) ?? []) counts[r.tag_id] = (counts[r.tag_id] ?? 0) + 1;

  const tags = (tagsRes.data as any[]).map(t => ({ ...t, usage_count: counts[t.id] ?? 0 }));
  return NextResponse.json({ tags });
}

// POST /api/admin/tags  { name, color?, description?, sort_order? }
export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, color, description, sort_order } = body ?? {};
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("member_tags")
    .insert({
      name: name.trim(),
      color: (color ?? "").trim() || "#1A8040",
      description: (description ?? "").trim() || null,
      sort_order: Number.isFinite(+sort_order) ? +sort_order : 0,
      created_by: userId,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "create_tag", target_type: "member_tag", target_id: (data as any).id, details: { name: name.trim() }, req });
  return NextResponse.json({ tag: data });
}

// PATCH /api/admin/tags  { id, name?, color?, description?, sort_order? }
export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...rest } = body ?? {};
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  for (const k of ["name", "color", "description", "sort_order"] as const) {
    if (rest[k] !== undefined) patch[k] = rest[k];
  }

  const admin = createAdminClient();
  const { data, error } = await (admin as any).from("member_tags").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "update_tag", target_type: "member_tag", target_id: id, details: patch, req });
  return NextResponse.json({ tag: data });
}

// DELETE /api/admin/tags?id=...  (cascade removes assignments)
export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await (admin as any).from("member_tags").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "delete_tag", target_type: "member_tag", target_id: id, req });
  return NextResponse.json({ ok: true });
}
