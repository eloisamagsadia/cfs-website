import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await (db() as any)
    .from("chat_nicknames")
    .select("target_user_id, nickname")
    .eq("room_id", params.roomId)
    .eq("set_by", userId);

  return NextResponse.json({ nicknames: data ?? [] });
}

export async function PATCH(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_user_id, nickname } = await req.json();
  if (!target_user_id) return NextResponse.json({ error: "target_user_id required" }, { status: 400 });

  if (!nickname?.trim()) {
    await (db() as any)
      .from("chat_nicknames")
      .delete()
      .eq("room_id", params.roomId)
      .eq("set_by", userId)
      .eq("target_user_id", target_user_id);
  } else {
    await (db() as any)
      .from("chat_nicknames")
      .upsert({
        room_id: params.roomId,
        set_by: userId,
        target_user_id,
        nickname: nickname.trim(),
      }, { onConflict: "room_id,set_by,target_user_id" });
  }

  return NextResponse.json({ ok: true });
}
