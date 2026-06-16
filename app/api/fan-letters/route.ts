import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const db = createAdminClient();
  const { data, error } = await (db as any)
    .from("fan_letters")
    .select("id, user_id, title, content, created_at, profiles:user_id(display_name, avatar_url)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ letters: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, content } = await req.json();
  if (!title?.trim() || !content?.trim())
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  if (title.length > 120)
    return NextResponse.json({ error: "Title too long (max 120 chars)" }, { status: 400 });
  if (content.length < 10 || content.length > 2000)
    return NextResponse.json({ error: "Content must be 10–2000 characters" }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await (db as any)
    .from("fan_letters")
    .insert({ user_id: userId, title: title.trim(), content: content.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ letter: data });
}

export async function DELETE(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const db = createAdminClient();
  const { error } = await (db as any)
    .from("fan_letters")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
