import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, message, link } = await req.json();
  if (!title || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Get all member IDs
  const { data: profiles } = await db().from("profiles").select("id").eq("is_banned", false);
  const userIds = (profiles ?? []).map((p: any) => p.id);

  // Batch insert notifications
  const notifications = userIds.map(uid => ({
    user_id: uid,
    type: "announcement",
    title,
    message,
    link: link ?? null,
  }));

  // Insert in chunks of 100
  for (let i = 0; i < notifications.length; i += 100) {
    await (db() as any).from("notifications").insert(notifications.slice(i, i + 100));
  }

  // Log audit
  await (db() as any).from("audit_log").insert({
    user_id: userId,
    action: "broadcast_notification",
    target_type: "all_members",
    details: { title, message, count: userIds.length },
  });

  return NextResponse.json({ success: true, sent: userIds.length });
}
