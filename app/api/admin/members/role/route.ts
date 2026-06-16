import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_ROLES = ["super_admin", "admin", "moderator", "sponsor", "member"];

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerRole = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(callerRole ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { targetUserId, role: newRole } = body;

  if (!targetUserId || !newRole) {
    return NextResponse.json({ error: "Missing targetUserId or role" }, { status: 400 });
  }
  if (!VALID_ROLES.includes(newRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Only super_admin can assign admin or super_admin roles
  if (["super_admin", "admin"].includes(newRole) && callerRole !== "super_admin") {
    return NextResponse.json({ error: "Only super admin can assign admin roles" }, { status: 403 });
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
