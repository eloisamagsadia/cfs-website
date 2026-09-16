import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient();

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await (db() as any)
    .from("chat_members")
    .select("user_id, last_read_at")
    .eq("room_id", params.roomId);

  return NextResponse.json({ members: data ?? [] });
}
