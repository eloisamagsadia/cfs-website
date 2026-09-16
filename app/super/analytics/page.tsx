import { createAdminClient } from "@/lib/supabase/admin";
import type { Metadata } from "next";
import Link from "next/link";
import dynamicImport from "next/dynamic";
import RealtimeRefresh from "@/components/shared/RealtimeRefresh";
import { IconUsers, IconTicket, IconHeart, IconCart } from "@/components/shared/Icons";

// Recharts is ~300KB gzipped — dynamic-import so the dashboard ships
// the SSR shell + stats immediately and only fetches the chart JS once
// the client hydrates.
const AnalyticsChart = dynamicImport(() => import("@/components/super/AnalyticsCharts"), {
  ssr: false,
  loading: () => <div style={{ height: 240, borderRadius: 12, background: "#F7FAF5", border: "1px dashed #DDE8DD" }} />,
});

export const metadata: Metadata = { title: "Analytics" };

// Realtime, not polled. RealtimeRefresh below re-renders on any change to the
// tables these numbers come from, so a cached page would only fight it.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

// ─── HELPERS ────────────────────────────────────────────────────────────────

/** Returns yyyy-mm-dd for a given Date in PHT. */
function phDate(d: Date): string {
  const pht = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return pht.toISOString().slice(0, 10);
}

/**
 * Build a 30-day series from a set of rows with a timestamp field.
 * Rows without dates are ignored. Days with no rows show as 0.
 */
function buildSeries(
  rows: any[] | null | undefined,
  timeField: string,
  aggregator: (row: any) => number = () => 1,
  days = 30,
): { day: string; value: number }[] {
  const counts = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    counts.set(phDate(d), 0);
  }
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  for (const r of rows ?? []) {
    const ts = r?.[timeField];
    if (!ts) continue;
    if (new Date(ts).getTime() < cutoff) continue;
    const key = phDate(new Date(ts));
    if (!counts.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + aggregator(r));
  }
  return Array.from(counts.entries()).map(([day, value]) => ({ day, value }));
}

/** Sum two 30-day series that share the same day keys. */
function mergeSeries(...series: { day: string; value: number }[][]) {
  const out = new Map<string, number>();
  for (const s of series) for (const p of s) out.set(p.day, (out.get(p.day) ?? 0) + p.value);
  return Array.from(out.entries()).map(([day, value]) => ({ day, value }));
}

