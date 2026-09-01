import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return userId;
}

const VALID_KEYS = ["event_ticket", "donation_receipt", "order_confirmation", "welcome"] as const;

export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const admin = createAdminClient();

  if (key) {
    if (!VALID_KEYS.includes(key as any)) return NextResponse.json({ error: "Unknown template key" }, { status: 400 });
    const { data, error } = await (admin.from("email_templates") as any)
      .select("key, subject, html, sections, updated_at, updated_by")
      .eq("key", key)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    return NextResponse.json({ template: data });
  }

  const { data, error } = await (admin.from("email_templates") as any)
    .select("*")
    .order("key", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { key, subject, html, sections } = body;

  if (!key || !VALID_KEYS.includes(key)) return NextResponse.json({ error: "Unknown template key" }, { status: 400 });
  if (typeof subject !== "string" || !subject.trim()) return NextResponse.json({ error: "Subject required" }, { status: 400 });

  const patch: Record<string, any> = { subject, updated_by: userId };

  // Sections is the new preferred mode. When present, we don't require html
  // — the send path will render through the fixed shell. Passing `null`
  // explicitly clears sections (falls back to legacy html).
  if (sections !== undefined) {
    if (sections !== null && typeof sections !== "object") {
      return NextResponse.json({ error: "sections must be an object or null" }, { status: 400 });
    }
    patch.sections = sections;
  }

  if (html !== undefined) {
    if (typeof html !== "string") return NextResponse.json({ error: "html must be a string" }, { status: 400 });
    patch.html = html;
  }

  // If neither sections nor html were provided, require html to remain non-empty.
  if (sections === undefined && html === undefined) {
    return NextResponse.json({ error: "Provide sections or html to update" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await (admin.from("email_templates") as any)
    .update(patch)
    .eq("key", key)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({ userId, action: "edit_email_template", target_type: "email_template", target_id: key, details: { fields: Object.keys(patch).filter(k => k !== "updated_by") }, req });
  return NextResponse.json({ template: data });
}
