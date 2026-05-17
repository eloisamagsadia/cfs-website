import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createAdminClient();
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";
  let query = (db.from("notifications") as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (unreadOnly) query = query.eq("is_read", false);
  const { data } = await query;
  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, all } = await req.json();
  const db = createAdminClient();
  if (all) {
    await (db.from("notifications") as any).update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  } else if (id) {
    await (db.from("notifications") as any).update({ is_read: true }).eq("id", id);
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, clearRead } = await req.json();
  const db = createAdminClient();
  if (clearRead) {
    await (db.from("notifications") as any).delete().eq("user_id", userId).eq("is_read", true);
  } else if (id) {
    await (db.from("notifications") as any).delete().eq("id", id);
  }
  return NextResponse.json({ ok: true });
}
