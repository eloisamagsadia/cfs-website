import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const admin = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if already reposted
  const { data: existing } = await supabase
    .from("community_reposts")
    .select("id")
    .eq("post_id", params.id)
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Undo repost
    await supabase.from("community_reposts").delete()
      .eq("post_id", params.id).eq("user_id", userId);
    return NextResponse.json({ reposted: false });
  }

  // Create repost
  await supabase.from("community_reposts").insert({
    post_id: params.id, user_id: userId,
  });

  // Notify post author
  const { data: post } = await supabase
    .from("community_posts").select("user_id").eq("id", params.id).single();
  if (post && post.user_id !== userId) {
    const { data: reposter } = await supabase
      .from("profiles").select("display_name").eq("id", userId).single();
    await admin.from("notifications").insert({
      user_id: post.user_id,
      type: "community_reply",
      title: "Someone reposted your post!",
      message: `${reposter?.display_name ?? "A member"} reposted your post.`,
      link: `/members/community/${params.id}`,
    });
  }

  return NextResponse.json({ reposted: true });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count } = await supabase
    .from("community_reposts")
    .select("*", { count: "exact", head: true })
    .eq("post_id", params.id);

  const { data: myRepost } = await supabase
    .from("community_reposts")
    .select("id")
    .eq("post_id", params.id)
    .eq("user_id", userId)
    .single();

  return NextResponse.json({ count: count ?? 0, reposted: !!myRepost });
}
