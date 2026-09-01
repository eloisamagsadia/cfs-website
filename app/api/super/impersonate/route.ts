import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

export async function POST(req: NextRequest) {
  const actorId = await requireSuper();
  if (!actorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { target_user_id, reason } = await req.json().catch(() => ({}));
  if (!target_user_id) return NextResponse.json({ error: "target_user_id required" }, { status: 400 });

  if (target_user_id === actorId) {
    return NextResponse.json({ error: "You are already signed in as yourself" }, { status: 400 });
  }

  // Look up target user to confirm they exist and get display info for the audit log
  let targetLabel = target_user_id;
  try {
    const admin = createAdminClient();
    const { data: profile } = await (admin.from("profiles") as any).select("display_name").eq("id", target_user_id).single();
    if ((profile as any)?.display_name) targetLabel = (profile as any).display_name;
  } catch {}

  // Create a one-time Clerk sign-in token for the target user.
  // Docs: https://clerk.com/docs/references/backend/sign-in-tokens/create-sign-in-token
  let token: { token: string; url?: string };
  try {
    token = await (clerkClient as any).signInTokens.createSignInToken({
      userId: target_user_id,
      expiresInSeconds: 300,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Clerk error: ${e?.message ?? "could not create sign-in token"}` }, { status: 500 });
  }

  // Audit log — best-effort; failure to log should not block the sign-in
  try {
    const admin = createAdminClient();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    await (admin.from("audit_log") as any).insert({
      user_id: actorId,
      action: "impersonate_start",
      target_type: "user",
      target_id: target_user_id,
      details: { target_label: targetLabel, reason: reason ?? null, expires_in_seconds: 300 },
      ip_address: ip,
    });
  } catch {}

  const signInUrl = `/sign-in?__clerk_ticket=${token.token}`;
  return NextResponse.json({ sign_in_url: signInUrl, expires_in_seconds: 300, target_label: targetLabel });
}
