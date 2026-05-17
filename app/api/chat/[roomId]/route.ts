import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — get messages for a room
export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = params;

  // Check membership
  const { data: member } = await (db() as any)
    .from("chat_members")
    .select("*")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .single();
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const [{ data: room }, { data: messages }, { data: members }] = await Promise.all([
    (db() as any).from("chat_rooms").select("*").eq("id", roomId).single(),
    (db() as any).from("chat_messages").select("*").eq("room_id", roomId).order("created_at", { ascending: true }).limit(100),
    (db() as any).from("chat_members").select("user_id, nickname").eq("room_id", roomId),
  ]);

  // Attach profiles to members
  const memberIds = (members ?? []).map((m: any) => m.user_id);
  let memberProfiles: Record<string, any> = {};
  if (memberIds.length) {
    const { data: mProfiles } = await (db() as any)
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", memberIds);
    (mProfiles ?? []).forEach((p: any) => { memberProfiles[p.id] = p; });
  }
  const membersWithProfiles = (members ?? []).map((m: any) => ({ ...m, profiles: memberProfiles[m.user_id] ?? null }));

  // Attach profiles to messages
  const senderIds = [...new Set((messages ?? []).map((m: any) => m.sender_id))];
  let profileMap: Record<string, any> = {};
  if (senderIds.length) {
    const { data: profiles } = await (db() as any)
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", senderIds);
    (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });
  }
  const messagesWithProfiles = (messages ?? []).map((m: any) => ({ ...m, profiles: profileMap[m.sender_id] ?? null }));

  // Update last_read_at
  await (db() as any)
    .from("chat_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", userId);

  return NextResponse.json({ room, messages: messagesWithProfiles, members: membersWithProfiles });
}

// POST — send a message
export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId } = params;
  const { content, reply_to_id, image_url } = await req.json();
  if (!content?.trim() && !image_url) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const { data: member } = await (db() as any)
    .from("chat_members")
    .select("*")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .single();
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data: inserted } = await (db() as any)
    .from("chat_messages")
    .insert({ room_id: roomId, sender_id: userId, content: content?.trim() ?? "", reply_to_id: reply_to_id ?? null, image_url: image_url ?? null })
    .select()
    .single();

  const { data: profile } = await (db() as any)
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", userId)
    .single();

  const message = inserted ? { ...inserted, profiles: profile } : null;

  // Notify other members
  try {
    const { data: roomData } = await (db() as any)
      .from("chat_rooms")
      .select("name, is_group")
      .eq("id", roomId)
      .single();
    const { data: otherMembers } = await (db() as any)
      .from("chat_members")
      .select("user_id")
      .eq("room_id", roomId)
      .neq("user_id", userId);
    if (otherMembers?.length) {
      const senderName = profile?.display_name ?? "Someone";
      const roomName = roomData?.is_group ? (roomData?.name ?? "Group Chat") : senderName;
      const preview = image_url && !content?.trim() ? "📷 Photo" : (content?.trim() ?? "").slice(0, 60);
      const notifications = otherMembers.map((m: any) => ({
        user_id: m.user_id,
        type: "new_message",
        title: roomName,
        message: `${roomData?.is_group ? senderName + ": " : ""}${preview}`,
        link: `/members/messages/${roomId}`,
        is_read: false,
        image_url: profile?.avatar_url ?? null,
      }));
      const { error: notifError } = await (db() as any).from("notifications").insert(notifications);
      console.log("notif insert result:", notifError ?? "ok");
    }
  } catch (e) {
    console.error("Failed to send chat notifications:", e);
  }

  return NextResponse.json({ message }, { status: 201 });
}
