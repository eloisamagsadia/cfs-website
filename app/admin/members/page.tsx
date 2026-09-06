import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import { isOwner, filterHiddenFromList } from "@/lib/hidden-admins";
import type { Metadata } from "next";
import AdminMembersClient from "./AdminMembersClient";
export const revalidate = 30;



export const metadata: Metadata = { title: "Manage Members" };

export default async function AdminMembersPage() {
  const { userId, sessionClaims } = auth();
  const callerRole = (sessionClaims?.metadata as any)?.role ?? "member";
  const callerIsOwner = isOwner(userId);
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

  // Two-layer visibility:
  //   1. Hidden owner (System) → never shown to non-owners
  //   2. Rank hierarchy → viewers only see members at or below their
  //      own tier (so admins don't see super_admins, mods don't see
  //      admins, etc.). Owner override always sees everyone.
  const RANK: Record<string, number> = { member: 1, sponsor: 2, moderator: 3, admin: 4, super_admin: 5 };
  const callerRank = RANK[callerRole] ?? 0;
  const afterHidden = filterHiddenFromList((members ?? []) as any[], userId);
  const visible     = callerIsOwner
    ? afterHidden
    : afterHidden.filter((m: any) => (RANK[m.role ?? "member"] ?? 1) <= callerRank);
  const enriched = visible.map((m: any) => ({
    ...m,
    post_count: countMap[m.id] ?? 0,
  }));

  return <AdminMembersClient members={enriched} callerRole={callerRole} callerIsOwner={callerIsOwner} />;
}
