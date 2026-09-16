import { createAdminClient } from "@/lib/supabase/admin";
import type { Metadata } from "next";
import Link from "next/link";
import dynamicImport from "next/dynamic";
import RealtimeRefresh from "@/components/shared/RealtimeRefresh";
import { IconUsers, IconTicket, IconHeart, IconCart, IconCheck, IconStar } from "@/components/shared/Icons";

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

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

// ─── HELPERS ────────────────────────────────────────────────────────────────

/** Returns yyyy-mm-dd for a given Date in PHT. */
function phDate(d: Date): string {
  const pht = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return pht.toISOString().slice(0, 10);
}

function buildSeries(
  rows: any[] | null | undefined,
  timeField: string,
  aggregator: (row: any) => number = () => 1,
  days = WINDOW_DAYS,
): { day: string; value: number }[] {
  const counts = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) counts.set(phDate(new Date(today.getTime() - i * DAY)), 0);
  const cutoff = Date.now() - days * DAY;
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

function mergeSeries(...series: { day: string; value: number }[][]) {
  const out = new Map<string, number>();
  for (const s of series) for (const p of s) out.set(p.day, (out.get(p.day) ?? 0) + p.value);
  return Array.from(out.entries()).map(([day, value]) => ({ day, value }));
}

/**
 * Sum rows landing inside a window measured in days-ago.
 * windowed(rows, "created_at", v, 0, 30)  -> the last 30 days
 * windowed(rows, "created_at", v, 30, 60) -> the 30 days before that
 */
function windowed(rows: any[], timeField: string, value: (r: any) => number, fromDaysAgo: number, toDaysAgo: number) {
  const now = Date.now();
  const newest = now - fromDaysAgo * DAY;
  const oldest = now - toDaysAgo * DAY;
  let sum = 0;
  for (const r of rows) {
    const ts = r?.[timeField];
    if (!ts) continue;
    const t = new Date(ts).getTime();
    if (t > oldest && t <= newest) sum += value(r);
  }
  return sum;
}

/** Percentage change, or null when there's no prior baseline to compare to. */
function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}

const pct  = (n: number) => `${n.toFixed(n >= 10 || n === 0 ? 0 : 1)}%`;
const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;

