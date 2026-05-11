import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import { checkAndAwardBadges } from "@/lib/badges";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { trigger_type } = await req.json();
  if (!trigger_type) return NextResponse.json({ error: "Missing trigger_type" }, { status: 400 });

  await checkAndAwardBadges(userId, trigger_type);
  return NextResponse.json({ success: true });
}
