import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || role !== "super_admin") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  const { data: logs } = await (db() as any)
    .from("audit_log")
    .select("*, profiles:user_id(id, display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(200);

  return NextResponse.json({ logs: logs ?? [] });
}
