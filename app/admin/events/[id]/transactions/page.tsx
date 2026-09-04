"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SkListLoading } from "@/components/shared/Skeleton";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

type Outcome = "paid" | "pending" | "abandoned" | "failed" | "cancelled" | "comp";
type Txn = {
  ref: string;
  outcome: Outcome;
  bundle_size: number;
  tier_name: string;
  buyer: { user_id: string; name: string | null; email: string | null };
  amount: number;
  currency: string;
  method: string | null;
  payment_link_id: string | null;
  txn_status: string | null;
  created_at: string;
  paid_at: string | null;
  ticket_ids: string[];
};
type Summary = { total: number; paid: number; pending: number; abandoned: number; failed: number; cancelled: number; comp: number; revenue: number };

const OUTCOME_META: Record<Outcome, { label: string; color: string; bg: string; border: string; note: string }> = {
  paid:      { label: "PAID",       color: "#1A8040", bg: "#E8F0E4", border: "#1A8040", note: "Payment confirmed via webhook." },
  pending:   { label: "PENDING",    color: "#B0731A", bg: "#FFF3D6", border: "#E5B547", note: "Awaiting PayMongo webhook (< 15 min old)." },
  abandoned: { label: "ABANDONED",  color: "#8A6212", bg: "#FFEBC5", border: "#D9A34A", note: "No webhook received after 15 min — buyer likely closed the tab." },
  failed:    { label: "FAILED",     color: "#CC3344", bg: "#FFE8EC", border: "#CC3344", note: "PayMongo returned failed status." },
  cancelled: { label: "CANCELLED",  color: "#5A7A60", bg: "#E4EDE4", border: "#5A7A60", note: "Ticket was cancelled by admin or cleanup cron." },
  comp:      { label: "COMP",       color: "#0F7A5C", bg: "#DCF3E9", border: "#0F7A5C", note: "Complimentary ticket issued by admin — no payment attempted." },
};

const FILTERS: Array<{ key: "all" | Outcome; label: string }> = [
  { key: "all", label: "ALL" },
  { key: "paid", label: "PAID" },
  { key: "pending", label: "PENDING" },
  { key: "abandoned", label: "ABANDONED" },
  { key: "failed", label: "FAILED" },
  { key: "cancelled", label: "CANCELLED" },
  { key: "comp", label: "COMP" },
];

