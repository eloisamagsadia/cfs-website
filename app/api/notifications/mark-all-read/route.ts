import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function POST() {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  return NextResponse.redirect(new URL("/members/notifications", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
