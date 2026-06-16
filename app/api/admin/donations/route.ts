import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: donations, error } = await supabase
    .from("donations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!donations?.length) return NextResponse.json({ donations: [] });

  const userIds = [...new Set(donations.map((d: any) => d.user_id).filter(Boolean))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, email")
    .in("id", userIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
  const merged = donations.map((d: any) => ({ ...d, profiles: profileMap[d.user_id] ?? null }));

  return NextResponse.json({ donations: merged });
}
