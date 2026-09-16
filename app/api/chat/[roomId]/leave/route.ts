import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient();

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await (db() as any)
    .from("chat_members")
    .delete()
    .eq("room_id", params.roomId)
    .eq("user_id", userId);

  return NextResponse.json({ ok: true });
}
