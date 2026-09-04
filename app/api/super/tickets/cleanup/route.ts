import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// Pending-tickets cleanup is a routine ops task (freeing capacity signals
// held by abandoned checkouts), not a sensitive super-only surface, so
// admins can run it too. Kept at /api/super for URL stability with the
// pg_cron job and any bookmarks.
async function requireStaff() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin" && role !== "super_admin") return null;
  return userId;
}

export async function GET() {
  const userId = await requireStaff();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const [ticketsRes, lastAutoRes] = await Promise.all([
    (admin.from("event_tickets") as any)
      .select("id, ticket_number, user_id, event_id, created_at, events:event_id(title, date)")
      .eq("status", "pending_payment")
      .order("created_at", { ascending: false }),
    // Most recent auto-cleanup run so the panel can show "Last auto-cleanup: X ago".
    // The pg_cron job only logs runs that actually cancelled something.
    (admin.from("audit_log") as any)
      .select("created_at, details")
      .eq("action", "cleanup_pending_tickets_auto")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (ticketsRes.error) return NextResponse.json({ error: ticketsRes.error.message }, { status: 500 });
  return NextResponse.json({
    tickets: ticketsRes.data ?? [],
    last_auto_cleanup: lastAutoRes.data ?? null,
  });
}

export async function POST(req: NextRequest) {
  const userId = await requireStaff();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const hours = Math.max(1, Math.min(720, Number(body.hours ?? 24) || 24));
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();
  const { data, error } = await (admin.from("event_tickets") as any)
    .update({ status: "cancelled", payment_status: "failed" })
    .eq("status", "pending_payment")
    .lt("created_at", cutoff)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({ userId, action: "cleanup_pending_tickets", target_type: "event_tickets", details: { hours_cutoff: hours, cancelled_count: data?.length ?? 0 }, req });
  return NextResponse.json({ cancelled: data?.length ?? 0, hours });
}
