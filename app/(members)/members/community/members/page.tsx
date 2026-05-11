import { auth } from "@clerk/nextjs/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import MemberDirectory from "@/components/community/MemberDirectory";
import type { Metadata } from "next";
export const metadata: Metadata = { title:"Member Directory" };

export default async function MembersDirectoryPage() {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const [{ data: members }, { data: myFollowing }, { data: myBadges }] = await Promise.all([
    supabase.from("profiles").select("*").eq("is_public", true).order("created_at", { ascending: false }).limit(50),
    supabase.from("community_follows").select("following_id").eq("follower_id", userId),
    supabase.from("user_badges").select("user_id, badge_id").in("user_id", []),
  ]);

  const followingIds = (myFollowing ?? []).map((f: any) => f.following_id);

  return <MemberDirectory members={members ?? []} currentUserId={userId} followingIds={followingIds}/>;
}
