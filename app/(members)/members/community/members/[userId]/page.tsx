import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import MemberProfile from "@/components/community/MemberProfile";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { userId: string } }): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data: profileRaw } = await (((supabase.from("profiles") as any) as any) as any).select("display_name").eq("id", params.userId).single();
  const profile = profileRaw as any;
  return { title: profile?.display_name ?? "Member Profile" };
}

export default async function MemberProfilePage({ params }: { params: { userId: string } }) {
  const supabase = createAdminClient();
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
    (((supabase.from("profiles") as any) as any) as any).select("*").eq("id", params.userId).single(),
    // Their own posts
    (((supabase.from("community_posts") as any) as any) as any)
      .select("*, profiles:user_id(id,display_name,avatar_url), community_reactions(id,user_id,reaction_type), community_comments(id), community_reposts(id,user_id)")
      .eq("user_id", params.userId).eq("is_hidden", false)
      .order("created_at", { ascending: false }).limit(20),
    // Their reposts
    (((supabase.from("community_reposts") as any) as any) as any)
      .select("*, community_posts(*, profiles:user_id(id,display_name,avatar_url), community_reactions(id,user_id,reaction_type), community_comments(id), community_reposts(id,user_id))")
      .eq("user_id", params.userId)
      .order("created_at", { ascending: false }).limit(20),
    // Am I following them?
    (((supabase.from("community_follows") as any) as any) as any).select("follower_id").eq("follower_id", userId).eq("following_id", params.userId).maybeSingle(),
    // Their followers count
    (((supabase.from("community_follows") as any) as any) as any).select("*", { count: "exact", head: true }).eq("following_id", params.userId),
    // Their following count
    (((supabase.from("community_follows") as any) as any) as any).select("*", { count: "exact", head: true }).eq("follower_id", params.userId),
    // Their badges
    (((supabase.from("user_badges") as any) as any) as any).select("*, badges(name, icon_url, description)").eq("user_id", params.userId),
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
