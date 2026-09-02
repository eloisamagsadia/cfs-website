import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAdminDigest } from "@/lib/emails/admin-digest";

// GET /api/cron/weekly-digest
// Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Gate on it so
// randos can't fire the email storm.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin  = createAdminClient();
  const now    = new Date();
  const weekMs = 7 * 86400 * 1000;
  const since  = new Date(now.getTime() - weekMs);
  const soon   = new Date(now.getTime() + weekMs);

  const [
    { data: newMembers },
    { data: orders },
    { data: donations },
    { data: pendingReports },
    { data: pendingRefunds },
    { data: contactNew },
    { data: pendingFanLetters },
    { data: upcomingEvents },
    { data: adminRows },
  ] = await Promise.all([
    (admin as any).from("profiles").select("id", { count: "exact", head: false }).gte("created_at", since.toISOString()),
    (admin as any).from("orders").select("id, total, payment_status, created_at").gte("created_at", since.toISOString()),
    (admin as any).from("donations").select("id, amount, status, created_at").gte("created_at", since.toISOString()),
    (admin as any).from("community_reports").select("id", { count: "exact", head: false }).eq("status", "pending"),
    (admin as any).from("refunds").select("id", { count: "exact", head: false }).eq("status", "pending"),
    (admin as any).from("contact_messages").select("id", { count: "exact", head: false }).eq("status", "new"),
    (admin as any).from("fan_letters").select("id", { count: "exact", head: false }).eq("is_approved", false),
    (admin as any)
      .from("events")
      .select("id, title, date, capacity")
      .gte("date", now.toISOString())
      .lt("date", soon.toISOString())
      .order("date", { ascending: true })
      .limit(6),
    (admin as any).from("profiles").select("id, display_name, email, role").in("role", ["admin", "super_admin"]).not("email", "is", null),
  ]);

  const paidOrders  = (orders as any[] ?? []).filter(o => o.payment_status === "paid");
  const revenue     = paidOrders.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const paidDonos   = (donations as any[] ?? []).filter(d => d.status === "completed");
  const donoTotal   = paidDonos.reduce((s, d) => s + Number(d.amount ?? 0), 0);

  const fmtPeso = (n: number) => `₱${Math.round(n).toLocaleString("en-PH")}`;
  const fmtRange = () => {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", timeZone: "Asia/Manila" };
    return `${since.toLocaleDateString("en-PH", opts)} – ${new Date(now.getTime() - 86400000).toLocaleDateString("en-PH", opts)}`;
  };

  const stats = [
    { label: "New members", value: String((newMembers as any[] ?? []).length) },
    { label: "Revenue",     value: fmtPeso(revenue), sub: `${paidOrders.length} paid order${paidOrders.length === 1 ? "" : "s"}` },
    { label: "Donations",   value: fmtPeso(donoTotal), sub: `${paidDonos.length} donor${paidDonos.length === 1 ? "" : "s"}` },
  ];

  const actionItems: { label: string; count: number; href: string }[] = [];
  const pushIf = (c: number, label: string, href: string) => { if (c > 0) actionItems.push({ label, count: c, href }); };
  pushIf((pendingReports as any[] ?? []).length,    "Community reports queue",     "/admin/community-reports");
  pushIf((pendingRefunds as any[] ?? []).length,    "Pending refunds",             "/admin/refunds");
  pushIf((contactNew as any[] ?? []).length,        "New contact messages",        "/admin/contact");
  pushIf((pendingFanLetters as any[] ?? []).length, "Fan letters awaiting review", "/admin/fan-letters");

  const upcoming = (upcomingEvents as any[] ?? []).map(e => ({
    title: e.title,
    when:  new Date(e.date).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Manila" }),
    registered: 0,
    capacity: e.capacity ?? null,
  }));

  // If we care about registered counts, fetch them once per batch
  if (upcoming.length) {
    const ids = (upcomingEvents as any[]).map(e => e.id);
    const { data: regs } = await (admin as any)
      .from("event_registrations")
      .select("event_id")
      .in("event_id", ids)
      .neq("payment_status", "cancelled");
    const byEvent: Record<string, number> = {};
    for (const r of (regs as any[] ?? [])) byEvent[r.event_id] = (byEvent[r.event_id] ?? 0) + 1;
    upcoming.forEach((u, i) => { u.registered = byEvent[(upcomingEvents as any[])[i].id] ?? 0; });
  }

  const admins = (adminRows as any[] ?? []).filter(a => a.email);
  let sent = 0, failed = 0;
  for (const a of admins) {
    try {
      await sendAdminDigest({
        admin_email:  a.email,
        admin_name:   a.display_name ?? "admin",
        period_label: fmtRange(),
        stats,
        action_items: actionItems,
        upcoming,
      });
      sent++;
    } catch (e) {
      console.error("[weekly-digest] send failed for", a.email, e);
      failed++;
    }
  }

  return NextResponse.json({
    ok: true,
    period: fmtRange(),
    recipients: admins.length,
    sent, failed,
    stats,
    action_items: actionItems,
    upcoming_count: upcoming.length,
  });
}
