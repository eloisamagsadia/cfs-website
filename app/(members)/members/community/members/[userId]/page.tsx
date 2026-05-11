import { auth } from "@clerk/nextjs/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect, notFound } from "next/navigation";
import MemberProfile from "@/components/community/MemberProfile";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { userId: string } }): Promise<Metadata> {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", params.userId).single();
  return { title: profile?.display_name ?? "Member Profile" };
}

export default async function MemberProfilePage({ params }: { params: { userId: string } }) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const [
    { data: profile },
    { data: posts },
    { data: reposts },
    { data: isFollowing },
    { count: followersCount },
    { count: followingCount },
    { data: badges },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", params.userId).single(),
    // Their own posts
    supabase.from("community_posts")
      .select("*, profiles:user_id(id,display_name,avatar_url), community_reactions(id,user_id,reaction_type), community_comments(id), community_reposts(id,user_id)")
      .eq("user_id", params.userId).eq("is_hidden", false)
      .order("created_at", { ascending: false }).limit(20),
    // Their reposts
    supabase.from("community_reposts")
      .select("*, community_posts(*, profiles:user_id(id,display_name,avatar_url), community_reactions(id,user_id,reaction_type), community_comments(id), community_reposts(id,user_id))")
      .eq("user_id", params.userId)
      .order("created_at", { ascending: false }).limit(20),
    // Am I following them?
    supabase.from("community_follows").select("follower_id").eq("follower_id", userId).eq("following_id", params.userId).maybeSingle(),
    // Their followers count
    supabase.from("community_follows").select("*", { count: "exact", head: true }).eq("following_id", params.userId),
    // Their following count
    supabase.from("community_follows").select("*", { count: "exact", head: true }).eq("follower_id", params.userId),
    // Their badges
    supabase.from("user_badges").select("*, badges(name, icon_url, description)").eq("user_id", params.userId),
  ]);

  if (!profile) notFound();

  // Merge posts + reposts into a single timeline sorted by date
  const repostItems = (reposts ?? [])
    .filter((r: any) => r.community_posts)
    .map((r: any) => ({ ...r.community_posts, repost_of: r.id, reposted_at: r.created_at, reposted_by: profile }));

  const timeline = [...(posts ?? []), ...repostItems]
    .sort((a: any, b: any) => new Date(b.reposted_at ?? b.created_at).getTime() - new Date(a.reposted_at ?? a.created_at).getTime());

  return (
    <MemberProfile
      profile={profile}
      timeline={timeline}
      currentUserId={userId}
      isFollowing={!!isFollowing}
      followersCount={followersCount ?? 0}
      followingCount={followingCount ?? 0}
      badges={badges ?? []}
      isOwnProfile={userId === params.userId}
    />
  );
}
