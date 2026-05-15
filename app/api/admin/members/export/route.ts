import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || role !== "super_admin") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  const { data: members } = await db()
    .from("profiles")
    .select("id, display_name, role, created_at, is_banned, image_post_count")
    .order("created_at", { ascending: false });

  return NextResponse.json({ members: members ?? [] });
}
