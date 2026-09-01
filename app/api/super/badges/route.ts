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

const TRIGGER_TYPES = ["manual", "event_count", "donation_amount", "post_count", "signup"];

export async function GET(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const badgeId = new URL(req.url).searchParams.get("badge_id");
  const admin = createAdminClient();

  if (badgeId) {
    // List holders of a specific badge
    const { data, error } = await (admin as any)
      .from("user_badges")
      .select("id, user_id, earned_at, profiles:user_id(id, display_name, avatar_url)")
      .eq("badge_id", badgeId)
      .order("earned_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ holders: data ?? [] });
  }

  // Otherwise: badge catalog + holder counts
  const { data: badges, error } = await (admin as any).from("badges").select("*").order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: allUB } = await (admin as any).from("user_badges").select("badge_id");
  const counts = new Map<string, number>();
  for (const r of (allUB ?? []) as any[]) counts.set(r.badge_id, (counts.get(r.badge_id) ?? 0) + 1);

  return NextResponse.json({ badges: (badges ?? []).map((b: any) => ({ ...b, holder_count: counts.get(b.id) ?? 0 })) });
}

export async function POST(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Grant badge to a user
  if (body.action === "grant") {
    const { user_id, badge_id } = body;
    if (!user_id || !badge_id) return NextResponse.json({ error: "user_id and badge_id required" }, { status: 400 });
    const admin = createAdminClient();

    // Ignore duplicate grants — same user + badge silently no-ops
    const { data: existing } = await (admin as any).from("user_badges").select("id").eq("user_id", user_id).eq("badge_id", badge_id).maybeSingle();
    if (existing) return NextResponse.json({ ok: true, already: true });

    const { data, error } = await (admin as any).from("user_badges").insert({ user_id, badge_id }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAudit({ userId, action: "grant_badge", target_type: "user_badge", target_id: user_id, details: { badge_id }, req });
    return NextResponse.json({ ok: true, user_badge: data }, { status: 201 });
  }

  // Create a badge
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const trigger = TRIGGER_TYPES.includes(body.trigger_type) ? body.trigger_type : "manual";
  const row: Record<string, any> = {
    name,
    description: body.description?.trim() || null,
    icon_url: body.icon_url?.trim() || null,
    trigger_type: trigger,
    threshold_value: body.threshold_value != null && body.threshold_value !== "" ? Number(body.threshold_value) : null,
  };

  const admin = createAdminClient();
  const { data, error } = await (admin as any).from("badges").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "create_badge", target_type: "badge", target_id: (data as any)?.id, details: { name, trigger_type: trigger }, req });
  return NextResponse.json({ badge: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, any> = {};
  if (typeof updates.name === "string" && updates.name.trim()) patch.name = updates.name.trim();
  if (updates.description !== undefined) patch.description = updates.description?.trim() || null;
  if (updates.icon_url !== undefined) patch.icon_url = updates.icon_url?.trim() || null;
  if (updates.trigger_type !== undefined && TRIGGER_TYPES.includes(updates.trigger_type)) patch.trigger_type = updates.trigger_type;
  if (updates.threshold_value !== undefined) patch.threshold_value = updates.threshold_value === "" || updates.threshold_value == null ? null : Number(updates.threshold_value);

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No changes" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any).from("badges").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "edit_badge", target_type: "badge", target_id: id, details: { fields: Object.keys(patch) }, req });
  return NextResponse.json({ badge: data });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id       = searchParams.get("id");
  const revokeId = searchParams.get("user_badge_id");
  const admin    = createAdminClient();

  // Revoke a single user_badge grant
  if (revokeId) {
    const { data: existing } = await (admin as any).from("user_badges").select("user_id, badge_id").eq("id", revokeId).maybeSingle();
    const { error } = await (admin as any).from("user_badges").delete().eq("id", revokeId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit({ userId, action: "revoke_badge", target_type: "user_badge", target_id: existing?.user_id ?? revokeId, details: { badge_id: existing?.badge_id, user_badge_id: revokeId }, req });
    return NextResponse.json({ ok: true });
  }

  // Delete a badge from the catalog
  if (!id) return NextResponse.json({ error: "id or user_badge_id required" }, { status: 400 });
  const { error } = await (admin as any).from("badges").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "delete_badge", target_type: "badge", target_id: id, req });
  return NextResponse.json({ ok: true });
}
