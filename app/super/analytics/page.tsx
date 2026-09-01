import { createAdminClient } from "@/lib/supabase/admin";
import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsChart from "@/components/super/AnalyticsCharts";
import { IconUsers, IconTicket, IconHeart, IconCart, IconStar } from "@/components/shared/Icons";

export const metadata: Metadata = { title: "Analytics" };
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
  // Seed all days with 0 so the chart draws even on empty ranges
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    counts.set(phDate(d), 0);
  }
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  for (const r of rows ?? []) {
    const ts = r?.[timeField];
    if (!ts) continue;
    const t = new Date(ts).getTime();
    if (t < cutoff) continue;
    const key = phDate(new Date(ts));
    if (!counts.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + aggregator(r));
  }
  return Array.from(counts.entries()).map(([day, value]) => ({ day, value }));
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

  const [
    membersRes,
    sponsorsRes,
    activeTicketsRes,
    totalEventsRes,
    signupsRes,
    ticketsRes,
    donationsRes,
    ordersRes,
    eventsListRes,
    allTicketsRes,
  ] = await Promise.all([
    safe(db.from("profiles").select("*", { count: "exact", head: true }) as any, { count: 0 } as any),
    safe(db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "sponsor") as any, { count: 0 } as any),
    safe((db as any).from("event_tickets").select("*", { count: "exact", head: true }).in("status", ["active", "used"]), { count: 0 } as any),
    safe((db as any).from("events").select("*", { count: "exact", head: true }), { count: 0 } as any),
    safe(db.from("profiles").select("created_at").gte("created_at", cutoffISO) as any, { data: [] } as any),
    safe((db as any).from("event_tickets").select("created_at, status").gte("created_at", cutoffISO).in("status", ["active", "used"]), { data: [] } as any),
    safe((db as any).from("donations").select("created_at, amount, donation_amount, status").eq("status", "completed"), { data: [] } as any),
    safe((db as any).from("orders").select("created_at, total, payment_status").eq("payment_status", "paid"), { data: [] } as any),
    safe((db as any).from("events").select("id, title").order("date", { ascending: false }).limit(50), { data: [] } as any),
    safe((db as any).from("event_tickets").select("event_id").in("status", ["active", "used"]), { data: [] } as any),
  ]);

  const totalMembers   = (membersRes as any).count as number | null;
  const sponsors       = (sponsorsRes as any).count as number | null;
  const activeTickets  = (activeTicketsRes as any).count as number | null;
  const totalEvents    = (totalEventsRes as any).count as number | null;
  const recentSignups  = (signupsRes as any).data as any[] | null;
  const recentTickets  = (ticketsRes as any).data as any[] | null;
  const donationsAll   = (donationsRes as any).data as any[] | null;
  const ordersAll      = (ordersRes as any).data as any[] | null;
  const eventsList     = (eventsListRes as any).data as any[] | null;
  const allTickets     = (allTicketsRes as any).data as any[] | null;

  // Ticket counts per event, computed in JS instead of via a fragile PostgREST
  // count-embed that requires an FK relationship the schema cache may not know about.
  const ticketsByEvent = new Map<string, number>();
  for (const t of allTickets ?? []) {
    const id = t?.event_id;
    if (!id) continue;
    ticketsByEvent.set(id, (ticketsByEvent.get(id) ?? 0) + 1);
  }
  const topEvents = (eventsList ?? []).map((e: any) => ({
    id: e.id, title: e.title, event_tickets: [{ count: ticketsByEvent.get(e.id) ?? 0 }],
  }));

  // 30-day series
  const signupSeries    = buildSeries(recentSignups as any[], "created_at");
  const ticketSeries    = buildSeries(recentTickets as any[], "created_at");
  const donationSeries  = buildSeries(donationsAll as any[], "created_at", (r) => Number(r?.donation_amount ?? r?.amount ?? 0));
  const orderSeries     = buildSeries(ordersAll as any[], "created_at", (r) => Number(r?.total ?? 0));

  // Totals
  const donationTotal = (donationsAll ?? []).reduce((sum: number, r: any) => sum + Number(r?.donation_amount ?? r?.amount ?? 0), 0);
  const orderRevenue  = (ordersAll ?? []).reduce((sum: number, r: any) => sum + Number(r?.total ?? 0), 0);
  const signups30     = signupSeries.reduce((s, p) => s + p.value, 0);
  const tickets30     = ticketSeries.reduce((s, p) => s + p.value, 0);

  // Top events leaderboard
  const eventRows = ((topEvents ?? []) as any[])
    .map(e => ({ id: e.id, title: e.title, count: Array.isArray(e.event_tickets) && e.event_tickets[0]?.count != null ? Number(e.event_tickets[0].count) : 0 }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;

  const tiles = [
    { label: "TOTAL MEMBERS",   value: (totalMembers ?? 0).toLocaleString(),   sub: `${signups30} new · 30d`,  color: "#1B3A2D", icon: <IconUsers size={16} color="#1B3A2D" /> },
    { label: "SPONSORS",         value: (sponsors ?? 0).toLocaleString(),       sub: "supporters",                color: "#1A8040", icon: <IconStar size={16} color="#1A8040" /> },
    { label: "ACTIVE TICKETS",   value: (activeTickets ?? 0).toLocaleString(),  sub: `${tickets30} sold · 30d`,   color: "#156530", icon: <IconTicket size={16} color="#156530" /> },
    { label: "DONATIONS TOTAL",  value: peso(donationTotal),                    sub: "all time",                  color: "#B78A1F", icon: <IconHeart size={16} color="#B78A1F" /> },
    { label: "ORDER REVENUE",    value: peso(orderRevenue),                     sub: "all time",                  color: "#7A5A0F", icon: <IconCart size={16} color="#7A5A0F" /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div>
          <Link href="/super" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← COMMAND CENTER</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#156530", letterSpacing: "2.5px", marginTop: "4px" }}>ANALYTICS</h1>
          <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "2px" }}>Read-only insight into growth, revenue, and activity. 30-day trends.</p>
        </div>
      </div>

      {/* Stat tiles */}
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

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
        <ChartCard title="MEMBER SIGNUPS · 30D" value={signups30.toLocaleString()} accent="#1B3A2D">
          <AnalyticsChart data={signupSeries} color="#1A8040" variant="line" />
        </ChartCard>
        <ChartCard title="TICKET SALES · 30D" value={tickets30.toLocaleString()} accent="#156530">
          <AnalyticsChart data={ticketSeries} color="#156530" variant="bar" />
        </ChartCard>
        <ChartCard title="DONATIONS · 30D" value={peso(donationSeries.reduce((s, p) => s + p.value, 0))} accent="#B78A1F">
          <AnalyticsChart data={donationSeries} color="#B78A1F" variant="bar" valuePrefix="₱" />
        </ChartCard>
        <ChartCard title="ORDER REVENUE · 30D" value={peso(orderSeries.reduce((s, p) => s + p.value, 0))} accent="#7A5A0F">
          <AnalyticsChart data={orderSeries} color="#7A5A0F" variant="bar" valuePrefix="₱" />
        </ChartCard>
      </div>

      {/* Top events leaderboard */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>TOP EVENTS BY TICKETS SOLD</div>
          <Link href="/admin/events" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1A8040", textDecoration: "none", letterSpacing: "1.2px" }}>VIEW ALL →</Link>
        </div>
        {eventRows.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>No ticket sales yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {eventRows.map((e, i) => {
              const max = eventRows[0]?.count ?? 1;
              const pct = Math.max(4, (e.count / max) * 100);
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
                    <span style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1px" }}>{e.count.toLocaleString()}</span>
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
