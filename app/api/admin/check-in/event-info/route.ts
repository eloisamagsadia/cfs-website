import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Full briefing + attendee list for one event, used by /admin/check-in
// briefing + attendees tabs. Accessible to admin/super_admin OR members
// flagged is_event_staff. Financial fields (amount paid, method) are
// intentionally omitted from the attendee rows — volunteers only need
// to see PAID vs COMP + tier + check-in status.
export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const isEventStaff = !!(sessionClaims?.metadata as { is_event_staff?: boolean })?.is_event_staff;
  const allowed = ["admin", "super_admin"].includes(role ?? "") || isEventStaff;
  if (!userId || !allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = new URL(req.url).searchParams.get("event_id");
  if (!eventId) return NextResponse.json({ error: "event_id required" }, { status: 400 });

  const admin = createAdminClient();

  const [eventRes, ticketsRes] = await Promise.all([
    (admin.from("events") as any)
      .select("id, title, date, location, map_url, banner_url, description, guidelines_url, guidelines_text")
      .eq("id", eventId)
      .maybeSingle(),
    (admin.from("event_tickets") as any)
      .select("id, ticket_number, status, checked_in_at, qr_data, event_tiers:tier_id(name, color), profiles:user_id(display_name, email)")
      .eq("event_id", eventId)
      .in("status", ["active", "used"])
      .order("ticket_number", { ascending: true }),
  ]);

  if (eventRes.error || !eventRes.data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const tickets = (ticketsRes.data ?? []) as any[];
  const attendees = tickets.map(t => ({
    ticket_id:      t.id,
    ticket_number:  t.ticket_number,
    name:           t.profiles?.display_name ?? t.qr_data?.member_name ?? "Guest",
    email:          t.profiles?.email ?? t.qr_data?.member_email ?? null,
    tier_name:      t.event_tiers?.name ?? t.qr_data?.tier_name ?? "General",
    tier_color:     t.event_tiers?.color ?? "#1A8040",
    is_comp:        t.qr_data?.comp_source === "admin_manual",
    checked_in:     t.status === "used",
    checked_in_at:  t.checked_in_at ?? null,
  }));

  // Per-tier breakdown for the briefing dashboard.
  const tierMap = new Map<string, { tier: string; total: number; checked_in: number; color: string }>();
  for (const a of attendees) {
    const key = a.tier_name;
    if (!tierMap.has(key)) tierMap.set(key, { tier: key, total: 0, checked_in: 0, color: a.tier_color });
    const t = tierMap.get(key)!;
    t.total += 1;
    if (a.checked_in) t.checked_in += 1;
  }

  return NextResponse.json({
    event: eventRes.data,
    attendees,
    stats: {
      total: attendees.length,
      checked_in: attendees.filter(a => a.checked_in).length,
      per_tier: Array.from(tierMap.values()),
    },
  });
}
