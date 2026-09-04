import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import { isHiddenAdmin } from "@/lib/hidden-admins";

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  // Look up by case-insensitive name. If it matches a hidden admin account,
  // pretend it doesn't exist (for anyone but the owner themselves).
  const { data: matches } = await (supabase.from("profiles") as any)
    .select("id")
    .ilike("display_name", name)
    .limit(2);
  const viewerIsOwner = isHiddenAdmin(userId);
  const rows = ((matches ?? []) as { id: string }[]).filter(r => viewerIsOwner || !isHiddenAdmin(r.id));
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (rows.length > 1) return NextResponse.json({ error: "Multiple members match — please refine" }, { status: 409 });
  return NextResponse.json({ userId: rows[0].id });
}
