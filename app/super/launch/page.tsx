import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteSettings } from "@/lib/site-settings";
import MaintenanceToggle from "./MaintenanceToggle";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

// One-glance launch-day dashboard. Everything you need if something goes
// wrong during a public rollout is on this page:
//   - Maintenance mode toggle (kill switch — flip if the site is on fire)
//   - Today's signups + purchases + revenue (is anything actually happening?)
//   - Recent activity feed (what are people doing, right now)
//   - Pending tickets (any abandoned checkouts to clean up)
//   - Recent refund requests (buyers unhappy)
//
// Everything links back to the full detail page so you can drill in.
export default async function LaunchDashboardPage() {
  const db = createAdminClient();
  const settings = await getSiteSettings();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Everything wrapped so one failing query doesn't nuke the dashboard.
  const safe = async <T,>(p: any, fallback: T): Promise<T> => {
    try { const r = await p; return r?.error ? fallback : (r as unknown as T); } catch { return fallback; }
  };

  const [signupsToday, ticketsToday, ordersToday, donationsToday, recentActivity, pendingCount, pendingRefunds] = await Promise.all([
    safe((db.from("audit_log") as any).select("*", { count: "exact", head: true }).eq("action", "signup").gte("created_at", todayISO), { count: 0 } as any),
    safe((db.from("audit_log") as any).select("*", { count: "exact", head: true }).in("action", ["purchase_ticket", "register_event"]).gte("created_at", todayISO), { count: 0 } as any),
    safe((db.from("audit_log") as any).select("*", { count: "exact", head: true }).eq("action", "place_order").gte("created_at", todayISO), { count: 0 } as any),
    safe((db.from("donations") as any).select("amount, donation_amount", { count: "exact" }).eq("status", "completed").gte("created_at", todayISO), { data: [], count: 0 } as any),
    safe((db.from("audit_log") as any)
      .select("id, action, user_id, created_at, details, profiles:user_id(display_name, avatar_url)")
      .not("action", "eq", "visit_page")
      .order("created_at", { ascending: false })
      .limit(15), { data: [] } as any),
    safe((db.from("event_tickets") as any).select("*", { count: "exact", head: true }).eq("status", "pending_payment"), { count: 0 } as any),
    safe((db.from("refunds") as any).select("*", { count: "exact", head: true }).eq("status", "pending"), { count: 0 } as any),
  ]);

  const donationRevenue = (donationsToday.data ?? []).reduce((s: number, r: any) => s + Number(r?.donation_amount ?? r?.amount ?? 0), 0);
  const maintenanceOn = !!settings?.maintenance_mode;
  const announcementOn = !!settings?.announcement_active && !!settings?.announcement_text?.trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", margin: 0 }}>LAUNCH DAY</h1>
        <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "4px 0 0" }}>
          One page, everything you need to watch and intervene during a public rollout.
        </p>
      </div>

      {/* KILL SWITCH */}
      <MaintenanceToggle initialOn={maintenanceOn} />

      {/* TODAY'S NUMBERS */}
      <div>
        <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginBottom: "10px" }}>TODAY (since midnight PHT)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
          <Tile label="New signups"     value={String((signupsToday as any).count ?? 0)} color="#1E4A7A" bg="#E4EEF8" />
          <Tile label="Ticket purchases" value={String((ticketsToday as any).count ?? 0)} color="#7A5A0F" bg="#FFF3D6" />
          <Tile label="Shop orders"      value={String((ordersToday as any).count ?? 0)} color="#5A1E7A" bg="#F0E4F8" />
          <Tile label="Donations (₱)"    value={`₱${Math.round(donationRevenue).toLocaleString()}`} color="#CC3344" bg="#FFE8EC" />
        </div>
      </div>

      {/* NEEDS ATTENTION */}
      <div>
        <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginBottom: "10px" }}>NEEDS ATTENTION</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
          <ActionCard href="/super/tickets-cleanup" title="Pending tickets" count={(pendingCount as any).count ?? 0} note="Abandoned checkouts. Auto-cleanup runs hourly; use this to force a sweep." />
          <ActionCard href="/admin/refunds" title="Pending refunds" count={(pendingRefunds as any).count ?? 0} note="Buyer-initiated or admin-created refund requests waiting for PayMongo action." />
          <ActionCard href="/super/audit" title="Full activity log" count={null} note="Every login, purchase, comment, admin action — filtered and searchable." />
          <ActionCard href="/super/finance" title="Financials" count={null} note="Combined revenue from tickets, donations, orders with date range." />
        </div>
      </div>

      {/* SITE STATE */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 20px", display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
        <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginRight: "8px" }}>SITE STATE</div>
        <StatusChip on={!maintenanceOn} onLabel="LIVE" offLabel="MAINTENANCE" />
        <StatusChip on={announcementOn} onLabel="BANNER LIVE" offLabel="NO BANNER" />
      </div>

      {/* RECENT ACTIVITY (last 15, excluding page-view noise) */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", background: "#F7FAF5", borderBottom: "1px solid #E4EDE4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>LATEST ACTIVITY · LAST 15</div>
          <Link href="/super/audit" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1A8040", textDecoration: "none", letterSpacing: "1.2px" }}>OPEN FULL LOG →</Link>
        </div>
        {((recentActivity as any).data ?? []).length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>Nothing yet.</div>
        ) : (
          ((recentActivity as any).data as any[]).map((row, i) => (
            <div key={row.id} style={{ padding: "10px 18px", borderTop: i === 0 ? "none" : "1px solid #F0F5F0", display: "flex", gap: "10px", alignItems: "center", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#E8F0E4", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {row.profiles?.avatar_url
                  ? <img src={row.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1A8040" }}>{(row.profiles?.display_name ?? "?")[0]?.toUpperCase() ?? "?"}</span>}
              </div>
              <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <strong>{row.profiles?.display_name ?? "Someone"}</strong>{" "}
                <span style={{ color: "#4A7C59" }}>{row.action.replace(/_/g, " ")}</span>
              </span>
              <span style={{ fontFamily: SG, fontSize: "10px", color: "#7A8E7A", letterSpacing: "1px", flexShrink: 0 }}>
                {timeAgo(row.created_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function Tile({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "12px", padding: "14px 16px" }}>
      <div style={{ display: "inline-block", fontFamily: SG, fontSize: "9px", fontWeight: 700, color, background: bg, borderRadius: "999px", padding: "2px 8px", letterSpacing: "1px" }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "0.5px", marginTop: "8px" }}>{value}</div>
    </div>
  );
}

function ActionCard({ href, title, count, note }: { href: string; title: string; count: number | null; note: string }) {
  const highlighted = typeof count === "number" && count > 0;
  return (
    <Link href={href} style={{ textDecoration: "none", background: highlighted ? "#FFFDF4" : "#ffffff", border: `1.5px solid ${highlighted ? "#F0D889" : "#DDE8DD"}`, borderRadius: "12px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "1.5px" }}>{title.toUpperCase()}</span>
        {typeof count === "number" && (
          <span style={{ fontFamily: R, fontSize: "13px", color: highlighted ? "#7A5A0F" : "#7A8E7A", letterSpacing: "0.5px" }}>{count}</span>
        )}
      </div>
      <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", lineHeight: 1.5 }}>{note}</div>
    </Link>
  );
}

function StatusChip({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  const color = on ? "#156530" : "#8A1E27";
  const bg = on ? "#E8F0E4" : "#FFE8EC";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "10px", fontWeight: 700, color, background: bg, borderRadius: "999px", padding: "4px 10px", letterSpacing: "1.2px" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }} />
      {on ? onLabel : offLabel}
    </span>
  );
}
