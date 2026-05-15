import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mod_id = new URL(req.url).searchParams.get("mod_id");

  let query = (db() as any)
    .from("mod_actions")
    .select("*, profiles:mod_id(id, display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (mod_id) query = query.eq("mod_id", mod_id);

  const { data: actions } = await query;
  return NextResponse.json({ actions: actions ?? [] });
}

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !["admin", "super_admin", "moderator"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action_type, target_type, target_id, notes } = body;

  const { data: action } = await (db() as any)
    .from("mod_actions")
    .insert({ mod_id: userId, action_type, target_type, target_id, notes })
    .select()
    .single();

  return NextResponse.json({ action });
}
