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

  const ids = new URL(req.url).searchParams.get("ids")?.split(",") ?? [];
  if (!ids.length) return NextResponse.json({ reactions: {} });

  const { data } = await (db() as any)
    .from("chat_reactions")
    .select("*")
    .in("message_id", ids);

  const grouped: Record<string, any[]> = {};
  (data ?? []).forEach((r: any) => {
    if (!grouped[r.message_id]) grouped[r.message_id] = [];
    grouped[r.message_id].push(r);
  });

  return NextResponse.json({ reactions: grouped });
}

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message_id, emoji } = await req.json();

  // Toggle reaction
  const { data: existing } = await (db() as any)
    .from("chat_reactions")
    .select("id")
    .eq("message_id", message_id)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .single();

  if (existing) {
    await (db() as any).from("chat_reactions").delete().eq("id", existing.id);
  } else {
    await (db() as any).from("chat_reactions").insert({ message_id, user_id: userId, emoji });
  }

  const { data: reactions } = await (db() as any)
    .from("chat_reactions")
    .select("*")
    .eq("message_id", message_id);

  return NextResponse.json({ reactions: reactions ?? [] });
}
