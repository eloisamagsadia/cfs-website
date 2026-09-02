import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

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

// Whitelist of columns super admins are allowed to update.
// Anything not in this list is silently dropped — prevents body injection
// (e.g. { id: "some-other-uuid" } or { updated_by: "someone-else" }).
const ALLOWED_KEYS = new Set<string>([
  "maintenance_mode",
  "max_image_posts_per_month",
  "max_community_post_length",
  "announcement_text",
  "announcement_active",
  "announcement_color",
  "announcement_cta_label",
  "announcement_cta_url",
  "announcement_starts_at",
  "announcement_ends_at",
]);

export async function GET() {
  // GET is super-only too: settings are readable everywhere else via
  // dedicated endpoints (e.g. the maintenance banner reader), and the
  // raw table can leak in-flight or scheduled announcement copy.
  if (!(await requireSuperAdmin())) return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  const { data } = await (db() as any).from("site_settings").select("*").maybeSingle();
  return NextResponse.json({ settings: data });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireSuperAdmin();
  if (!userId) return NextResponse.json({ error: "Super admin only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: userId };
  for (const [k, v] of Object.entries(body ?? {})) {
    if (ALLOWED_KEYS.has(k)) payload[k] = v;
  }

  // site_settings is a singleton — fetch the sole row's id once, then update.
  const { data: existing } = await (db() as any).from("site_settings").select("id").maybeSingle();
  if (!existing?.id) return NextResponse.json({ error: "site_settings row missing" }, { status: 500 });

  const { data, error } = await (db() as any)
    .from("site_settings")
    .update(payload)
    .eq("id", existing.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId,
    action: "update_site_settings",
    target_type: "site_settings",
    target_id: existing.id,
    details: { fields: Object.keys(payload).filter(k => k !== "updated_at" && k !== "updated_by") },
    req,
  });

  return NextResponse.json({ settings: data });
}
