import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      .select("*")
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
  const { key, subject, html } = body;

  if (!key || !VALID_KEYS.includes(key)) return NextResponse.json({ error: "Unknown template key" }, { status: 400 });
  if (typeof subject !== "string" || !subject.trim()) return NextResponse.json({ error: "Subject required" }, { status: 400 });
  if (typeof html !== "string" || !html.trim()) return NextResponse.json({ error: "HTML body required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await (admin.from("email_templates") as any)
    .update({ subject, html, updated_by: userId })
    .eq("key", key)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template: data });
}
