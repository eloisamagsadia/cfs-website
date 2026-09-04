import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { logAudit } from "@/lib/audit";
import { isOwner } from "@/lib/hidden-admins";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_ROLES = ["super_admin", "admin", "moderator", "sponsor", "member"] as const;

// Role hierarchy. Higher number = more privileged. Callers can only
// grant / modify roles STRICTLY below their own tier, with two extra rules:
//   - super_admin is grantable only by the owner (hidden super)
//   - hidden admins are invisible → also cannot be targeted at all
const RANK: Record<string, number> = {
  member: 1, sponsor: 2, moderator: 3, admin: 4, super_admin: 5,
};

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerRole = (sessionClaims?.metadata as { role?: string })?.role ?? "member";
  const callerRank = RANK[callerRole] ?? 0;
  const owner = isOwner(userId);

  // Only admin/super_admin/owner can change roles at all.
  if (!owner && callerRole !== "admin" && callerRole !== "super_admin") {
    return NextResponse.json({ error: "Not allowed to change roles" }, { status: 403 });
  }

  const body = await req.json();
  const { targetUserId, role: newRole } = body;

  if (!targetUserId || !newRole) {
    return NextResponse.json({ error: "Missing targetUserId or role" }, { status: 400 });
  }
  if (!(VALID_ROLES as readonly string[]).includes(newRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Grant restrictions — everyone strictly below owner has a ceiling.
  //   admin       → can grant moderator / sponsor / member
  //   super_admin → can grant admin / moderator / sponsor / member (NOT super_admin)
  //   owner       → can grant anything
  const newRoleRank = RANK[newRole] ?? 0;
  if (!owner) {
    if (newRole === "super_admin") {
      return NextResponse.json({ error: "Only the site owner can grant super_admin" }, { status: 403 });
    }
    if (callerRole === "admin" && newRoleRank >= RANK.admin) {
      return NextResponse.json({ error: "Admins can only assign moderator, sponsor, or member" }, { status: 403 });
    }
    // Prevent modifying someone at or above your own tier (except owner).
    // Load the target's current role.
    const { data: targetRow } = await db().from("profiles").select("role").eq("id", targetUserId).maybeSingle();
    const targetRole = (targetRow as any)?.role ?? "member";
    const targetRank = RANK[targetRole] ?? 0;
    if (targetRank >= callerRank) {
      return NextResponse.json({ error: "You can't change a member whose role is at or above yours" }, { status: 403 });
    }
  }

  // Update Clerk public metadata
  try {
    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: { role: newRole },
    });
  } catch (e: any) {
    console.error("[role] Clerk update failed:", e?.message ?? e);
    return NextResponse.json({ error: `Clerk update failed: ${e?.message ?? "unknown"}` }, { status: 500 });
  }

  // Update Supabase profiles
  const { error: dbError } = await db().from("profiles").update({ role: newRole }).eq("id", targetUserId);
  if (dbError) {
    console.error("[role] Supabase update failed:", dbError.message);
    return NextResponse.json({ error: `DB update failed: ${dbError.message}` }, { status: 500 });
  }

  // Log mod action
  await db().from("mod_actions").insert({
    mod_id: userId,
    action_type: "change_role",
    target_type: "member",
    target_id: targetUserId,
    notes: `Role changed to ${newRole}`,
  });

  await logAudit({
    userId,
    action: "change_role",
    target_type: "profile",
    target_id: targetUserId,
    details: { new_role: newRole, caller_role: callerRole },
    req,
  });

  if (newRole === "sponsor") {
    await db().from("notifications").insert({
      user_id: targetUserId,
      type: "system",
      title: "Welcome to CFS Sponsors! ✦",
      message: "You now have access to exclusive behind-the-scenes content. Thank you for your support! 💚",
      link: "/members/exclusive",
    });
  }

  return NextResponse.json({ ok: true });
}
