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
  const { data, error } = await (admin.from("projects") as any).select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, description, status, progress_percent, category } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await (admin.from("projects") as any).insert({
    title: title.trim(), description: description?.trim() || null,
    status: status || "ongoing", progress_percent: Number(progress_percent ?? 0),
    category: category?.trim() || null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Project ID required" }, { status: 400 });
  const payload: Record<string, any> = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.progress_percent !== undefined) payload.progress_percent = Number(updates.progress_percent);
  if (updates.category !== undefined) payload.category = updates.category?.trim() || null;
  const admin = createAdminClient();
  const { data, error } = await (admin.from("projects") as any).update(payload).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Project ID required" }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await (admin.from("projects") as any).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
