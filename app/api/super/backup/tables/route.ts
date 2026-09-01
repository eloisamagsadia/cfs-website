import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

/**
 * Returns the list of public user tables and their approximate row counts.
 * Used by the /super/backup overview so admins see what a snapshot contains.
 */
export async function GET() {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const TABLE_LIST = [
    "audit_log","badges","cart_items","chat_members","chat_messages","chat_nicknames","chat_reactions","chat_rooms",
    "community_categories","community_comments","community_follows","community_mentions","community_posts",
    "community_reactions","community_reports","community_reposts","donation_drive_allocations","donation_drives",
    "donations","email_manual_templates","email_templates","event_categories","event_fan_submissions",
    "event_registrations","event_ticket_templates","event_tickets","event_tiers","events","exclusive_content",
    "fan_letters","feature_flags","mod_actions","notification_settings","notifications","order_items","orders",
    "payment_transactions","product_categories","products","profiles","project_media","projects","promo_code_usage",
    "promo_codes","report_receipts","shipping_rates","site_settings","sponsor_perks","support_tickets",
    "tr_reactions","transparency_reports","user_badges","user_promo_codes",
  ];

  const results = await Promise.all(TABLE_LIST.map(async (name) => {
    try {
      const { count } = await (admin as any).from(name).select("*", { count: "exact", head: true });
      return { name, count: count ?? 0, error: null };
    } catch (e: any) {
      return { name, count: 0, error: e?.message ?? "query failed" };
    }
  }));

  return NextResponse.json({ tables: results, total_rows: results.reduce((s, r) => s + r.count, 0) });
}
