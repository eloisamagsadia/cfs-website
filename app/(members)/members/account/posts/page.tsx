import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import MemberProfile from "@/components/community/MemberProfile";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "My Posts" };
export default async function MyPostsPage() {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) redirect("/sign-in");
  const [
    { data: profile },
    { data: posts },
    { data: reposts },
    { count: followersCount },
    { count: followingCount },
  ] = await Promise.all([
    (((supabase.from("profiles") as any) as any) as any).select("*").eq("id", userId).single(),
    (((supabase.from("community_posts") as any) as any) as any)
      .select("*, profiles:user_id(id,display_name,avatar_url), community_reactions(id,user_id,reaction_type), community_comments(id), community_reposts(id,user_id)")
      .eq("user_id", userId).eq("is_hidden", false)
      .order("created_at", { ascending: false }).limit(50),
    (((supabase.from("community_reposts") as any) as any) as any)
      .select("*, community_posts(*, profiles:user_id(id,display_name,avatar_url), community_reactions(id,user_id,reaction_type), community_comments(id), community_reposts(id,user_id))")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(50),
    (((supabase.from("community_follows") as any) as any) as any).select("*", { count: "exact", head: true }).eq("following_id", userId),
    (((supabase.from("community_follows") as any) as any) as any).select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);

  const repostItems = (reposts ?? []).map((r: any) => ({
    ...r.community_posts,
    repost_of: r.id,
    reposted_at: r.created_at,
    reposted_by: profile,
  }));

  const timeline = [...(posts ?? []), ...repostItems]
    .sort((a, b) => new Date(b.reposted_at ?? b.created_at).getTime() - new Date(a.reposted_at ?? a.created_at).getTime());

  return (
    <MemberProfile
      profile={profile}
      timeline={timeline}
      currentUserId={userId}
      isFollowing={false}
      followersCount={followersCount ?? 0}
      followingCount={followingCount ?? 0}
      badges={[]}
      isOwnProfile={true}
    />
  );
}
