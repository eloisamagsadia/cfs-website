"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconCheck, IconClock, IconLightning, IconWarning, IconChart, IconCart, IconHeart, IconTicket } from "@/components/shared/Icons";
import StatBar from "@/components/shared/StatBar";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Range = "30d" | "90d" | "all";

interface Stats {
  range: Range;
  totals: {
    completedCount: number; completedAmount: number; avgTicket: number;
    pendingCount: number; processingCount: number; failedCount: number; totalRows: number;
  };
  statusSplit: Record<string, { count: number; amount: number }>;
  entitySplit: Record<string, { count: number; amount: number }>;
  processing: { autoCount: number; manualCount: number; autoShare: number; medianMs: number; p90Ms: number };
  topFailures: { reason: string; count: number }[];
  trend: { date: string; count: number; amount: number }[];
}

function peso(n: number) {
  return `₱${Number(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function pesoShort(n: number) {
  const v = Number(n ?? 0);
  if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `₱${(v / 1_000).toFixed(1)}K`;
  return peso(v);
}
function fmtDuration(ms: number) {
  if (!ms || ms < 1000) return "—";
  const m = Math.round(ms / 60000);
  if (m < 60)    return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24)    return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

const ENTITY_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  order:              { label: "Orders",              color: "#7A5A0F", icon: <IconCart   size={13} color="#7A5A0F" /> },
  donation:           { label: "Donations",           color: "#B78A1F", icon: <IconHeart  size={13} color="#B78A1F" /> },
  event_registration: { label: "Event Registrations", color: "#156530", icon: <IconTicket size={13} color="#156530" /> },
  event_ticket:       { label: "Event Tickets",       color: "#1A8040", icon: <IconTicket size={13} color="#1A8040" /> },
};

const STATUS_ORDER = ["pending", "processing", "completed", "failed", "cancelled"] as const;
const STATUS_COLOR: Record<string, string> = {
  pending: "#B78A1F", processing: "#1E4A7A", completed: "#1A8040", failed: "#CC3344", cancelled: "#7A8E7A",
};

export default function RefundsPerformancePage() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [range, setRange]   = useState<Range>("30d");
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState("");

  async function load(r: Range) {
    setLoad(true); setError("");
    try {
      const res = await fetch(`/api/admin/refunds/stats?range=${r}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setStats(d);
    } catch (e: any) { setError(e.message); }
    finally { setLoad(false); }
  }
  useEffect(() => { load(range); }, [range]);

  const maxTrend = useMemo(() => Math.max(1, ...(stats?.trend ?? []).map(t => t.count)), [stats]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link href="/admin/refunds" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.4px", textDecoration: "none" }}>← REFUNDS</Link>
          </div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>REFUND PERFORMANCE</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>How refund volume, speed, and reliability are trending.</p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["30d","90d","all"] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: range === r ? "#ffffff" : "#1B3A2D", background: range === r ? "#1A8040" : "#ffffff", border: `1.5px solid ${range === r ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "7px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>
              {r === "all" ? "ALL TIME" : `LAST ${r.toUpperCase()}`}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}>
          <IconWarning size={13} color="#CC3344" /> {error}
        </div>
      )}

      {loading || !stats ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : (
        <>
          {/* Headline stats */}
          <StatBar
            items={[
              { label: "Refunded",         value: pesoShort(stats.totals.completedAmount), color: "#1A8040", hint: `${stats.totals.completedCount} completed` },
              { label: "Avg refund",       value: peso(stats.totals.avgTicket),            color: "#156530", hint: "per completed" },
              { label: "Pending",          value: stats.totals.pendingCount,               color: "#B78A1F", hint: "awaiting action" },
              { label: "Processing",       value: stats.totals.processingCount,            color: "#1E4A7A", hint: "in flight" },
              { label: "Failed",           value: stats.totals.failedCount,                color: "#CC3344", hint: "needs follow-up" },
              { label: "Median time",      value: fmtDuration(stats.processing.medianMs),  color: "#4A7C59", hint: `p90 ${fmtDuration(stats.processing.p90Ms)}` },
            ]}
          />

          {/* Two-column: entity split + processing method */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
            {/* Entity split */}
            <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px" }}>
              <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "2.4px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <IconChart size={13} color="#1A8040" /> BY ENTITY
              </div>
              {Object.keys(stats.entitySplit).length === 0 ? (
                <div style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>No refunds in this range.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {Object.entries(stats.entitySplit)
                    .sort((a, b) => b[1].amount - a[1].amount)
                    .map(([type, v]) => {
                      const meta = ENTITY_META[type] ?? { label: type, color: "#5A5A5A", icon: null };
                      const totalAll = Object.values(stats.entitySplit).reduce((s, e) => s + e.amount, 0);
                      const pct = totalAll ? (v.amount / totalAll) * 100 : 0;
                      return (
                        <div key={type}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", display: "inline-flex", gap: "6px", alignItems: "center" }}>
                              {meta.icon} {meta.label}
                            </span>
                            <span style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: meta.color }}>
                              {peso(v.amount)} <span style={{ color: "#7A8E7A", fontWeight: 500 }}>· {v.count}</span>
                            </span>
                          </div>
                          <div style={{ height: "6px", background: "#F0F5F0", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: meta.color, borderRadius: "999px" }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Processing method + speed */}
            <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px" }}>
              <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "2.4px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <IconLightning size={13} color="#1A8040" /> PROCESSING METHOD
              </div>
              {stats.processing.autoCount + stats.processing.manualCount === 0 ? (
                <div style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>No completed refunds yet.</div>
              ) : (
                <>
                  <div style={{ display: "flex", height: "14px", borderRadius: "999px", overflow: "hidden", marginBottom: "14px" }}>
                    <div title={`Auto: ${stats.processing.autoCount}`} style={{ background: "#1A8040", width: `${stats.processing.autoShare * 100}%` }} />
                    <div title={`Manual: ${stats.processing.manualCount}`} style={{ background: "#B78A1F", width: `${(1 - stats.processing.autoShare) * 100}%` }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1A8040", letterSpacing: "1.4px" }}>AUTO (PAYMONGO)</div>
                      <div style={{ fontFamily: R, fontSize: "1.4rem", color: "#1B3A2D" }}>{stats.processing.autoCount}</div>
                      <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>{Math.round(stats.processing.autoShare * 100)}% of completions</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#B78A1F", letterSpacing: "1.4px" }}>MANUAL</div>
                      <div style={{ fontFamily: R, fontSize: "1.4rem", color: "#1B3A2D" }}>{stats.processing.manualCount}</div>
                      <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>{Math.round((1 - stats.processing.autoShare) * 100)}% of completions</div>
                    </div>
                  </div>
                  <div style={{ marginTop: "14px", padding: "10px 12px", background: "#F8FCF8", border: "1px solid #DDE8DD", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <IconClock size={13} color="#4A7C59" />
                    <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>
                      <strong>{fmtDuration(stats.processing.medianMs)}</strong> median · <strong>{fmtDuration(stats.processing.p90Ms)}</strong> p90 from request to completion
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Trend chart */}
          <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "2.4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <IconChart size={13} color="#1A8040" /> COMPLETED REFUNDS · DAILY
              </div>
              <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>
                {stats.trend.length} days
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "120px", padding: "0 4px" }}>
              {stats.trend.map((day) => {
                const h = day.count === 0 ? 2 : Math.max(4, (day.count / maxTrend) * 100);
                return (
                  <div key={day.date} title={`${day.date}: ${day.count} · ${peso(day.amount)}`}
                    style={{ flex: 1, minWidth: "3px", height: `${h}%`, background: day.count === 0 ? "#F0F5F0" : "#1A8040", borderRadius: "3px 3px 0 0", transition: "background 0.15s" }} />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontFamily: B, fontSize: "10px", color: "#7A8E7A" }}>
              <span>{stats.trend[0]?.date}</span>
              <span>{stats.trend[stats.trend.length - 1]?.date}</span>
            </div>
          </div>

          {/* Status breakdown + failures */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
            <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px" }}>
              <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "2.4px", marginBottom: "12px" }}>STATUS BREAKDOWN</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "6px 12px", alignItems: "center", fontFamily: B, fontSize: "12px" }}>
                {STATUS_ORDER.map(s => {
                  const v = stats.statusSplit[s] ?? { count: 0, amount: 0 };
                  const color = STATUS_COLOR[s];
                  return (
                    <div key={s} style={{ display: "contents" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: color }} />
                      <span style={{ color: "#1B3A2D", textTransform: "capitalize" }}>{s}</span>
                      <span style={{ color: "#7A8E7A" }}>{v.count}</span>
                      <span style={{ color: color, fontFamily: SG, fontWeight: 700 }}>{peso(v.amount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px" }}>
              <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "2.4px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <IconWarning size={13} color="#CC3344" /> TOP FAILURE REASONS
              </div>
              {stats.topFailures.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: B, fontSize: "12px", color: "#4A7C59" }}>
                  <IconCheck size={13} color="#1A8040" /> No failures in this range. Nice.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {stats.topFailures.map((f, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", padding: "8px 10px", background: "#FFF8F8", border: "1px solid #FFE8EC", borderRadius: "8px" }}>
                      <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>{f.reason}</span>
                      <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#CC3344", whiteSpace: "nowrap" }}>×{f.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
