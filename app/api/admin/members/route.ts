import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filterHiddenFromList, isOwner } from "@/lib/hidden-admins";

const RANK: Record<string, number> = { member: 1, sponsor: 2, moderator: 3, admin: 4, super_admin: 5 };

export async function GET() {
  const { userId, sessionClaims } = auth();
  const callerRole = (sessionClaims?.metadata as any)?.role ?? "";
  if (!userId || !["admin", "super_admin"].includes(callerRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: members } = await db
    .from("profiles")
    .select("id, display_name, avatar_url, role, created_at, is_banned, image_post_count, email")
    .order("created_at", { ascending: false });

  // Layer 1 — hide the owner "System" from every non-owner viewer.
  const afterHidden = filterHiddenFromList((members ?? []) as any[], userId);
  // Layer 2 — rank hierarchy. Viewers see peers + everyone below their
  // tier, never above. Owner override always sees everyone.
  const callerRank = RANK[callerRole] ?? 0;
  const filtered = isOwner(userId)
    ? afterHidden
    : afterHidden.filter((m: any) => (RANK[m.role ?? "member"] ?? 1) <= callerRank);
  return NextResponse.json({ members: filtered });
}
