import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/newsletter/history  → last 40 newsletter broadcasts
export async function GET(_req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("audit_log")
    .select("id, user_id, action, details, created_at, profiles:user_id(display_name)")
    .in("action", ["newsletter_broadcast", "newsletter_test_send"])
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ broadcasts: data ?? [] });
}
