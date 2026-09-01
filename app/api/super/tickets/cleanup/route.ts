import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

export async function GET() {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await (admin.from("event_tickets") as any)
    .select("id, ticket_number, user_id, event_id, created_at, events:event_id(title, date)")
    .eq("status", "pending_payment")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data ?? [] });
}

export async function POST(req: NextRequest) {
  const userId = await requireSuper();
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
