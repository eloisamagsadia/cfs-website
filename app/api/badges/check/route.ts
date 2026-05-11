import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { checkAndAwardBadges } from "@/lib/badges";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { trigger_type } = await req.json();
  if (!trigger_type) return NextResponse.json({ error: "Missing trigger_type" }, { status: 400 });

  await checkAndAwardBadges(userId, trigger_type);
  return NextResponse.json({ success: true });
}
