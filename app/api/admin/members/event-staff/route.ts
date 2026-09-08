import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// Toggles publicMetadata.is_event_staff on a target user. Event-staff
// flag is a per-member badge: normal member account, additionally gets
// access to /admin/check-in (see middleware.ts + check-in API). Only
// admins can grant/revoke.
//
// POST /api/admin/members/event-staff  { targetUserId, enable: boolean }
export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const callerRole = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(callerRole ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { targetUserId, enable } = await req.json();
  if (!targetUserId || typeof enable !== "boolean") {
    return NextResponse.json({ error: "targetUserId and enable required" }, { status: 400 });
  }

  // Merge the flag into existing publicMetadata so we don't clobber
  // role or anything else Clerk holds there.
  try {
    const clerkUser = await clerkClient.users.getUser(targetUserId);
    const existingMeta = (clerkUser.publicMetadata ?? {}) as Record<string, unknown>;
    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: { ...existingMeta, is_event_staff: enable },
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Clerk update failed: ${e?.message ?? "unknown"}` }, { status: 500 });
  }

  // Mirror into profiles.is_event_staff so admin lists can filter/badge
  // without hitting Clerk. Column added by migration below.
  const admin = createAdminClient();
  await (admin.from("profiles") as any).update({ is_event_staff: enable }).eq("id", targetUserId);

  await logAudit({
    userId,
    action: enable ? "grant_event_staff" : "revoke_event_staff",
    target_type: "profile",
    target_id: targetUserId,
    details: { enable },
    req,
  });

  return NextResponse.json({ ok: true });
}
