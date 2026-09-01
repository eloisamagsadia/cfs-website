import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// Unified CRUD for the three category tables. Type-safe via a small
// registry so we never let a caller name an arbitrary table.
const TABLES: Record<string, { table: string; extraFields: string[] }> = {
  events:    { table: "event_categories",     extraFields: [] },
  products:  { table: "product_categories",   extraFields: ["thumbnail_url"] },
  community: { table: "community_categories", extraFields: ["color"] },
};

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

function resolveType(req: NextRequest): { key: string; table: string; extraFields: string[] } | null {
  const type = new URL(req.url).searchParams.get("type") ?? "";
  const cfg = TABLES[type];
  if (!cfg) return null;
  return { key: type, ...cfg };
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);

export async function GET(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cfg = resolveType(req);
  if (!cfg) return NextResponse.json({ error: "Unknown type" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any).from(cfg.table).select("*").order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cfg = resolveType(req);
  if (!cfg) return NextResponse.json({ error: "Unknown type" }, { status: 400 });

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const row: Record<string, any> = { name, slug: slugify(body.slug || name) };
  for (const f of cfg.extraFields) if (body[f] !== undefined) row[f] = body[f];

  const admin = createAdminClient();
  const { data, error } = await (admin as any).from(cfg.table).insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: `create_${cfg.key}_category`, target_type: cfg.table, target_id: (data as any)?.id, details: { name }, req });
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cfg = resolveType(req);
  if (!cfg) return NextResponse.json({ error: "Unknown type" }, { status: 400 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, any> = {};
  if (typeof updates.name === "string" && updates.name.trim()) patch.name = updates.name.trim();
  if (typeof updates.slug === "string" && updates.slug.trim()) patch.slug = slugify(updates.slug);
  for (const f of cfg.extraFields) if (updates[f] !== undefined) patch[f] = updates[f];

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No changes" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any).from(cfg.table).update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: `edit_${cfg.key}_category`, target_type: cfg.table, target_id: id, details: { fields: Object.keys(patch) }, req });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cfg = resolveType(req);
  if (!cfg) return NextResponse.json({ error: "Unknown type" }, { status: 400 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await (admin as any).from(cfg.table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: `delete_${cfg.key}_category`, target_type: cfg.table, target_id: id, req });
  return NextResponse.json({ ok: true });
}
