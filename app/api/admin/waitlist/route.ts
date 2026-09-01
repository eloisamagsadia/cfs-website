import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return userId;
}

// GET /api/admin/waitlist?event_id=...    — list entries for one event
// GET /api/admin/waitlist                  — summary per event (counts only)
export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin   = createAdminClient();
  const eventId = new URL(req.url).searchParams.get("event_id");

  if (eventId) {
    const [entriesRes, eventRes, regsRes] = await Promise.all([
      (admin as any)
        .from("event_waitlist")
        .select("*, profiles:user_id(display_name, avatar_url, email)")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true }),
      (admin as any).from("events").select("id, title, capacity, date, event_time").eq("id", eventId).maybeSingle(),
      (admin as any).from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).neq("payment_status", "cancelled"),
    ]);

    return NextResponse.json({
      event: eventRes.data ?? null,
      registered_count: regsRes.count ?? 0,
      entries: entriesRes.data ?? [],
    });
  }

  // Summary — for the admin index we group counts by event
  const { data, error } = await (admin as any)
    .from("event_waitlist")
    .select("event_id, status, events:event_id(id, title, date, capacity)")
    .in("status", ["waiting", "notified"]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byEvent: Record<string, { event: any; waiting: number; notified: number }> = {};
  for (const row of (data as any[]) ?? []) {
    const key = row.event_id;
    byEvent[key] ??= { event: row.events, waiting: 0, notified: 0 };
    if (row.status === "waiting")  byEvent[key].waiting++;
    if (row.status === "notified") byEvent[key].notified++;
  }
  return NextResponse.json({ summary: Object.values(byEvent) });
}

// PATCH /api/admin/waitlist  { id, status, note? }
export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status, note } = body ?? {};
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
  if (!["waiting", "notified", "converted", "expired", "cancelled"].includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const patch: Record<string, unknown> = { status };
  if (note !== undefined) patch.note = note;
  if (status === "notified")  patch.notified_at  = new Date().toISOString();
  if (status === "converted") patch.converted_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await (admin as any).from("event_waitlist").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // When admin marks 'notified', drop an in-app notification for the member.
  if (status === "notified" && (data as any)?.user_id && (data as any)?.event_id) {
    const { data: ev } = await (admin as any).from("events").select("title").eq("id", (data as any).event_id).maybeSingle();
    await (admin as any).from("notifications").insert({
      user_id: (data as any).user_id,
      type: "event_reminder",
      title: "A spot opened up!",
      message: `A spot is available for ${ev?.title ?? "an event"} you were waitlisted for. Register now before it fills again.`,
      link: `/events/${(data as any).event_id}`,
      is_read: false,
    });
  }

  await logAudit({ userId, action: "update_waitlist_entry", target_type: "event_waitlist", target_id: id, details: patch, req });
  return NextResponse.json({ entry: data });
}

// DELETE /api/admin/waitlist?id=...
export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await (admin as any).from("event_waitlist").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "delete_waitlist_entry", target_type: "event_waitlist", target_id: id, req });
  return NextResponse.json({ ok: true });
}
