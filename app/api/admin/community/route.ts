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
  const limit = Number(searchParams.get("limit") ?? 50);
  // No is_hidden filter — admin sees ALL posts
  const { data, error } = await admin
    .from("community_posts")
    .select("*, profiles:user_id(id, display_name, avatar_url), community_reactions(id), community_comments(id)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, is_pinned, is_hidden } = body;
  if (!id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  const payload: Record<string, any> = {};
  if (is_pinned !== undefined) payload.is_pinned = is_pinned;
  if (is_hidden !== undefined) payload.is_hidden = is_hidden;
  const admin = createAdminClient();
  const { data, error } = await (admin.from("community_posts") as any).update(payload).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await (admin.from("community_posts") as any).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
