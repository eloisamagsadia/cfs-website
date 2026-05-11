import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") return null;
  return userId;
}

export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId, role } = await req.json();
  if (!targetUserId || !role) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Only update Clerk if it's a Clerk user ID (starts with "user_")
  if (targetUserId.startsWith("user_")) {
    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: { role },
    });
  }

  // Always update Supabase profile
  await admin().from("profiles").update({ role }).eq("id", targetUserId);

  return NextResponse.json({ ok: true });
}
