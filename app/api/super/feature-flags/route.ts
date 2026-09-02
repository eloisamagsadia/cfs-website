import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

export async function GET() {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await (admin.from("feature_flags") as any)
    .select("key, enabled, description, updated_at, updated_by")
    .order("key", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flags: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, enabled } = await req.json();
  if (!key || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "key and enabled required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await (admin.from("feature_flags") as any)
    .update({ enabled, updated_by: userId })
    .eq("key", key)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: `Feature flag "${key}" not found` }, { status: 404 });
  await logAudit({ userId, action: enabled ? "enable_feature_flag" : "disable_feature_flag", target_type: "feature_flag", target_id: key, req });
  return NextResponse.json({ flag: data });
}
