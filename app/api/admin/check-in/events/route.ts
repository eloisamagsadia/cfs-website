import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Lists upcoming events for the check-in page's event picker.
// Accessible to admin/super_admin OR members flagged is_event_staff.
export async function GET() {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const isEventStaff = !!(sessionClaims?.metadata as { is_event_staff?: boolean })?.is_event_staff;
  const allowed = ["admin", "super_admin"].includes(role ?? "") || isEventStaff;
  if (!userId || !allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  // Upcoming = today or later. Sort earliest-first so the picker
  // defaults to the closest event.
  const todayIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await (admin.from("events") as any)
    .select("id, title, date, location")
    .gte("date", todayIso)
    .order("date", { ascending: true })
    .limit(20);
  return NextResponse.json({ events: data ?? [] });
}