export default function EventTransactionsPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const [data, setData] = useState<{ transactions: Txn[]; summary: Summary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function load(silent = false) {
    if (!silent) setLoading(true); else setRefreshing(true);
    const res = await fetch(`/api/admin/events/${eventId}/transactions`, { cache: "no-store" });
    if (res.ok) {
      setData(await res.json());
      setLastFetched(new Date());
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [eventId]);
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => load(true), 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, eventId]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.transactions;
    return data.transactions.filter(t => t.outcome === filter);
  }, [data, filter]);

  if (loading) return <SkListLoading />;
  if (!data) return <div style={{ padding: 32, textAlign: "center", fontFamily: B, color: "#5A7A60" }}>Failed to load transactions.</div>;

  const s = data.summary;
  const conversion = s.total > 0 ? Math.round((s.paid / (s.paid + s.pending + s.abandoned + s.failed)) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <Link href={`/admin/events/${eventId}/tickets`} style={{ fontFamily: B, fontSize: 12, color: "#5A7A60", textDecoration: "none" }}>← Tickets</Link>
          <h1 style={{ fontFamily: S, fontSize: "1.8rem", color: "#1B3A2D", margin: "4px 0 2px" }}>Transaction Timeline</h1>
          <p style={{ fontFamily: B, fontSize: 13, color: "#5A7A60", margin: 0 }}>Every payment attempt — paid, pending, abandoned, failed.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: B, fontSize: 12, color: "#5A7A60" }}>
          {lastFetched && <span>Updated {lastFetched.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ fontFamily: R, fontSize: 10, letterSpacing: 1.5, background: "#FFFFFF", color: "#1B3A2D", border: "1.5px solid #DDE8DD", borderRadius: 20, padding: "6px 14px", cursor: refreshing ? "wait" : "pointer" }}
          >
            {refreshing ? "REFRESHING…" : "REFRESH NOW"}
          </button>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            <span style={{ fontSize: 11 }}>auto (30s)</span>
          </label>
        </div>
      </div>

      {/* Summary strip */}
      <div className="sk-stat-grid">
        <SummaryCard label="TOTAL"     value={s.total}     color="#1B3A2D" />
        <SummaryCard label="PAID"      value={s.paid}      color="#1A8040" />
        <SummaryCard label="PENDING"   value={s.pending}   color="#B0731A" />
        <SummaryCard label="ABANDONED" value={s.abandoned} color="#8A6212" />
      </div>
      <div className="sk-stat-grid">
        <SummaryCard label="FAILED"    value={s.failed}    color="#CC3344" />
        <SummaryCard label="CANCELLED" value={s.cancelled} color="#5A7A60" />
        <SummaryCard label="COMP"      value={s.comp}      color="#0F7A5C" />
        <SummaryCard label="REVENUE"   value={`₱${s.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} color="#1A8040" small />
      </div>
      <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 12, padding: "10px 14px", fontFamily: B, fontSize: 12, color: "#5A7A60", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>Conversion: <strong style={{ color: "#1B3A2D" }}>{conversion}%</strong> of attempts became paid tickets.</span>
        <span>Abandoned = pending for &gt; 15 min without webhook.</span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const count = f.key === "all" ? s.total : (s as any)[f.key] ?? 0;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                fontFamily: R, fontSize: 10, letterSpacing: 1.5,
                background: active ? "#1B3A2D" : "#FFFFFF",
                color: active ? "#FFFFFF" : "#1B3A2D",
                border: "1.5px solid #1B3A2D",
                borderRadius: 20, padding: "6px 12px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {f.label} <span style={{ background: active ? "#FFFFFF20" : "#F2F7F0", padding: "1px 6px", borderRadius: 10 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8DD", borderRadius: 12, padding: 32, textAlign: "center", fontFamily: B, color: "#5A7A60" }}>
          No transactions match this filter.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(t => <TxnRow key={t.ref} t={t} />)}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color, small = false }: { label: string; value: number | string; color: string; small?: boolean }) {
  return (
    <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: 10, padding: "14px 12px" }}>
      <div style={{ fontFamily: R, fontSize: small ? "1.1rem" : "1.6rem", color, letterSpacing: 1, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontFamily: B, fontSize: 10, color: "#5A7A60", letterSpacing: 1.2, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function TxnRow({ t }: { t: Txn }) {
  const m = OUTCOME_META[t.outcome];
  const created = new Date(t.created_at);
  const timeStr = created.toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" });
  const paidStr = t.paid_at ? new Date(t.paid_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" }) : null;
  return (
    <div style={{ background: "#FFFFFF", border: `1.5px solid ${m.border}40`, borderLeft: `4px solid ${m.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: R, fontSize: 13, color: "#1B3A2D", letterSpacing: 0.5 }}>{t.buyer.name ?? "—"}</div>
          <div style={{ fontFamily: B, fontSize: 11, color: "#7A8E7A" }}>{t.buyer.email ?? "—"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: R, fontSize: 14, color: "#1B3A2D" }}>₱{t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
          <div style={{ fontFamily: B, fontSize: 10, color: "#7A8E7A", letterSpacing: 1 }}>{(t.method ?? "—").toString().toUpperCase().replace(/_/g, " ")}</div>
        </div>
        <div>
          <span style={{ display: "inline-block", background: m.bg, color: m.color, border: `1px solid ${m.border}`, borderRadius: 20, padding: "3px 10px", fontFamily: R, fontSize: 10, letterSpacing: 1.5 }}>{m.label}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontFamily: "'Courier New',monospace", fontSize: 11, color: "#5A7A60" }}>
        <span>{t.bundle_size > 1 ? `Bundle × ${t.bundle_size}` : "Solo"} · {t.tier_name}</span>
        <span>Started: {timeStr}</span>
        {paidStr && <span style={{ color: "#1A8040" }}>Paid: {paidStr}</span>}
        {t.payment_link_id && <span title="PayMongo link ID">Link: {t.payment_link_id.slice(0, 18)}…</span>}
      </div>
      <div style={{ fontFamily: B, fontSize: 11, color: "#7A8E7A", fontStyle: "italic" }}>{m.note}</div>
    </div>
  );
}
