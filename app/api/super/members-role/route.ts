import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { logAudit } from "@/lib/audit";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_ROLES = ["super_admin", "admin", "moderator", "sponsor", "member"];

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerRole = (sessionClaims?.metadata as { role?: string })?.role;
  // Any role change is a permission-escalation-adjacent operation, so we
  // require super_admin across the board (previously any admin could
  // promote/demote to moderator/sponsor/member, which was inconsistent).
  if (callerRole !== "super_admin") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  const body = await req.json();
  const { targetUserId, role: newRole } = body;

  if (!targetUserId || !newRole) {
    return NextResponse.json({ error: "Missing targetUserId or role" }, { status: 400 });
  }
  if (!VALID_ROLES.includes(newRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
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
