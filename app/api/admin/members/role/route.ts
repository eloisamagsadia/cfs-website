import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_ROLES = ["super_admin", "admin", "moderator", "sponsor", "member"];

async function getCallerRole() {
  const { userId, sessionClaims } = auth();
  if (!userId) return { userId: null, role: null };
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  return { userId, role };
}

export async function POST(req: NextRequest) {
  const { userId, role: callerRole } = await getCallerRole();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admin and super_admin can change roles
  if (!["admin", "super_admin"].includes(callerRole ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUserId, role: newRole } = await req.json();
  if (!targetUserId || !newRole) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (!VALID_ROLES.includes(newRole)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  // Get target member's current role
  const { data: target } = await db().from("profiles").select("role").eq("id", targetUserId).single();

  // Only super_admin can assign/remove super_admin or admin roles
  if (["super_admin", "admin"].includes(newRole) && callerRole !== "super_admin") {
    return NextResponse.json({ error: "Only super admin can assign admin roles" }, { status: 403 });
  }

  // Prevent demoting another super_admin unless you are super_admin
  if (target?.role === "super_admin" && callerRole !== "super_admin") {
    return NextResponse.json({ error: "Cannot modify a super admin" }, { status: 403 });
  }

  // Update Clerk metadata
  if (targetUserId.startsWith("user_")) {
    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: { role: newRole },
    });
  }

  // Update Supabase
  await db().from("profiles").update({ role: newRole }).eq("id", targetUserId);

  // Log mod action
  await db().from("mod_actions").insert({
    mod_id: userId,
    action_type: "change_role",
    target_type: "member",
    target_id: targetUserId,
    notes: `Role changed to ${newRole}`,
  });

  // Notify member if upgraded to sponsor
  if (newRole === "sponsor") {
    await (db() as any).from("notifications").insert({
      user_id: targetUserId,
      type: "system",
      title: "Welcome to CFS Sponsors! ✦",
      message: "You now have access to exclusive behind-the-scenes content from events and projects. Thank you for your support! 💚",
      link: "/members/exclusive",
    });
  }

  return NextResponse.json({ ok: true });
}
