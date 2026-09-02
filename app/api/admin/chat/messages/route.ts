import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return userId;
}

// GET /api/admin/chat/messages?room_id=...&reason=<text>  → list w/ sender profiles
// `reason` is required for DM rooms (is_group=false); guests get nothing.
// Each fetch is audit-logged as view_chat_room so members can be shown who
// accessed their DMs if we ever need to demonstrate accountability.
export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url    = new URL(req.url);
  const roomId = url.searchParams.get("room_id");
  const reason = (url.searchParams.get("reason") ?? "").trim().slice(0, 500);
  if (!roomId) return NextResponse.json({ error: "room_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: room } = await (admin as any).from("chat_rooms").select("*").eq("id", roomId).maybeSingle();
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const isDm = !room.is_group;
  if (isDm && !reason) {
    // Return metadata only — client will prompt for a reason before requesting messages.
    return NextResponse.json({
      room,
      messages: [],
      members: [],
      requires_reason: true,
    });
  }

  const [msgs, members] = await Promise.all([
    (admin as any)
      .from("chat_messages")
      .select("id, room_id, sender_id, content, image_url, created_at, edited_at, reply_to_id, is_pinned, profiles:sender_id(display_name, avatar_url)")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(300),
    (admin as any)
      .from("chat_members")
      .select("user_id, joined_at, profiles:user_id(display_name, avatar_url)")
      .eq("room_id", roomId),
  ]);

  await logAudit({
    userId,
    action: "view_chat_room",
    target_type: "chat_room",
    target_id: roomId,
    details: {
      is_group: !!room.is_group,
      participants: (members.data as any[] ?? []).map((m: any) => m.user_id),
      message_count: (msgs.data as any[] ?? []).length,
      reason: reason || null,
    },
    req,
  });

  return NextResponse.json({
    room,
    messages: msgs.data ?? [],
    members: members.data ?? [],
  });
}

// DELETE /api/admin/chat/messages?id=...
export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: msg } = await (admin as any).from("chat_messages").select("room_id, sender_id, content").eq("id", id).maybeSingle();

  const { error } = await (admin as any).from("chat_messages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    userId,
    action: "delete_chat_message",
    target_type: "chat_message",
    target_id: id,
    details: { room_id: msg?.room_id ?? null, sender_id: msg?.sender_id ?? null, preview: (msg?.content ?? "").slice(0, 120) },
    req,
  });
  return NextResponse.json({ ok: true });
}
