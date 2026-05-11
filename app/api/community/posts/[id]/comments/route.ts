import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: comments } = await supabase
    .from("community_comments")
    .select("*, profiles:user_id(id,display_name,avatar_url)")
    .eq("post_id", params.id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });
  return NextResponse.json({ comments: comments ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const admin = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  // Strip any HTML tags before saving
  const raw = body.content ?? "";
  const content = raw.replace(/<\/?[^>]+(>|$)/g, "").replace(/style="[^"]*"/g, "").trim();
  const parent_comment_id = body.parent_comment_id ?? null;

  console.log('API SAVING:', content);
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const { data: comment, error } = await supabase
    .from("community_comments")
    .insert({ post_id: params.id, user_id: userId, content, parent_comment_id, is_hidden: false })
    .select("*, profiles:user_id(id,display_name,avatar_url)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify post author
  const { data: postRaw } = await (((supabase.from("community_posts") as any) as any) as any).select("user_id").eq("id", params.id).single();
  const post = postRaw as any;
  if (post && post.user_id !== userId) {
    const { data: commenterRaw } = await (((supabase.from("profiles") as any) as any) as any).select("display_name").eq("id", userId).single();
  const commenter = commenterRaw as any;
    await (admin.from("notifications") as any).insert({
      user_id: post.user_id, type: "community_reply",
      title: "New comment on your post!",
      message: `${commenter?.display_name ?? "A member"} commented on your post.`,
      link: `/members/community/${params.id}`,
    });
  }

  console.log('API RETURNING:', JSON.stringify(comment));
  return NextResponse.json({ comment });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
  await (((supabase.from("community_comments") as any) as any) as any).delete().eq("id", commentId).eq("user_id", userId);
  return NextResponse.json({ success: true });
}
