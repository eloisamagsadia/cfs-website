import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/chat/rooms?type=all|group|dm
export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const type  = new URL(req.url).searchParams.get("type") ?? "all";
  const admin = createAdminClient();

  let q = (admin as any).from("chat_rooms").select("*").order("created_at", { ascending: false }).limit(500);
  if (type === "group") q = q.eq("is_group", true);
  else if (type === "dm") q = q.eq("is_group", false);

  const { data: rooms, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!rooms || rooms.length === 0) return NextResponse.json({ rooms: [] });

  const roomIds = rooms.map((r: any) => r.id);

  // Members with profile names
  const { data: members } = await (admin as any)
    .from("chat_members")
    .select("room_id, user_id, profiles:user_id(display_name, avatar_url)")
    .in("room_id", roomIds);

  // Message count + last message per room
  const { data: msgs } = await (admin as any)
    .from("chat_messages")
    .select("id, room_id, content, sender_id, created_at, image_url")
    .in("room_id", roomIds)
    .order("created_at", { ascending: false });

  const byRoom: Record<string, { count: number; last: any | null; participants: any[] }> = {};
  for (const r of rooms) byRoom[r.id] = { count: 0, last: null, participants: [] };
  for (const m of members ?? []) byRoom[m.room_id]?.participants.push(m);
  for (const msg of msgs ?? []) {
    const bucket = byRoom[msg.room_id];
    if (!bucket) continue;
    bucket.count++;
    if (!bucket.last) bucket.last = msg;
  }

  const enriched = rooms.map((r: any) => ({
    ...r,
    message_count: byRoom[r.id]?.count ?? 0,
    last_message:  byRoom[r.id]?.last ?? null,
    participants:  byRoom[r.id]?.participants ?? [],
  }));

  return NextResponse.json({ rooms: enriched });
}
