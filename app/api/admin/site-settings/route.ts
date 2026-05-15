import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireSuperAdmin() {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || role !== "super_admin") return null;
  return userId;
}

export async function GET() {
  const { data } = await (db() as any).from("site_settings").select("*").single();
  return NextResponse.json({ settings: data });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireSuperAdmin();
  if (!userId) return NextResponse.json({ error: "Super admin only" }, { status: 403 });

  const body = await req.json();
  const { data } = await (db() as any)
    .from("site_settings")
    .update({ ...body, updated_at: new Date().toISOString(), updated_by: userId })
    .eq("id", (await (db() as any).from("site_settings").select("id").single()).data.id)
    .select()
    .single();

  // Log to audit log
  await (db() as any).from("audit_log").insert({
    user_id: userId,
    action: "update_site_settings",
    target_type: "site_settings",
    details: body,
  });

  return NextResponse.json({ settings: data });
}
