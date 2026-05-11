import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") return null;
  return userId;
}

export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { title, message, type, target, targetUserId, eventId, link } = await req.json();

  if (!title?.trim() || !message?.trim())
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });

  const notifBase = {
    type: type || "announcement",
    title: title.trim(),
    message: message.trim(),
    link: link?.trim() || null,
    is_read: false,
  };

  try {
    // Broadcast to ALL members
    if (target === "all") {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id")
        .neq("id", userId); // don't notify yourself

      const rows = (profiles ?? []).map(p => ({ ...notifBase, user_id: p.id }));
      if (rows.length > 0) await admin.from("notifications").insert(rows);
      return NextResponse.json({ sent: rows.length, target: "all" });
    }

    // Send to specific member
    if (target === "member" && targetUserId) {
      await admin.from("notifications").insert({ ...notifBase, user_id: targetUserId });
      return NextResponse.json({ sent: 1, target: "member" });
    }

    // Event reminder to all registrants
    if (target === "event" && eventId) {
      const { data: regs } = await admin
        .from("event_registrations")
        .select("user_id")
        .eq("event_id", eventId)
        .neq("payment_status", "cancelled");

      const rows = (regs ?? [])
        .filter(r => r.user_id !== userId)
        .map(r => ({ ...notifBase, type: "event_reminder", user_id: r.user_id }));

      if (rows.length > 0) await admin.from("notifications").insert(rows);
      return NextResponse.json({ sent: rows.length, target: "event" });
    }

    return NextResponse.json({ error: "Invalid target" }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
