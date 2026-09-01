import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// Run on Node runtime so we can stream a large JSON safely.
export const runtime = "nodejs";
// Vercel free plan defaults to 60s; use 300s so bigger snapshots don't
// get chopped. Bumping to the max in case the DB grows.
export const maxDuration = 300;

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

// Complete list of tables to snapshot. Order doesn't matter for a
// data-only JSON dump. Exclude nothing — this is a full backup.
const ALL_TABLES = [
  "audit_log","badges","cart_items","chat_members","chat_messages","chat_nicknames","chat_reactions","chat_rooms",
  "community_categories","community_comments","community_follows","community_mentions","community_posts",
  "community_reactions","community_reports","community_reposts","donation_drive_allocations","donation_drives",
  "donations","email_manual_templates","email_templates","event_categories","event_fan_submissions",
  "event_registrations","event_ticket_templates","event_tickets","event_tiers","events","exclusive_content",
  "fan_letters","feature_flags","mod_actions","notification_settings","notifications","order_items","orders",
  "payment_transactions","product_categories","products","profiles","project_media","projects","promo_code_usage",
  "promo_codes","report_receipts","shipping_rates","site_settings","sponsor_perks","support_tickets",
  "tr_reactions","transparency_reports","user_badges","user_promo_codes",
] as const;

const PAGE_SIZE = 1000;

async function fetchAll(admin: any, table: string): Promise<any[]> {
  const rows: any[] = [];
  let offset = 0;
  // Paginate to avoid PostgREST 1000-row cap
  // (Supabase JS client uses PostgREST which enforces this by default)
  while (true) {
    const { data, error } = await admin.from(table).select("*").range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

export async function POST(_req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const startedAt = new Date().toISOString();

  const tables: Record<string, any[]> = {};
  const errors: Record<string, string> = {};
  let totalRows = 0;

  for (const t of ALL_TABLES) {
    try {
      const rows = await fetchAll(admin as any, t);
      tables[t] = rows;
      totalRows += rows.length;
    } catch (e: any) {
      errors[t] = e?.message ?? "failed";
      tables[t] = [];
    }
  }

  const finishedAt = new Date().toISOString();
  const snapshot = {
    meta: {
      generated_at:   finishedAt,
      generated_by:   userId,
      project_ref:    "kwwmnnjqarwjbpmeywos",
      started_at:     startedAt,
      total_rows:     totalRows,
      table_count:    ALL_TABLES.length,
      table_errors:   errors,
      note:           "Data-only JSON snapshot. Schema is not included. Use Supabase dashboard for point-in-time restore.",
    },
    tables,
  };

  // Fire-and-forget audit
  logAudit({
    userId,
    action: "db_backup_export",
    target_type: "database",
    details: { total_rows: totalRows, error_count: Object.keys(errors).length, size_kb: Math.round(JSON.stringify(snapshot).length / 1024) },
  });

  const body = JSON.stringify(snapshot);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="cfs-backup-${finishedAt.slice(0, 10)}-${finishedAt.slice(11, 16).replace(":", "")}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
