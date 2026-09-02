import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { promoteNextWaitlist } from "@/lib/waitlist-promote";
import { logAudit } from "@/lib/audit";

// POST /api/admin/waitlist/promote  { event_id, count? }
// Notifies the top-N oldest waiting entries for the given event.
export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { event_id, count } = await req.json();
  if (!event_id) return NextResponse.json({ error: "event_id required" }, { status: 400 });
  const n = Number(count ?? 1);
  if (!Number.isFinite(n) || n < 1) return NextResponse.json({ error: "count must be >= 1" }, { status: 400 });

  const { promoted, failed } = await promoteNextWaitlist(event_id, n);

  await logAudit({
    userId,
    action: "promote_waitlist_batch",
    target_type: "event_waitlist",
    target_id: event_id,
    details: { requested: n, promoted: promoted.length, failed },
    req,
  });

  return NextResponse.json({ promoted: promoted.length, failed, entries: promoted });
}
