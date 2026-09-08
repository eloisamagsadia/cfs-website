import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logAudit } from "@/lib/audit";
import { syncEventStaffFlag } from "@/lib/event-staff";

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

  const result = await syncEventStaffFlag(targetUserId, enable);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

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
