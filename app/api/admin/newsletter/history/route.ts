import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/newsletter/history  → last 40 broadcasts + delivery stats
export async function GET(_req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: broadcasts, error } = await (admin as any)
    .from("audit_log")
    .select("id, user_id, action, details, created_at, profiles:user_id(display_name)")
    .in("action", ["newsletter_broadcast", "newsletter_test_send"])
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Collect broadcast_ids from details (only real newsletter_broadcast rows have one)
  const broadcastIds = Array.from(new Set(
    (broadcasts as any[] ?? [])
      .map(b => b.details?.broadcast_id)
      .filter(Boolean)
  ));

  // Batch-fetch delivery events for those broadcasts, aggregate in memory
  const stats: Record<string, any> = {};
  if (broadcastIds.length > 0) {
    const { data: rows } = await (admin as any)
      .from("email_deliveries")
      .select("broadcast_id, delivered_at, opened_at, clicked_at, bounced_at, complained_at")
      .in("broadcast_id", broadcastIds);
    for (const r of (rows as any[] ?? [])) {
      const s = stats[r.broadcast_id] ??= { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
      s.sent++;
      if (r.delivered_at)  s.delivered++;
      if (r.opened_at)     s.opened++;
      if (r.clicked_at)    s.clicked++;
      if (r.bounced_at)    s.bounced++;
      if (r.complained_at) s.complained++;
    }
  }

  const enriched = (broadcasts as any[]).map(b => ({
    ...b,
    stats: b.details?.broadcast_id ? (stats[b.details.broadcast_id] ?? null) : null,
  }));

  return NextResponse.json({ broadcasts: enriched });
}
