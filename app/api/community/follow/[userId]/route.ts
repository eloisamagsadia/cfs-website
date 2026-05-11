import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const supabase = createAdminClient();
  const admin = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (userId === params.userId)
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  await (((supabase.from("community_follows") as any) as any) as any).insert({
    follower_id: userId, following_id: params.userId,
  });

  // Notify using admin client (bypasses RLS)
  const { data: followerRaw } = await (supabase
    .from("profiles") as any).select("display_name").eq("id", userId).single();
  const follower = followerRaw as any;
  await (admin.from("notifications") as any).insert({
    user_id: params.userId,
    type: "new_follower",
    title: "New follower!",
    message: `${follower?.display_name ?? "A member"} started following you.`,
    link: `/members/community/members`,
  });

  return NextResponse.json({ following: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await (((supabase.from("community_follows") as any) as any) as any).delete()
    .eq("follower_id", userId).eq("following_id", params.userId);

  return NextResponse.json({ following: false });
}
