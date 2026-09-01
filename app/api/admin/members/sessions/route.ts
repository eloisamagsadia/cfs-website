import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return { userId: null, role: null };
  const role = (sessionClaims?.metadata as { role?: string })?.role ?? null;
  return { userId, role };
}

// GET /api/admin/members/sessions?user_id=...  → list active sessions
export async function GET(req: NextRequest) {
  const { userId, role } = await requireAdmin();
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const target = new URL(req.url).searchParams.get("user_id");
  if (!target) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  try {
    const sessions = await clerkClient.sessions.getSessionList({ userId: target });
    // Some SDK versions return a wrapper { data, totalCount }
    const list = Array.isArray(sessions) ? sessions : (sessions as any)?.data ?? [];

    const shaped = list.map((s: any) => ({
      id:              s.id,
      status:          s.status,
      last_active_at:  s.lastActiveAt ?? null,
      expire_at:       s.expireAt ?? null,
      abandon_at:      s.abandonAt ?? null,
      created_at:      s.createdAt ?? null,
      client_id:       s.clientId ?? null,
      // latest_activity is only exposed by newer Clerk SDKs; be defensive
      last_active_ip:  s.latestActivity?.ipAddress ?? null,
      last_active_ua:  s.latestActivity?.browserName ?? null,
      last_active_os:  s.latestActivity?.deviceType ?? null,
    }));
    return NextResponse.json({ sessions: shaped });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to load sessions" }, { status: 500 });
  }
}

// DELETE /api/admin/members/sessions?session_id=...          → revoke one
// DELETE /api/admin/members/sessions?user_id=...&all=1       → revoke all
export async function DELETE(req: NextRequest) {
  const { userId, role } = await requireAdmin();
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url       = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const target    = url.searchParams.get("user_id");
  const all       = url.searchParams.get("all") === "1";

  try {
    if (all && target) {
      const list = await clerkClient.sessions.getSessionList({ userId: target });
      const arr  = Array.isArray(list) ? list : (list as any)?.data ?? [];
      let revoked = 0;
      for (const s of arr) {
        if (s.status !== "active") continue;
        try { await clerkClient.sessions.revokeSession(s.id); revoked++; } catch {}
      }
      await logAudit({ userId, action: "revoke_all_sessions", target_type: "profile", target_id: target, details: { revoked }, req });
      return NextResponse.json({ ok: true, revoked });
    }

    if (!sessionId) return NextResponse.json({ error: "session_id or user_id+all=1 required" }, { status: 400 });
    await clerkClient.sessions.revokeSession(sessionId);
    await logAudit({ userId, action: "revoke_session", target_type: "session", target_id: sessionId, req });
    return NextResponse.json({ ok: true, revoked: 1 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to revoke" }, { status: 500 });
  }
}
