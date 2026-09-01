import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export async function GET() {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: drives, error } = await (admin as any)
    .from("donation_drives")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate raised amount per drive from allocations
  const { data: allocs } = await (admin as any)
    .from("donation_drive_allocations")
    .select("drive_id, amount");
  const raisedMap = new Map<string, number>();
  for (const a of (allocs ?? []) as any[]) {
    raisedMap.set(a.drive_id, (raisedMap.get(a.drive_id) ?? 0) + Number(a.amount ?? 0));
  }
  const withRaised = (drives ?? []).map((d: any) => ({ ...d, raised: raisedMap.get(d.id) ?? 0 }));
  return NextResponse.json({ drives: withRaised });
}

export async function POST(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const row: Record<string, any> = {
    name,
    slug: slugify(body.slug || name),
    category: (body.category?.trim() || "general"),
    description: body.description?.trim() || null,
    target_amount: body.target_amount != null && body.target_amount !== "" ? Number(body.target_amount) : null,
    cover_url: body.cover_url?.trim() || null,
    is_active: body.is_active !== false,
    sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0,
  };

  const admin = createAdminClient();
  const { data, error } = await (admin as any).from("donation_drives").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "create_donation_drive", target_type: "donation_drive", target_id: (data as any)?.id, details: { name }, req });
  return NextResponse.json({ drive: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (typeof updates.name === "string" && updates.name.trim()) patch.name = updates.name.trim();
  if (typeof updates.slug === "string" && updates.slug.trim()) patch.slug = slugify(updates.slug);
  if (typeof updates.category === "string") patch.category = updates.category.trim() || "general";
  if (updates.description !== undefined) patch.description = updates.description?.trim() || null;
  if (updates.target_amount !== undefined) patch.target_amount = updates.target_amount === "" || updates.target_amount == null ? null : Number(updates.target_amount);
  if (updates.cover_url !== undefined) patch.cover_url = updates.cover_url?.trim() || null;
  if (updates.is_active !== undefined) patch.is_active = !!updates.is_active;
  if (updates.sort_order !== undefined) patch.sort_order = Number.isFinite(Number(updates.sort_order)) ? Number(updates.sort_order) : 0;

  const admin = createAdminClient();
  const { data, error } = await (admin as any).from("donation_drives").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "edit_donation_drive", target_type: "donation_drive", target_id: id, details: { fields: Object.keys(patch).filter(k => k !== "updated_at") }, req });
  return NextResponse.json({ drive: data });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await (admin as any).from("donation_drives").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "delete_donation_drive", target_type: "donation_drive", target_id: id, req });
  return NextResponse.json({ ok: true });
}
