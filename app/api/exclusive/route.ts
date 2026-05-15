import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SPONSOR_ROLES = ["sponsor", "admin", "super_admin"];

export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const isAdmin = ["admin", "super_admin"].includes(role ?? "");
  const isSponsor = SPONSOR_ROLES.includes(role ?? "");

  if (!isSponsor) return NextResponse.json({ content: [], error: "Sponsors only" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let query = (db() as any)
    .from("exclusive_content")
    .select("*")
    .order("created_at", { ascending: false });

  if (!isAdmin) query = query.eq("is_published", true);
  if (category) query = query.eq("category", category);

  const { data: content, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: content ?? [] });
}

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, type, category, media_url, thumbnail_url, is_published } = body;

  if (!title || !media_url) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const { data: content, error } = await (db() as any)
    .from("exclusive_content")
    .insert({ title, description, type, category, media_url, thumbnail_url, is_published, uploaded_by: userId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content });
}

export async function PATCH(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: content, error } = await (db() as any)
    .from("exclusive_content")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content });
}

export async function DELETE(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await (db() as any).from("exclusive_content").delete().eq("id", id);
  return NextResponse.json({ success: true });
}
