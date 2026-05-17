import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — list all rooms for current user
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: memberOf } = await (db() as any)
    .from("chat_members")
    .select("room_id, last_read_at")
    .eq("user_id", userId);

  const roomIds = (memberOf ?? []).map((m: any) => m.room_id);
  if (!roomIds.length) return NextResponse.json({ rooms: [] });

  const { data: rooms } = await (db() as any)
    .from("chat_rooms")
    .select("*, chat_members(user_id)")
    .in("id", roomIds)
    .order("created_at", { ascending: false });

  // Collect all member user_ids and fetch profiles
  const allUserIds = [...new Set((rooms ?? []).flatMap((r: any) => (r.chat_members ?? []).map((m: any) => m.user_id)))];
  let profileMap: Record<string, any> = {};
  if (allUserIds.length) {
    const { data: profiles } = await (db() as any).from("profiles").select("id, display_name, avatar_url").in("id", allUserIds);
    (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });
  }

  // Get last message for each room
  const roomsWithLastMsg = await Promise.all((rooms ?? []).map(async (room: any) => {
    room.chat_members = (room.chat_members ?? []).map((m: any) => ({ ...m, profiles: profileMap[m.user_id] ?? null }));
    const { data: lastMsg } = await (db() as any)
      .from("chat_messages")
      .select("content, created_at, sender_id")
      .eq("room_id", room.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const myMembership = (memberOf ?? []).find((m: any) => m.room_id === room.id);
    const { count: unread } = await (db() as any)
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id)
      .gt("created_at", myMembership?.last_read_at ?? "1970-01-01")
      .neq("sender_id", userId);

    return { ...room, last_message: lastMsg, unread_count: unread ?? 0 };
  }));

  return NextResponse.json({ rooms: roomsWithLastMsg });
}

// POST — create a new room
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, is_group, member_ids } = await req.json();

  // For DMs, check if room already exists
  if (!is_group && member_ids?.length === 1) {
    const otherId = member_ids[0];
    const { data: existing } = await (db() as any)
      .from("chat_members")
      .select("room_id")
      .eq("user_id", userId);
    const myRoomIds = (existing ?? []).map((m: any) => m.room_id);
    if (myRoomIds.length) {
      const { data: otherRooms } = await (db() as any)
        .from("chat_members")
        .select("room_id, chat_rooms(is_group)")
        .eq("user_id", otherId)
        .in("room_id", myRoomIds);
      const dmRoom = (otherRooms ?? []).find((r: any) => !r.chat_rooms?.is_group);
      if (dmRoom) return NextResponse.json({ room: { id: dmRoom.room_id } });
    }
  }

  const { data: room } = await (db() as any)
    .from("chat_rooms")
    .insert({ name: name ?? null, is_group: is_group ?? false, created_by: userId })
    .select()
    .single();

  const allMembers = [...new Set([userId, ...(member_ids ?? [])])];
  await (db() as any)
    .from("chat_members")
    .insert(allMembers.map((uid: string) => ({ room_id: room.id, user_id: uid })));

  return NextResponse.json({ room }, { status: 201 });
}