// ─── PAGE ───────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const db = createAdminClient();
  const cutoffISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Every query is wrapped so a single failure doesn't nuke the entire dashboard.
  // Missing / errored data just renders as zero.
  const safe = async <T,>(p: Promise<{ data: any; count?: number | null; error: any }>, fallback: T): Promise<T> => {
    try {
      const r = await p;
      if (r.error) return fallback;
      return r as unknown as T;
    } catch { return fallback; }
  };

  const [membersRes, signupsRes, paidTicketsRes, donationsRes, ordersRes, eventsListRes] = await Promise.all([
    safe(db.from("profiles").select("*", { count: "exact", head: true }) as any, { count: 0 } as any),
    safe(db.from("profiles").select("created_at").gte("created_at", cutoffISO) as any, { data: [] } as any),
    // event_tickets carries no amount column — a ticket's price lives on its
    // tier, so revenue has to come through this embed. Without it the dashboard
    // reported 0 for what is by far the largest revenue stream.
    safe((db as any).from("event_tickets")
      .select("created_at, event_id, payment_status, event_tiers(price)")
      .eq("payment_status", "paid"), { data: [] } as any),
    safe((db as any).from("donations").select("created_at, amount, donation_amount, status").eq("status", "completed"), { data: [] } as any),
    safe((db as any).from("orders").select("created_at, total, payment_status").eq("payment_status", "paid"), { data: [] } as any),
    safe((db as any).from("events").select("id, title").order("date", { ascending: false }).limit(100), { data: [] } as any),
  ]);

  const totalMembers  = ((membersRes as any).count as number | null) ?? 0;
  const recentSignups = ((signupsRes as any).data as any[] | null) ?? [];
  const paidTickets   = ((paidTicketsRes as any).data as any[] | null) ?? [];
  const donations     = ((donationsRes as any).data as any[] | null) ?? [];
  const orders        = ((ordersRes as any).data as any[] | null) ?? [];
  const eventsList    = ((eventsListRes as any).data as any[] | null) ?? [];

  const ticketPrice   = (t: any) => Number(t?.event_tiers?.price ?? 0);
  const donationValue = (d: any) => Number(d?.donation_amount ?? d?.amount ?? 0);

  // ── Money ──
  const ticketRevenue   = paidTickets.reduce((s, t) => s + ticketPrice(t), 0);
  const donationRevenue = donations.reduce((s, d) => s + donationValue(d), 0);
  const shopRevenue     = orders.reduce((s, o) => s + Number(o?.total ?? 0), 0);
  const totalRevenue    = ticketRevenue + donationRevenue + shopRevenue;

  // ── 30-day series ──
  const signupSeries   = buildSeries(recentSignups, "created_at");
  const ticketSeries   = buildSeries(paidTickets, "created_at", ticketPrice);
  const donationSeries = buildSeries(donations, "created_at", donationValue);
  const shopSeries     = buildSeries(orders, "created_at", (o) => Number(o?.total ?? 0));
  const revenueSeries  = mergeSeries(ticketSeries, donationSeries, shopSeries);

  const revenue30 = revenueSeries.reduce((s, p) => s + p.value, 0);
  const signups30 = signupSeries.reduce((s, p) => s + p.value, 0);

  // ── Top events by REVENUE, not ticket count: 40 cheap tickets and 4
  //    expensive ones are not the same result, and only one of them pays. ──
  const revenueByEvent = new Map<string, number>();
  const countByEvent   = new Map<string, number>();
  for (const t of paidTickets) {
    const id = t?.event_id;
    if (!id) continue;
    revenueByEvent.set(id, (revenueByEvent.get(id) ?? 0) + ticketPrice(t));
    countByEvent.set(id, (countByEvent.get(id) ?? 0) + 1);
  }
  const eventRows = eventsList
    .map((e: any) => ({ id: e.id, title: e.title, revenue: revenueByEvent.get(e.id) ?? 0, count: countByEvent.get(e.id) ?? 0 }))
    .filter(e => e.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;

  const tiles = [
    { label: "TOTAL REVENUE",  value: peso(totalRevenue),    sub: `${peso(revenue30)} in last 30d`,                 color: "#1B3A2D", icon: <IconHeart size={16} color="#1B3A2D" /> },
    { label: "EVENT TICKETS",  value: peso(ticketRevenue),   sub: `${paidTickets.length.toLocaleString()} paid`,     color: "#156530", icon: <IconTicket size={16} color="#156530" /> },
    { label: "SHOP",           value: peso(shopRevenue),     sub: `${orders.length.toLocaleString()} paid orders`,   color: "#7A5A0F", icon: <IconCart size={16} color="#7A5A0F" /> },
    { label: "DONATIONS",      value: peso(donationRevenue), sub: `${donations.length.toLocaleString()} completed`,  color: "#B78A1F", icon: <IconHeart size={16} color="#B78A1F" /> },
    { label: "MEMBERS",        value: totalMembers.toLocaleString(), sub: `${signups30} new · 30d`,                  color: "#1A8040", icon: <IconUsers size={16} color="#1A8040" /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Re-render on any change to the tables these numbers come from.
          Requires supabase/migrations/realtime_analytics_tables.sql — without
          it the page still renders correct figures, it just won't self-update. */}
      <RealtimeRefresh tables={["profiles", "event_tickets", "donations", "orders"]} channel="super-analytics" />

      {/* Header */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div>
          <Link href="/super" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← COMMAND CENTER</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#156530", letterSpacing: "2.5px", marginTop: "4px" }}>ANALYTICS</h1>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#1A8040", background: "#E8F0E4", border: "1px solid #C7DFC7", borderRadius: "999px", padding: "6px 12px", letterSpacing: "1.3px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#1A8040", display: "inline-block" }} />
          LIVE
        </span>
      </div>

      {/* Stat tiles — money first, then members. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
        {tiles.map(t => (
          <div key={t.label} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "12px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: t.color + "12", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {t.icon}
              </div>
              <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: t.color, letterSpacing: "1.3px" }}>{t.label}</div>
            </div>
            <div style={{ fontFamily: R, fontSize: "1.5rem", color: "#1B3A2D", letterSpacing: "1px" }}>{t.value}</div>
            <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>{t.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts — one for money, one for growth. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
        <ChartCard title="REVENUE · 30D" value={peso(revenue30)} accent="#1B3A2D">
          <AnalyticsChart data={revenueSeries} color="#1A8040" variant="bar" valuePrefix="₱" />
        </ChartCard>
        <ChartCard title="MEMBER SIGNUPS · 30D" value={signups30.toLocaleString()} accent="#1A8040">
          <AnalyticsChart data={signupSeries} color="#156530" variant="line" />
        </ChartCard>
      </div>

      {/* Top events by revenue */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>TOP EVENTS BY REVENUE</div>
          <Link href="/admin/events" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1A8040", textDecoration: "none", letterSpacing: "1.2px" }}>VIEW ALL →</Link>
        </div>
        {eventRows.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>No paid ticket sales yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {eventRows.map((e, i) => {
              const max = eventRows[0]?.revenue ?? 1;
              const pct = Math.max(4, (e.revenue / max) * 100);
              return (
                <Link key={e.id} href={`/admin/events/${e.id}/tickets`} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: i === 0 ? "#F0F7EE" : "#F7FAF5", border: `1px solid ${i === 0 ? "#B7D8B7" : "#E4EDE4"}` }}>
                    <span style={{ fontFamily: R, fontSize: "13px", color: i === 0 ? "#1A8040" : "#5A7A60", letterSpacing: "1.5px", width: "24px" }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                      <div style={{ marginTop: "5px", height: "5px", background: "#E4EDE4", borderRadius: "999px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#1A8040", borderRadius: "999px" }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1px" }}>{peso(e.revenue)}</div>
                      <div style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A" }}>{e.count} ticket{e.count === 1 ? "" : "s"}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, value, accent, children }: { title: string; value: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: accent, letterSpacing: "1.5px" }}>{title}</div>
        <div style={{ fontFamily: R, fontSize: "1.1rem", color: "#1B3A2D", letterSpacing: "1px" }}>{value}</div>
      </div>
      {children}
    </div>
  );
}
