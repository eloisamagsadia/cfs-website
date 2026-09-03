import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message_id } = await req.json();

  const { data: member } = await (db() as any)
    .from("chat_members")
    .select("*")
    .eq("room_id", params.roomId)
    .eq("user_id", userId)
    .single();
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Look up message scoped to this room — prevents pinning a message from
  // another room by ID. .maybeSingle() so a stale/missing id doesn't crash.
  const { data: msg } = await (db() as any)
    .from("chat_messages")
    .select("is_pinned")
    .eq("id", message_id)
    .eq("room_id", params.roomId)
    .maybeSingle();
  if (!msg) return NextResponse.json({ error: "Message not found in this room" }, { status: 404 });

  const newPinned = !msg.is_pinned;

  const upMsg = await (db() as any).from("chat_messages").update({ is_pinned: newPinned }).eq("id", message_id).eq("room_id", params.roomId);
  if (upMsg.error) return NextResponse.json({ error: upMsg.error.message }, { status: 500 });

  const upRoom = await (db() as any).from("chat_rooms").update({ pinned_message_id: newPinned ? message_id : null }).eq("id", params.roomId);
  if (upRoom.error) return NextResponse.json({ error: upRoom.error.message }, { status: 500 });

  return NextResponse.json({ pinned: newPinned });
}
