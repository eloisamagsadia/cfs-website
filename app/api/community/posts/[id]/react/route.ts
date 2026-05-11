import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_REACTIONS = ["like", "heart", "support", "fire", "star", "sad"];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const admin = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reaction_type } = await req.json();
  if (!VALID_REACTIONS.includes(reaction_type))
    return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });

  // Toggle reaction
  const { data: existingRaw } = await (supabase.from("community_reactions") as any)
    .select("*")
    .eq("post_id", params.id)
    .eq("user_id", userId)
    .single();
  const existing = existingRaw as any;

  if (existing) {
    if (existing.reaction_type === reaction_type) {
      await (((supabase.from("community_reactions") as any) as any) as any).delete().eq("id", existing.id);
      return NextResponse.json({ action: "removed", reaction_type });
    }
    await (((supabase.from("community_reactions") as any) as any) as any).update({ reaction_type }).eq("id", existing.id);
    return NextResponse.json({ action: "changed", reaction_type });
  }

  await (((supabase.from("community_reactions") as any) as any) as any).insert({
    post_id: params.id, user_id: userId, reaction_type,
  });

  // Notify post author
  const { data: post } = await supabase
    .from("community_posts").select("user_id").eq("id", params.id).single();

  if (post && post.user_id !== userId) {
    const { data: reactor } = await supabase
      .from("profiles").select("display_name").eq("id", userId).single();
    const emojiMap: Record<string, string> = {
      like: "👍", heart: "❤️", support: "🙌", fire: "🔥", star: "⭐", sad: "🥺"
    };
    await (admin.from("notifications") as any).insert({
      user_id: post.user_id,
      type: "community_reply",
      title: "Someone reacted to your post!",
      message: `${reactor?.display_name ?? "A member"} reacted ${emojiMap[reaction_type]} to your post.`,
      link: `/members/community/${params.id}`,
    });
  }

  return NextResponse.json({ action: "added", reaction_type });
}
