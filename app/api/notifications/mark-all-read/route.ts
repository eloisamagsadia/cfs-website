import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";

export async function POST() {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await (((supabase.from("notifications") as any) as any) as any).update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  return NextResponse.redirect(new URL("/members/notifications", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
