import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/hidden-admins";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Audit log is owner-only. The shared super_admin account cannot see
// site-wide activity — that stays with the site owner alone.
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId || !isOwner(userId)) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { data: logs } = await (db() as any)
    .from("audit_log")
    .select("*, profiles:user_id(id, display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(200);

  return NextResponse.json({ logs: logs ?? [] });
}
