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
  const { data, error } = await admin
    .from("transparency_reports").select("*")
    .order("year", { ascending: false }).order("quarter", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data ?? [] });
}

export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, year, quarter, content, pdf_url, summary, is_published } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!year || !quarter) return NextResponse.json({ error: "Year and quarter are required" }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await (admin.from("transparency_reports") as any).insert({
    title: title.trim(), year: Number(year), quarter: Number(quarter),
    content: content?.trim() || null, pdf_url: pdf_url?.trim() || null,
    summary: summary?.trim() || null, is_published: !!is_published,
    published_at: is_published ? new Date().toISOString() : null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ report: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Report ID required" }, { status: 400 });
  const payload: Record<string, any> = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.year !== undefined) payload.year = Number(updates.year);
  if (updates.quarter !== undefined) payload.quarter = Number(updates.quarter);
  if (updates.content !== undefined) payload.content = updates.content?.trim() || null;
  if (updates.pdf_url !== undefined) payload.pdf_url = updates.pdf_url?.trim() || null;
  if (updates.summary !== undefined) payload.summary = updates.summary?.trim() || null;
  if (updates.is_published !== undefined) {
    payload.is_published = updates.is_published;
    if (updates.is_published) payload.published_at = new Date().toISOString();
  }
  const admin = createAdminClient();
  const { data, error } = await (admin.from("transparency_reports") as any).update(payload).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ report: data });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Report ID required" }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await (admin.from("transparency_reports") as any).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
