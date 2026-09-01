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

const VALID_STATUS = ["pending", "reviewed", "resolved"] as const;

export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = new URL(req.url).searchParams.get("status");
  const admin = createAdminClient();
  let q = (admin as any).from("community_reports").select(`
      id, reporter_id, post_id, comment_id, reason, status, created_at,
      reviewed_by, reviewed_at, resolution_note,
      reporter:reporter_id(id, display_name, avatar_url),
      post:post_id(id, content, is_hidden, user_id, media_url, profiles:user_id(display_name, avatar_url)),
      comment:comment_id(id, content, user_id, profiles:user_id(display_name, avatar_url))
    `).order("created_at", { ascending: false });
  if (status && VALID_STATUS.includes(status as any)) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status, resolution_note, action } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();

  // Optional companion action: hide the target post or delete it, in one go
  if (action === "hide_post" || action === "delete_post") {
    const { data: report } = await (admin as any).from("community_reports").select("post_id").eq("id", id).maybeSingle();
    if (report?.post_id) {
      if (action === "hide_post") {
        await (admin as any).from("community_posts").update({ is_hidden: true }).eq("id", report.post_id);
        await logAudit({ userId, action: "hide_post", target_type: "community_post", target_id: report.post_id, details: { via: "reports_queue" }, req });
      } else {
        await (admin as any).from("community_posts").delete().eq("id", report.post_id);
        await logAudit({ userId, action: "delete_post", target_type: "community_post", target_id: report.post_id, details: { via: "reports_queue" }, req });
      }
    }
  }

  const patch: Record<string, any> = { reviewed_by: userId, reviewed_at: new Date().toISOString() };
  if (VALID_STATUS.includes(status)) patch.status = status;
  if (typeof resolution_note === "string") patch.resolution_note = resolution_note.trim() || null;

  const { data, error } = await (admin as any).from("community_reports").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: `resolve_report_${status ?? "reviewed"}`, target_type: "community_report", target_id: id, details: { action, resolution_note: resolution_note ?? null }, req });
  return NextResponse.json({ report: data });
}
