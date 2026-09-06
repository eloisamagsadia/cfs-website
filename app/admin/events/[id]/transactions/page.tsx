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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

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
    const q = search.trim().toLowerCase();
    return data.transactions.filter(t => {
      if (filter !== "all" && t.outcome !== filter) return false;
      if (!q) return true;
      return (
        (t.buyer.name ?? "").toLowerCase().includes(q) ||
        (t.buyer.email ?? "").toLowerCase().includes(q) ||
        (t.tier_name ?? "").toLowerCase().includes(q) ||
        (t.payment_link_id ?? "").toLowerCase().includes(q) ||
        (t.ref ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, filter, search]);

  // Reset to page 0 whenever the filter or search changes — otherwise
  // a user on page 5 with a filter that yields 3 rows lands on empty.
  useEffect(() => { setPage(0); }, [filter, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  if (loading) return <SkListLoading />;
  if (!data) return <div style={{ padding: 32, textAlign: "center", fontFamily: B, color: "#5A7A60" }}>Failed to load transactions.</div>;

  const s = data.summary;
  // Conversion = paid / (paid + pending + abandoned + failed). Comp
  // tickets aren't payment attempts, so they're excluded. When the
  // denominator is 0 (all-comp events, or no attempts yet), show "—"
  // instead of NaN%.
  const attempts = s.paid + s.pending + s.abandoned + s.failed;
  const conversionLabel = attempts > 0 ? `${Math.round((s.paid / attempts) * 100)}%` : "—";

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
        <span>Conversion: <strong style={{ color: "#1B3A2D" }}>{conversionLabel}</strong>{attempts > 0 ? " of attempts became paid tickets." : " — no real payment attempts yet."}</span>
        <span>Abandoned = pending for &gt; 15 min without webhook.</span>
      </div>

      {/* Filter tabs + search */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name / email / tier / ref…"
          style={{ flex: 1, minWidth: 220, background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 20, padding: "6px 14px", color: "#1B3A2D", fontFamily: B, fontSize: 12, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "#F7FAF5", borderBottom: "1px solid #EDF2ED", fontFamily: R, fontSize: 10, color: "#5A7A60", letterSpacing: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{filtered.length} · {filtered.length === data.transactions.length ? "SHOWING ALL" : `FILTERED FROM ${data.transactions.length}`}</span>
          {filtered.length > 0 && (
            <span style={{ fontFamily: B, fontSize: 11, color: "#7A8E7A", letterSpacing: 0 }}>
              {clampedPage * PAGE_SIZE + 1}–{Math.min(filtered.length, (clampedPage + 1) * PAGE_SIZE)} of {filtered.length}
            </span>
          )}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", fontFamily: B, color: "#5A7A60", fontSize: 13 }}>
            No transactions match these filters.
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: B }}>
                <thead>
                  <tr style={{ background: "#FBFDFB" }}>
                    {["BUYER","TIER","STARTED","PAID","AMOUNT","METHOD","STATUS"].map(h => (
                      <th key={h} style={{ fontFamily: R, fontSize: 9, fontWeight: 400, color: "#5A7A60", letterSpacing: 1.5, textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #EDF2ED", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(t => <TxnTableRow key={t.ref} t={t} />)}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination page={clampedPage} totalPages={totalPages} onChange={setPage} />
            )}
          </>
        )}
      </div>
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

function TxnTableRow({ t }: { t: Txn }) {
  const m = OUTCOME_META[t.outcome];
  const shortTime = (iso: string | null) => iso
    ? new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" })
    : "—";
  const methodStr = (t.method ?? "—").toString().toUpperCase().replace(/_/g, " ");
  const sizeStr   = t.bundle_size > 1 ? ` × ${t.bundle_size}` : "";
  return (
    <tr style={{ borderTop: "1px solid #F0F5F0" }}>
      {/* Buyer */}
      <td style={{ padding: "8px 12px", maxWidth: 200 }}>
        <div style={{ fontSize: 12, color: "#1B3A2D", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.buyer.name ?? "—"}</div>
        <div style={{ fontSize: 10, color: "#7A8E7A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.buyer.email ?? "—"}</div>
      </td>
      {/* Tier */}
      <td style={{ padding: "8px 12px", fontSize: 12, color: "#1B3A2D", whiteSpace: "nowrap" }}>
        {t.tier_name}{sizeStr && <span style={{ color: "#5A7A60" }}>{sizeStr}</span>}
      </td>
      {/* Started */}
      <td style={{ padding: "8px 12px", fontSize: 11, color: "#5A7A60", whiteSpace: "nowrap" }}>{shortTime(t.created_at)}</td>
      {/* Paid */}
      <td style={{ padding: "8px 12px", fontSize: 11, color: t.paid_at ? "#1A8040" : "#7A8E7A", whiteSpace: "nowrap" }}>{shortTime(t.paid_at)}</td>
      {/* Amount */}
      <td style={{ padding: "8px 12px", fontFamily: R, fontSize: 13, color: t.outcome === "paid" ? "#1A8040" : "#1B3A2D", whiteSpace: "nowrap", textAlign: "right" }}>
        ₱{t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
      </td>
      {/* Method */}
      <td style={{ padding: "8px 12px", fontFamily: R, fontSize: 10, color: "#7A8E7A", letterSpacing: 1, whiteSpace: "nowrap" }}>{methodStr}</td>
      {/* Status */}
      <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
        <span title={m.note} style={{ display: "inline-block", background: m.bg, color: m.color, border: `1px solid ${m.border}`, borderRadius: 20, padding: "2px 8px", fontFamily: R, fontSize: 9, letterSpacing: 1.4 }}>{m.label}</span>
      </td>
    </tr>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  // Build compact window: first, prev range, current, next range, last.
  const windowSize = 2;
  const pages = new Set<number>();
  pages.add(0);
  pages.add(totalPages - 1);
  for (let p = page - windowSize; p <= page + windowSize; p++) {
    if (p >= 0 && p < totalPages) pages.add(p);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (i > 0 && p - sorted[i - 1] > 1) nodes.push(<span key={`gap-${p}`} style={{ fontFamily: B, fontSize: 12, color: "#7A8E7A", padding: "0 4px" }}>…</span>);
    const active = p === page;
    nodes.push(
      <button
        key={p}
        onClick={() => onChange(p)}
        style={{
          fontFamily: R, fontSize: 10, letterSpacing: 1.2,
          background: active ? "#1B3A2D" : "#FFFFFF",
          color: active ? "#FFFFFF" : "#1B3A2D",
          border: `1.5px solid ${active ? "#1B3A2D" : "#DDE8DD"}`,
          borderRadius: 6, minWidth: 30, padding: "4px 8px", cursor: "pointer",
        }}
      >
        {p + 1}
      </button>
    );
  }
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;
  const navBtn = (label: string, disabled: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: R, fontSize: 10, letterSpacing: 1.4,
        background: "#FFFFFF", color: disabled ? "#B7C4B7" : "#1B3A2D",
        border: "1.5px solid #DDE8DD",
        borderRadius: 6, padding: "4px 10px",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >{label}</button>
  );
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "12px 14px", borderTop: "1px solid #EDF2ED", background: "#FBFDFB", flexWrap: "wrap" }}>
      {navBtn("← PREV", !canPrev, () => onChange(page - 1))}
      {nodes}
      {navBtn("NEXT →", !canNext, () => onChange(page + 1))}
    </div>
  );
}
