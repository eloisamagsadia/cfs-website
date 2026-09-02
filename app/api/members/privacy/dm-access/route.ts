import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/members/privacy/dm-access
// Returns audit_log rows where an admin viewed a DM the caller is part of.
export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Postgres JSONB contains query: details->'participants' has our user_id.
  const { data, error } = await (admin as any)
    .from("audit_log")
    .select("id, user_id, action, target_id, details, created_at, profiles:user_id(display_name, avatar_url, role)")
    .eq("action", "view_chat_room")
    .contains("details", { participants: [userId] })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Only report DM opens (is_group=false) — group chats aren't private.
  const rows = ((data as any[]) ?? []).filter(r => r.details?.is_group === false);
  return NextResponse.json({ accesses: rows });
}