// ─── PAGE ───────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const db = createAdminClient();
  const sixtyDaysAgo = new Date(Date.now() - 2 * WINDOW_DAYS * DAY).toISOString();

  // Every query is wrapped so a single failure doesn't nuke the entire dashboard.
  // Missing / errored data just renders as zero.
  const safe = async <T,>(p: Promise<{ data: any; count?: number | null; error: any }>, fallback: T): Promise<T> => {
    try {
      const r = await p;
      if (r.error) return fallback;
      return r as unknown as T;
    } catch { return fallback; }
  };

  // The `donations` table is deliberately NOT queried. Donations have not
  // launched on this site, and the table holds only seed rows (6, all dated
  // 2026-06-16) whose PayMongo link refs are from a dev session. Counting them
  // reported revenue that never happened. The rows are left untouched in the
  // database — this is a reporting decision, not a deletion. The DONATIONS tile
  // renders a hardcoded zero; wire it to a real sum when donations go live.
  const [membersRes, signupsRes, ticketsRes, ordersRes, eventsRes] = await Promise.all([
    safe(db.from("profiles").select("*", { count: "exact", head: true }) as any, { count: 0 } as any),
    // 60 days, not 30 — the previous-period comparison needs the older window too.
    safe(db.from("profiles").select("created_at").gte("created_at", sixtyDaysAgo) as any, { data: [] } as any),
    // Every ticket, not just paid: check-in rate and free/paid mix need the rest.
    // event_tickets carries no amount column — a ticket's price lives on its
    // tier, so revenue has to come through this embed.
    safe((db as any).from("event_tickets")
      .select("created_at, event_id, user_id, payment_status, checked_in_at, event_tiers(price)"), { data: [] } as any),
    safe((db as any).from("orders").select("created_at, total, user_id, payment_status").eq("payment_status", "paid"), { data: [] } as any),
    safe((db as any).from("events").select("id, title, capacity, date").order("date", { ascending: false }).limit(100), { data: [] } as any),
  ]);

  const totalMembers  = ((membersRes as any).count as number | null) ?? 0;
  const signupRows    = ((signupsRes as any).data as any[] | null) ?? [];
  const allTickets    = ((ticketsRes as any).data as any[] | null) ?? [];
  const orders        = ((ordersRes as any).data as any[] | null) ?? [];
  const eventsList    = ((eventsRes as any).data as any[] | null) ?? [];

  const ticketPrice = (t: any) => Number(t?.event_tiers?.price ?? 0);
  const orderTotal  = (o: any) => Number(o?.total ?? 0);

  const paidTickets  = allTickets.filter(t => t.payment_status === "paid");
  // "Issued" = a ticket that entitles entry. Failed/cancelled ones never did,
  // so including them would understate the check-in rate.
  const issuedTickets = allTickets.filter(t => t.payment_status === "paid" || t.payment_status === "free");
  const checkedIn     = issuedTickets.filter(t => !!t.checked_in_at);

  // ── Money ──
  const ticketRevenue = paidTickets.reduce((s, t) => s + ticketPrice(t), 0);
  const shopRevenue   = orders.reduce((s, o) => s + orderTotal(o), 0);
  const totalRevenue  = ticketRevenue + shopRevenue;

  // ── Period over period (last 30d vs the 30d before it) ──
  const rev30    = windowed(paidTickets, "created_at", ticketPrice, 0, 30) + windowed(orders, "created_at", orderTotal, 0, 30);
  const revPrev  = windowed(paidTickets, "created_at", ticketPrice, 30, 60) + windowed(orders, "created_at", orderTotal, 30, 60);
  const new30    = windowed(signupRows, "created_at", () => 1, 0, 30);
  const newPrev  = windowed(signupRows, "created_at", () => 1, 30, 60);
  const tix30    = windowed(paidTickets, "created_at", () => 1, 0, 30);
  const tixPrev  = windowed(paidTickets, "created_at", () => 1, 30, 60);

  // ── Engagement ──
  const buyerCounts = new Map<string, number>();
  for (const t of paidTickets) if (t.user_id) buyerCounts.set(t.user_id, (buyerCounts.get(t.user_id) ?? 0) + 1);
  for (const o of orders)      if (o.user_id) buyerCounts.set(o.user_id, (buyerCounts.get(o.user_id) ?? 0) + 1);

  const uniqueBuyers  = buyerCounts.size;
  const repeatBuyers  = Array.from(buyerCounts.values()).filter(n => n > 1).length;
  const conversion    = totalMembers > 0 ? (uniqueBuyers / totalMembers) * 100 : 0;
  const repeatRate    = uniqueBuyers > 0 ? (repeatBuyers / uniqueBuyers) * 100 : 0;
  const checkInRate   = issuedTickets.length > 0 ? (checkedIn.length / issuedTickets.length) * 100 : 0;
  const avgTicket     = paidTickets.length > 0 ? ticketRevenue / paidTickets.length : 0;
  const arpu          = totalMembers > 0 ? totalRevenue / totalMembers : 0;

  // ── Series ──
  const signupSeries  = buildSeries(signupRows, "created_at");
  const revenueSeries = mergeSeries(
    buildSeries(paidTickets, "created_at", ticketPrice),
    buildSeries(orders, "created_at", orderTotal),
  );

  // ── Per-event performance: revenue, sell-through, attendance ──
  const byEvent = new Map<string, { revenue: number; paid: number; issued: number; checkedIn: number }>();
  for (const t of allTickets) {
    const id = t?.event_id;
    if (!id) continue;
    const e = byEvent.get(id) ?? { revenue: 0, paid: 0, issued: 0, checkedIn: 0 };
    if (t.payment_status === "paid") { e.revenue += ticketPrice(t); e.paid += 1; }
    if (t.payment_status === "paid" || t.payment_status === "free") {
      e.issued += 1;
      if (t.checked_in_at) e.checkedIn += 1;
    }
    byEvent.set(id, e);
  }
  const eventRows = eventsList
    .map((e: any) => {
      const s = byEvent.get(e.id) ?? { revenue: 0, paid: 0, issued: 0, checkedIn: 0 };
      const cap = Number(e.capacity ?? 0);
      return {
        id: e.id,
        title: e.title,
        revenue: s.revenue,
        paid: s.paid,
        issued: s.issued,
        // Null rather than 0 when capacity isn't set — "unknown" and "nobody
        // came" are different facts and shouldn't render identically.
        sellThrough: cap > 0 ? Math.min(100, (s.issued / cap) * 100) : null,
        checkIn: s.issued > 0 ? (s.checkedIn / s.issued) * 100 : null,
      };
    })
    .filter(e => e.issued > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const money = [
    { label: "TOTAL REVENUE", value: peso(totalRevenue),  sub: `${peso(rev30)} last 30d`,                         delta: pctChange(rev30, revPrev), color: "#1B3A2D", icon: <IconStar size={16} color="#1B3A2D" /> },
    { label: "EVENT TICKETS", value: peso(ticketRevenue), sub: `${paidTickets.length.toLocaleString()} paid`,      delta: pctChange(tix30, tixPrev),  color: "#156530", icon: <IconTicket size={16} color="#156530" /> },
    { label: "SHOP",          value: peso(shopRevenue),   sub: `${orders.length.toLocaleString()} paid orders`,    delta: null,                       color: "#7A5A0F", icon: <IconCart size={16} color="#7A5A0F" /> },
    // Donations have not launched — a deliberate zero, not an oversight.
    { label: "DONATIONS",     value: peso(0),             sub: "not launched yet",                                 delta: null,                       color: "#B78A1F", icon: <IconHeart size={16} color="#B78A1F" /> },
  ];

  const health = [
    { label: "MEMBERS",        value: totalMembers.toLocaleString(), sub: `${new30} new last 30d`,                                   delta: pctChange(new30, newPrev), color: "#1A8040", icon: <IconUsers size={16} color="#1A8040" /> },
    { label: "MEMBER → BUYER", value: pct(conversion),               sub: `${uniqueBuyers} of ${totalMembers} ever paid`,            delta: null,                      color: "#156530", icon: <IconUsers size={16} color="#156530" /> },
    { label: "REPEAT BUYERS",  value: pct(repeatRate),               sub: `${repeatBuyers} bought more than once`,                   delta: null,                      color: "#4A7C59", icon: <IconStar size={16} color="#4A7C59" /> },
    { label: "CHECK-IN RATE",  value: pct(checkInRate),              sub: `${checkedIn.length} of ${issuedTickets.length} attended`, delta: null,                      color: "#1B3A2D", icon: <IconCheck size={16} color="#1B3A2D" /> },
    { label: "AVG TICKET",     value: peso(avgTicket),               sub: `${peso(arpu)} revenue per member`,                        delta: null,                      color: "#7A5A0F", icon: <IconTicket size={16} color="#7A5A0F" /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <RealtimeRefresh tables={["profiles", "event_tickets", "orders"]} channel="super-analytics" />

      {/* Header */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div>
          <Link href="/super" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← COMMAND CENTER</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#156530", letterSpacing: "2.5px", marginTop: "4px" }}>ANALYTICS</h1>
          <p style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", marginTop: "2px" }}>Deltas compare the last 30 days with the 30 before it.</p>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#1A8040", background: "#E8F0E4", border: "1px solid #C7DFC7", borderRadius: "999px", padding: "6px 12px", letterSpacing: "1.3px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#1A8040", display: "inline-block" }} />
          LIVE
        </span>
      </div>

      <SectionLabel>REVENUE</SectionLabel>
      <TileRow tiles={money} />

      <SectionLabel>AUDIENCE &amp; CONVERSION</SectionLabel>
      <TileRow tiles={health} />

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
        <ChartCard title="REVENUE · 30D" value={peso(rev30)} accent="#1B3A2D">
          <AnalyticsChart data={revenueSeries} color="#1A8040" variant="bar" valuePrefix="₱" />
        </ChartCard>
        <ChartCard title="MEMBER SIGNUPS · 30D" value={new30.toLocaleString()} accent="#1A8040">
          <AnalyticsChart data={signupSeries} color="#156530" variant="line" />
        </ChartCard>
      </div>

      {/* Event performance — revenue alone doesn't say whether an event went
          well. Sell-through shows whether it was priced/sized right, check-in
          shows whether the people who paid actually turned up. */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>EVENT PERFORMANCE</div>
          <Link href="/admin/events" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1A8040", textDecoration: "none", letterSpacing: "1.2px" }}>VIEW ALL →</Link>
        </div>

        {eventRows.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>No ticketed events yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {eventRows.map((e, i) => {
              const max = eventRows[0]?.revenue || 1;
              const barPct = Math.max(3, (e.revenue / max) * 100);
              return (
                <Link key={e.id} href={`/admin/events/${e.id}/tickets`} style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 12px", borderRadius: "10px", background: i === 0 ? "#F0F7EE" : "#F7FAF5", border: `1px solid ${i === 0 ? "#B7D8B7" : "#E4EDE4"}`, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: R, fontSize: "13px", color: i === 0 ? "#1A8040" : "#5A7A60", letterSpacing: "1.5px", width: "24px" }}>#{i + 1}</span>

                    <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                      <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                      <div style={{ marginTop: "5px", height: "5px", background: "#E4EDE4", borderRadius: "999px", overflow: "hidden" }}>
                        <div style={{ width: `${barPct}%`, height: "100%", background: "#1A8040", borderRadius: "999px" }} />
                      </div>
                    </div>

                    <MiniStat label="TICKETS"  value={e.issued.toLocaleString()} />
                    <MiniStat label="SELL-THRU" value={e.sellThrough === null ? "—" : pct(e.sellThrough)} muted={e.sellThrough === null} />
                    <MiniStat label="CHECK-IN"  value={e.checkIn === null ? "—" : pct(e.checkIn)} muted={e.checkIn === null} />

                    <div style={{ textAlign: "right", minWidth: "96px" }}>
                      <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1px" }}>{peso(e.revenue)}</div>
                      <div style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A" }}>{e.paid} paid</div>
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

// ─── PRESENTATION ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.8px", marginBottom: "-6px" }}>
      {children}
    </div>
  );
}

type Tile = { label: string; value: string; sub: string; delta: number | null; color: string; icon: React.ReactNode };

function TileRow({ tiles }: { tiles: Tile[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
      {tiles.map(t => (
        <div key={t.label} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "12px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: t.color + "12", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {t.icon}
            </div>
            <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: t.color, letterSpacing: "1.3px" }}>{t.label}</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
            <div style={{ fontFamily: R, fontSize: "1.5rem", color: "#1B3A2D", letterSpacing: "1px" }}>{t.value}</div>
            <DeltaBadge delta={t.delta} />
          </div>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>{t.sub}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * null means "no baseline" — either the previous period had nothing to compare
 * against, or the metric isn't time-windowed. Rendering nothing is honest;
 * rendering "+100%" or "0%" would invent a trend that isn't there.
 */
function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const up = delta >= 0;
  const flat = Math.abs(delta) < 0.5;
  const color = flat ? "#7A8E7A" : up ? "#1A8040" : "#CC3344";
  const bg    = flat ? "#F2F7F2" : up ? "#E8F0E4" : "#FFF0F2";
  return (
    <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color, background: bg, border: `1px solid ${color}33`, borderRadius: "999px", padding: "2px 8px", letterSpacing: "0.8px", whiteSpace: "nowrap" }}>
      {flat ? "—" : `${up ? "▲" : "▼"} ${Math.abs(delta).toFixed(0)}%`}
    </span>
  );
}

function MiniStat({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ textAlign: "center", minWidth: "64px" }}>
      <div style={{ fontFamily: R, fontSize: "13px", color: muted ? "#A8BCA8" : "#1B3A2D", letterSpacing: "0.5px" }}>{value}</div>
      <div style={{ fontFamily: SG, fontSize: "8px", fontWeight: 700, color: "#7A8E7A", letterSpacing: "1.1px" }}>{label}</div>
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
