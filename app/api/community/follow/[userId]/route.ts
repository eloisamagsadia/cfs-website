import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const admin = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (userId === params.userId)
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  await supabase.from("community_follows").insert({
    follower_id: userId, following_id: params.userId,
  });

  // Notify using admin client (bypasses RLS)
  const { data: follower } = await supabase
    .from("profiles").select("display_name").eq("id", userId).single();
  await admin.from("notifications").insert({
    user_id: params.userId,
    type: "new_follower",
    title: "New follower!",
    message: `${follower?.display_name ?? "A member"} started following you.`,
    link: `/members/community/members`,
  });

  return NextResponse.json({ following: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("community_follows").delete()
    .eq("follower_id", userId).eq("following_id", params.userId);

  return NextResponse.json({ following: false });
}
