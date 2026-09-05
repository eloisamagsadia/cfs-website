import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Refund performance stats — powers /admin/refunds/performance.
 *
 * GET /api/admin/refunds/stats?range=30d|90d|all
 *
 * We compute everything client-side from a single refunds pull (bounded
 * by the range) rather than issuing 6 aggregate SQL queries — the
 * refunds table is small enough that this is fine, and it keeps every
 * derived stat consistent to one snapshot.
 *
 * Super-admin only. Refunds are financial data.
 */

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

type Row = {
  id: string;
  status: string;
  entity_type: string;
  amount: string | number | null;
  paymongo_ref: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  note: string | null;
};

function parseFailureReason(note: string | null): string | null {
  if (!note) return null;
  const m = String(note).match(/\[paymongo_(?:failed|error):[^\]]*\]\s*(.+?)(?:\n|$)/i);
  return m?.[1]?.trim().slice(0, 120) ?? null;
}

function bucketDay(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Super admin only" }, { status: 403 });

  const range = new URL(req.url).searchParams.get("range") ?? "30d";
  const now = Date.now();
  const rangeMs = range === "all" ? null : range === "90d" ? 90 * 86400000 : 30 * 86400000;

  const admin = createAdminClient();
  let q = (admin as any)
    .from("refunds")
    .select("id, status, entity_type, amount, paymongo_ref, processed_by, processed_at, created_at, note")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (rangeMs !== null) {
    q = q.gte("created_at", new Date(now - rangeMs).toISOString());
  }
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []) as Row[];

  // Totals — completed only counts against paid volume
  const completed  = rows.filter(r => r.status === "completed");
  const totalPaid  = completed.reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
  const avgTicket  = completed.length ? totalPaid / completed.length : 0;

  // Status split (all statuses in range)
  const statusSplit: Record<string, { count: number; amount: number }> = {};
  for (const r of rows) {
    const s = r.status;
    statusSplit[s] ??= { count: 0, amount: 0 };
    statusSplit[s].count  += 1;
    statusSplit[s].amount += Number(r.amount ?? 0);
  }

  // Entity split
  const entitySplit: Record<string, { count: number; amount: number }> = {};
  for (const r of rows) {
    const t = r.entity_type;
    entitySplit[t] ??= { count: 0, amount: 0 };
    entitySplit[t].count  += 1;
    entitySplit[t].amount += Number(r.amount ?? 0);
  }

  // Auto vs manual — webhook completions leave processed_by NULL; admin
  // PATCH and sync-succeeded process both write processed_by.
  let autoCount = 0, manualCount = 0;
  for (const r of completed) {
    if (r.processed_by) manualCount++;
    else if (r.paymongo_ref) autoCount++;
    else manualCount++; // legacy / unknown → count as manual so we don't over-report auto
  }

  // Time-to-complete — median + p90 across completed rows with both timestamps
  const durations: number[] = [];
  for (const r of completed) {
    if (!r.processed_at) continue;
    const ms = new Date(r.processed_at).getTime() - new Date(r.created_at).getTime();
    if (Number.isFinite(ms) && ms >= 0) durations.push(ms);
  }
  durations.sort((a, b) => a - b);
  const median = durations.length ? durations[Math.floor(durations.length / 2)] : 0;
  const p90    = durations.length ? durations[Math.floor(durations.length * 0.9)] ?? durations[durations.length - 1] : 0;

  // Failure reasons — top 3 parsed from note
  const failureCounts = new Map<string, number>();
  for (const r of rows.filter(r => r.status === "failed")) {
    const reason = parseFailureReason(r.note) ?? "unknown";
    failureCounts.set(reason, (failureCounts.get(reason) ?? 0) + 1);
  }
  const topFailures = Array.from(failureCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  // Daily trend — count + amount of COMPLETED refunds per day, back-filled zeros
  const daysBack = range === "all" ? 30 : range === "90d" ? 90 : 30;
  const trendMap = new Map<string, { count: number; amount: number }>();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(now - i * 86400000);
    trendMap.set(bucketDay(d.toISOString()), { count: 0, amount: 0 });
  }
  for (const r of completed) {
    const key = bucketDay(r.processed_at ?? r.created_at);
    const cur = trendMap.get(key);
    if (cur) { cur.count += 1; cur.amount += Number(r.amount ?? 0); }
  }
  const trend = Array.from(trendMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, count: v.count, amount: v.amount }));

  return NextResponse.json({
    range,
    generatedAt: new Date().toISOString(),
    totals: {
      completedCount:  completed.length,
      completedAmount: totalPaid,
      avgTicket,
      pendingCount:    statusSplit.pending?.count    ?? 0,
      processingCount: statusSplit.processing?.count ?? 0,
      failedCount:     statusSplit.failed?.count     ?? 0,
      totalRows:       rows.length,
    },
    statusSplit,
    entitySplit,
    processing: {
      autoCount,
      manualCount,
      autoShare: autoCount + manualCount ? autoCount / (autoCount + manualCount) : 0,
      medianMs:  median,
      p90Ms:     p90,
    },
    topFailures,
    trend,
  });
}
