import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import PostDetail from "@/components/community/PostDetail";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Post" };

export default async function PostDetailPage({ params }: { params: { postId: string } }) {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const [{ data: post }, { data: comments }, { data: profile }] = await Promise.all([
    (((supabase.from("community_posts") as any) as any) as any)
      .select("*, profiles:user_id(id,display_name,avatar_url), community_reactions(id,user_id,reaction_type), community_comments(id), view_count")
      .eq("id", params.postId).single(),
    (((supabase.from("community_comments") as any) as any) as any)
      .select("*, profiles:user_id(id,display_name,avatar_url)")
      .eq("post_id", params.postId).eq("is_hidden", false)
      .order("created_at", { ascending: true }),
    (((supabase.from("profiles") as any) as any) as any).select("*").eq("id", userId).single(),
  ]);

  if (!post) notFound();

  return <PostDetail post={post} initialComments={comments ?? []} currentUser={{ id: userId, ...(profile as any) }} />;
}
