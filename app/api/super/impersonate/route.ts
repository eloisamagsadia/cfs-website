import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/hidden-admins";
import {
  IMPERSONATE_COOKIE,
  IMPERSONATE_MAX_AGE,
  signImpersonation,
  verifyImpersonation,
} from "@/lib/impersonation";

// Owner-only: signing in as another user is nuclear enough that we don't want
// shared super_admin accounts doing it without the site owner's involvement.
async function requireOwner() {
  const { userId } = auth();
  if (!userId || !isOwner(userId)) return null;
  return userId;
}

// POST /api/super/impersonate  { target_user_id, reason? }  → start
export async function POST(req: NextRequest) {
  const actorId = await requireOwner();
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_user_id, reason } = await req.json().catch(() => ({}));
  if (!target_user_id) return NextResponse.json({ error: "target_user_id required" }, { status: 400 });
  if (target_user_id === actorId) return NextResponse.json({ error: "You're already yourself" }, { status: 400 });

  // Confirm target exists in profiles (so admin can't set a cookie for a random id)
  let targetLabel = target_user_id;
  try {
    const admin = createAdminClient();
    const { data: profile } = await (admin.from("profiles") as any)
      .select("display_name")
      .eq("id", target_user_id)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    if ((profile as any).display_name) targetLabel = (profile as any).display_name;
  } catch {}

  const token = signImpersonation({ sa: actorId, u: target_user_id, iat: Math.floor(Date.now() / 1000) });

  cookies().set(IMPERSONATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: IMPERSONATE_MAX_AGE,
  });

  // Audit log — best-effort
  try {
    const admin = createAdminClient();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    await (admin.from("audit_log") as any).insert({
      user_id: actorId,
      action: "impersonate_start",
      target_type: "user",
      target_id: target_user_id,
      details: { target_label: targetLabel, reason: reason ?? null, expires_in_seconds: IMPERSONATE_MAX_AGE },
      ip_address: ip,
    });
  } catch {}

  return NextResponse.json({ ok: true, target_label: targetLabel, expires_in_seconds: IMPERSONATE_MAX_AGE });
}

// DELETE /api/super/impersonate  → stop
export async function DELETE(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = cookies().get(IMPERSONATE_COOKIE)?.value;
  const payload = existing ? verifyImpersonation(existing) : null;

  cookies().delete(IMPERSONATE_COOKIE);

  // Audit stop if the cookie was ours
  if (payload && payload.sa === userId) {
    try {
      const admin = createAdminClient();
      await (admin.from("audit_log") as any).insert({
        user_id: userId,
        action: "impersonate_stop",
        target_type: "user",
        target_id: payload.u,
        details: {},
      });
    } catch {}
  }
  return NextResponse.json({ ok: true });
}

// GET /api/super/impersonate → current status (used by the banner)
export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ active: false });

  const existing = cookies().get(IMPERSONATE_COOKIE)?.value;
  const payload = existing ? verifyImpersonation(existing) : null;
  if (!payload || payload.sa === userId) {
    // Cookie is theirs → they're the admin, banner shows for the target-side view
  }
  if (!payload) return NextResponse.json({ active: false });

  // If the cookie exists but doesn't belong to this user, it means:
  // the admin is impersonating this user (payload.u === userId).
  // Look up the admin's display name for the banner.
  let admin_label: string | null = null;
  let target_label: string | null = null;
  try {
    const admin = createAdminClient();
    const [{ data: adminP }, { data: targetP }] = await Promise.all([
      (admin.from("profiles") as any).select("display_name").eq("id", payload.sa).maybeSingle(),
      (admin.from("profiles") as any).select("display_name").eq("id", payload.u).maybeSingle(),
    ]);
    admin_label = (adminP as any)?.display_name ?? null;
    target_label = (targetP as any)?.display_name ?? null;
  } catch {}

  return NextResponse.json({
    active: true,
    sa: payload.sa,
    u:  payload.u,
    admin_label,
    target_label,
    started_at: payload.iat,
    expires_at: payload.iat + IMPERSONATE_MAX_AGE,
  });
}
