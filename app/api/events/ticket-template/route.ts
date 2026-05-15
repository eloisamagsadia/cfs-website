import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const event_id = new URL(req.url).searchParams.get("event_id");
  if (!event_id) return NextResponse.json({ error: "Missing event_id" }, { status: 400 });

  const { data: template } = await db()
    .from("event_ticket_templates")
    .select("*")
    .eq("event_id", event_id)
    .single();

  return NextResponse.json({ template: template ?? null });
}

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { event_id, bg_color, accent_color, bg_image_url, logo_url, custom_message } = body;

  if (!event_id) return NextResponse.json({ error: "Missing event_id" }, { status: 400 });

  // Upsert template
  const { data: template, error } = await db()
    .from("event_ticket_templates")
    .upsert({
      event_id,
      bg_color: bg_color ?? "#0F1A0B",
      accent_color: accent_color ?? "#3CCE2A",
      bg_image_url: bg_image_url ?? null,
      logo_url: logo_url ?? null,
      custom_message: custom_message ?? null,
    }, { onConflict: "event_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ template });
}
