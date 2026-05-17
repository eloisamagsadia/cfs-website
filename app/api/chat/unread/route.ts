import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ count: 0 });

  const { data: memberOf } = await (db() as any)
    .from("chat_members")
    .select("room_id, last_read_at")
    .eq("user_id", userId);

  if (!memberOf?.length) return NextResponse.json({ count: 0 });

  let unreadRooms = 0;
  await Promise.all(memberOf.map(async (m: any) => {
    const { count } = await (db() as any)
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("room_id", m.room_id)
      .gt("created_at", m.last_read_at ?? "1970-01-01")
      .neq("sender_id", userId);
    if ((count ?? 0) > 0) unreadRooms++;
  }));

  return NextResponse.json({ count: unreadRooms });
}
