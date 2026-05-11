import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const name = req.nextUrl.searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id")
    .ilike("display_name", name)
    .single();
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ userId: (profile as any).id });
}
