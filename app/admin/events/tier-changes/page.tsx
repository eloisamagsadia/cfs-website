"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconTicket, IconCart, IconWarning, IconCheck, IconClock, IconLightning } from "@/components/shared/Icons";
import StatBar from "@/components/shared/StatBar";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Range     = "30d" | "90d" | "all";
type Direction = "upgrade" | "downgrade" | "same";
type Completion = "completed" | "pending" | "abandoned" | "same_swap";

interface TierChange {
  id: string;
  at: string;
  action: string;
  direction: Direction;
  completion: Completion;
  amount: number;
  ticket:   { id: string; ticket_number: string | null } | null;
  event:    { id: string; title: string; date: string } | null;
  from_tier:{ id: string; name: string; price: number } | null;
  to_tier:  { id: string; name: string; price: number } | null;
  member:   { id: string; display_name: string | null; email: string | null; avatar_url: string | null } | null;
  refund:   { id: string; status: string; amount: number; paymongo_ref: string | null } | null;
}
interface Summary {
  total: number; upgrades: number; downgrades: number; same: number;
  upgrade_revenue: number; downgrade_refunds: number;
  pending_upgrades: number; pending_downgrades: number;
}

function peso(n: number) { return `₱${Number(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
}

const DIR_META: Record<Direction, { label: string; color: string; bg: string }> = {
  upgrade:   { label: "UPGRADE",   color: "#156530", bg: "#E8F0E4" },
  downgrade: { label: "DOWNGRADE", color: "#7A5A0F", bg: "#FFF3D6" },
  same:      { label: "SWAP",      color: "#1E4A7A", bg: "#E4EEF8" },
};
const COMPLETION_META: Record<Completion, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  completed: { label: "COMPLETED", color: "#156530", bg: "#E8F0E4", icon: <IconCheck size={10} color="#156530" /> },
  pending:   { label: "PENDING",   color: "#7A5A0F", bg: "#FFF3D6", icon: <IconClock size={10} color="#7A5A0F" /> },
  abandoned: { label: "ABANDONED", color: "#8A1E27", bg: "#FFE8EC", icon: <IconWarning size={10} color="#8A1E27" /> },
  same_swap: { label: "IMMEDIATE", color: "#1E4A7A", bg: "#E4EEF8", icon: <IconLightning size={10} color="#1E4A7A" /> },
};

export default function TierChangesPage() {
  const [range,    setRange]    = useState<Range>("30d");
  const [rows,     setRows]     = useState<TierChange[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [dirFilter, setDirFilter] = useState<Direction | "all">("all");
  const [compFilter, setCompFilter] = useState<Completion | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true); setError("");
    fetch(`/api/admin/events/tier-changes?range=${range}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setRows(d.events ?? []);
        setSummary(d.summary ?? null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [range]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (dirFilter  !== "all" && r.direction  !== dirFilter)  return false;
      if (compFilter !== "all" && r.completion !== compFilter) return false;
      if (!q) return true;
      return (
        (r.member?.display_name ?? "").toLowerCase().includes(q) ||
        (r.member?.email ?? "").toLowerCase().includes(q) ||
        (r.event?.title ?? "").toLowerCase().includes(q) ||
        (r.ticket?.ticket_number ?? "").toLowerCase().includes(q) ||
        (r.from_tier?.name ?? "").toLowerCase().includes(q) ||
        (r.to_tier?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, dirFilter, compFilter, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <Link href="/admin/events" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.4px", textDecoration: "none" }}>← EVENTS</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", margin: "4px 0" }}>TIER CHANGES</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59", margin: 0 }}>Upgrades, downgrades, and same-price swaps across every event.</p>
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

      {loading || !summary ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : (
        <>
          {/* Summary bar */}
          <StatBar
            items={[
              { label: "Total",       value: summary.total,                       color: "#4A7C59", hint: "changes in range" },
              { label: "Upgrades",    value: summary.upgrades,                    color: "#156530", hint: `+${peso(summary.upgrade_revenue)} paid` },
              { label: "Downgrades",  value: summary.downgrades,                  color: "#7A5A0F", hint: `−${peso(summary.downgrade_refunds)} refunded` },
              { label: "Swaps",       value: summary.same,                        color: "#1E4A7A", hint: "same price" },
              { label: "Pending Up",  value: summary.pending_upgrades,            color: "#B78A1F", hint: "awaiting payment" },
              { label: "Pending Down",value: summary.pending_downgrades,          color: "#CC3344", hint: "awaiting refund" },
            ]}
          />

          {/* Filters */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.4px", marginRight: "4px" }}>DIRECTION</span>
            {(["all","upgrade","downgrade","same"] as const).map(d => (
              <button key={d} onClick={() => setDirFilter(d)}
                style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: dirFilter === d ? "#ffffff" : "#1B3A2D", background: dirFilter === d ? "#1A8040" : "#ffffff", border: `1.5px solid ${dirFilter === d ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "5px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
                {d.toUpperCase()}
              </button>
            ))}
            <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.4px", marginLeft: "8px", marginRight: "4px" }}>STATUS</span>
            {(["all","completed","pending","same_swap"] as const).map(c => (
              <button key={c} onClick={() => setCompFilter(c)}
                style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: compFilter === c ? "#ffffff" : "#1B3A2D", background: compFilter === c ? "#1A8040" : "#ffffff", border: `1.5px solid ${compFilter === c ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "5px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
                {c === "same_swap" ? "IMMEDIATE" : c.toUpperCase()}
              </button>
            ))}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member / event / ticket / tier…"
              style={{ flex: 1, minWidth: "220px", background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Table */}
          <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", background: "#F7FAF5", borderBottom: "1px solid #E4EDE4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>
                <IconTicket size={12} color="#1A8040" style={{ verticalAlign: "middle", marginRight: "6px" }} />
                {filtered.length} · {rows.length === filtered.length ? "SHOWING ALL" : `FILTERED FROM ${rows.length}`}
              </span>
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", fontFamily: B, color: "#7A8E7A", fontSize: "13px" }}>
                No tier changes match these filters.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#FBFDFB" }}>
                      {["WHEN","MEMBER","EVENT","FROM → TO","DIRECTION","AMOUNT","STATUS"].map(h => (
                        <th key={h} style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.4px", textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #E4EDE4" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => {
                      const dm = DIR_META[r.direction];
                      const cm = COMPLETION_META[r.completion];
                      return (
                        <tr key={r.id} style={{ borderBottom: "1px solid #F0F5F0" }}>
                          <td style={{ padding: "12px 14px", fontFamily: B, fontSize: "11px", color: "#5A7A60", whiteSpace: "nowrap" as const }}>{timeAgo(r.at)}</td>
                          <td style={{ padding: "12px 14px" }}>
                            {r.member ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {r.member.avatar_url
                                  ? <img src={r.member.avatar_url} alt="" style={{ width: "22px", height: "22px", borderRadius: "999px", objectFit: "cover" }} />
                                  : <div style={{ width: "22px", height: "22px", borderRadius: "999px", background: "#E8F0E4", color: "#1A8040", fontFamily: SG, fontWeight: 700, fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>{(r.member.display_name ?? r.member.email ?? "?")[0]?.toUpperCase()}</div>
                                }
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", fontWeight: 600 }}>{r.member.display_name ?? "—"}</div>
                                  <div style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A" }}>{r.member.email ?? ""}</div>
                                </div>
                              </div>
                            ) : <span style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>—</span>}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>{r.event?.title ?? "—"}</div>
                            {r.ticket && <div style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A" }}>{r.ticket.ticket_number ?? r.ticket.id.slice(0,8)}</div>}
                          </td>
                          <td style={{ padding: "12px 14px", fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>
                            <span>{r.from_tier?.name ?? "—"}</span>
                            <span style={{ color: "#7A8E7A", margin: "0 6px" }}>→</span>
                            <span>{r.to_tier?.name ?? "—"}</span>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: dm.color, background: dm.bg, borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>{dm.label}</span>
                          </td>
                          <td style={{ padding: "12px 14px", fontFamily: SG, fontSize: "12px", fontWeight: 700, color: r.direction === "upgrade" ? "#156530" : r.direction === "downgrade" ? "#7A5A0F" : "#7A8E7A", whiteSpace: "nowrap" as const }}>
                            {r.direction === "upgrade"   ? `+${peso(r.amount)}` :
                             r.direction === "downgrade" ? `−${peso(r.amount)}` : "—"}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: cm.color, background: cm.bg, borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              {cm.icon} {cm.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
