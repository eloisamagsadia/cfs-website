import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import AdminMembersClient from "./AdminMembersClient";
export const dynamic = "force-dynamic";
export const revalidate = 0;


export const metadata: Metadata = { title: "Manage Members" };

export default async function AdminMembersPage() {
  const { sessionClaims } = auth();
  const callerRole = (sessionClaims?.metadata as any)?.role ?? "member";
  const admin = createAdminClient();

  const { data: members } = await admin
    .from("profiles")
    .select("*, user_badges(id)")
    .order("created_at", { ascending: false });

  // Get post counts per user
  const { data: postCounts } = await admin
    .from("community_posts")
    .select("user_id")
    .eq("is_hidden", false);

  const countMap: Record<string, number> = {};
  (postCounts ?? []).forEach((p: any) => {
    countMap[p.user_id] = (countMap[p.user_id] ?? 0) + 1;
  });

  const enriched = (members ?? []).map((m: any) => ({
    ...m,
    post_count: countMap[m.id] ?? 0,
  }));

  return <AdminMembersClient members={enriched} callerRole={callerRole} />;
}
