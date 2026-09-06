import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { logAudit } from "@/lib/audit";
import { isOwner, isHiddenAdmin } from "@/lib/hidden-admins";

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Role hierarchy mirrors /api/super/members-role. Higher number =
// more privileged. A ban is only allowed against a target whose role
// is STRICTLY below the caller's role. Hidden admins (owner tier)
// are untouchable by anyone but the owner.
const RANK: Record<string, number> = {
  member: 1, sponsor: 2, moderator: 3, admin: 4, super_admin: 5,
};

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const callerRole = (sessionClaims?.metadata as { role?: string })?.role ?? "member";
  if (!["admin", "super_admin"].includes(callerRole)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const callerRank  = RANK[callerRole] ?? 0;
  const callerOwner = isOwner(userId);

  const { targetUserId, banned } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });

  // Nobody bans themselves.
  if (targetUserId === userId) {
    return NextResponse.json({ error: "You can't ban yourself." }, { status: 400 });
  }

  // Hidden admins (owner) are targetable only by the owner themselves.
  if (isHiddenAdmin(targetUserId) && !callerOwner) {
    return NextResponse.json({ error: "Target not found." }, { status: 404 });
  }

  // Enforce rank hierarchy — non-owners can only ban strictly below.
  if (!callerOwner) {
    const { data: targetRow } = await admin().from("profiles").select("role").eq("id", targetUserId).maybeSingle();
    const targetRole = (targetRow as any)?.role ?? "member";
    const targetRank = RANK[targetRole] ?? 0;
    if (targetRank >= callerRank) {
      return NextResponse.json({
        error: `You can't ${banned ? "ban" : "unban"} a ${targetRole.replace("_", " ")} — target role must be lower than yours.`,
      }, { status: 403 });
    }
  }

  await admin().from("profiles").update({ is_banned: banned }).eq("id", targetUserId);

  await logAudit({
    userId,
    action: banned ? "ban_member" : "unban_member",
    target_type: "profile",
    target_id: targetUserId,
    req,
  });

  return NextResponse.json({ ok: true });
}
