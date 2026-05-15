import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: members } = await db
    .from("profiles")
    .select("id, display_name, avatar_url, role, created_at, is_banned, image_post_count, email")
    .order("created_at", { ascending: false });

  return NextResponse.json({ members: members ?? [] });
}
