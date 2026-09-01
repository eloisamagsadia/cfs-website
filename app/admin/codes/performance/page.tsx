"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconWarning } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Code {
  id: string;
  code: string;
  discount_type: "percent" | "amount";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  redemptions: number;
  paid_redemptions: number;
  discount_given: number;
  revenue: number;
  unique_customers: number;
  last_used: string | null;
}

type Sort = "revenue" | "redemptions" | "discount" | "recent";

const WINDOWS: { days: number; label: string }[] = [
  { days: 30,  label: "30d"  },
  { days: 90,  label: "90d"  },
  { days: 180, label: "6mo"  },
  { days: 365, label: "1y"   },
];

function peso(n: number) { return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function timeAgo(iso?: string | null) {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

export default function CodePerformancePage() {
  const [codes, setCodes]     = useState<Code[]>([]);
  const [totals, setTotals]   = useState<{ redemptions: number; discount_given: number; revenue: number }>({ redemptions: 0, discount_given: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [days, setDays]       = useState(90);
  const [sort, setSort]       = useState<Sort>("revenue");
  const [search, setSearch]   = useState("");
  const [hideEmpty, setHideEmpty] = useState(true);

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/codes/performance?days=${days}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCodes(d.codes ?? []);
      setTotals(d.totals ?? { redemptions: 0, discount_given: 0, revenue: 0 });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [days]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = codes.filter(c =>
      (!q || c.code.toLowerCase().includes(q)) &&
      (!hideEmpty || c.paid_redemptions > 0)
    );
    const sorters: Record<Sort, (a: Code, b: Code) => number> = {
      revenue:     (a, b) => b.revenue - a.revenue,
      redemptions: (a, b) => b.paid_redemptions - a.paid_redemptions,
      discount:    (a, b) => b.discount_given - a.discount_given,
      recent:      (a, b) => (b.last_used ?? "").localeCompare(a.last_used ?? ""),
    };
    return list.sort(sorters[sort]);
  }, [codes, search, sort, hideEmpty]);

  const maxRevenue = useMemo(() => Math.max(1, ...filtered.map(c => c.revenue)), [filtered]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>PROMO CODE PERFORMANCE</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>
            Which codes actually moved product. Only paid + free orders count toward revenue and discount totals.
          </p>
        </div>
        <Link href="/admin/codes" style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>
          ← ALL CODES
        </Link>
      </div>

      {/* Window switcher */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
        {WINDOWS.map(w => (
          <button key={w.days} onClick={() => setDays(w.days)}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: days === w.days ? "#ffffff" : "#1B3A2D", background: days === w.days ? "#1A8040" : "#ffffff", border: `1.5px solid ${days === w.days ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
            {w.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
        {[
          { label: "REDEMPTIONS",    value: String(totals.redemptions),                 accent: "#1A8040" },
          { label: "DISCOUNT GIVEN", value: peso(totals.discount_given),                accent: "#B78A1F" },
          { label: "REVENUE",        value: peso(totals.revenue),                       accent: "#156530" },
          { label: "AVG DISCOUNT",   value: totals.redemptions ? peso(totals.discount_given / totals.redemptions) : "—", accent: "#7A5A0F" },
        ].map(t => (
          <div key={t.label} style={{ background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "12px", padding: "14px 16px" }}>
            <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: t.accent, letterSpacing: "1.3px" }}>{t.label}</div>
            <div style={{ fontFamily: R, fontSize: "1.4rem", color: "#1B3A2D", letterSpacing: "1px", marginTop: "3px" }}>{t.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search code…"
          style={{ background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", flex: 1, minWidth: "200px" }} />
        <select value={sort} onChange={e => setSort(e.target.value as Sort)}
          style={{ background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", cursor: "pointer" }}>
          <option value="revenue">Sort: Revenue</option>
          <option value="redemptions">Sort: Redemptions</option>
          <option value="discount">Sort: Discount given</option>
          <option value="recent">Sort: Most recent</option>
        </select>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>
          <input type="checkbox" checked={hideEmpty} onChange={e => setHideEmpty(e.target.checked)} />
          Hide unused
        </label>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>
          {hideEmpty ? "No codes redeemed in this window. Try widening the range or unchecking 'Hide unused'." : "No codes match your filters."}
        </div>
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 90px 1fr 90px 90px 90px 90px 90px", padding: "10px 18px", background: "#F7FAF5", fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.3px" }}>
            <span>CODE</span>
            <span>DISCOUNT</span>
            <span>REVENUE</span>
            <span style={{ textAlign: "right" as const }}>PAID</span>
            <span style={{ textAlign: "right" as const }}>ATTEMPTS</span>
            <span style={{ textAlign: "right" as const }}>DISC GIVEN</span>
            <span style={{ textAlign: "right" as const }}>CUSTOMERS</span>
            <span style={{ textAlign: "right" as const }}>LAST USED</span>
          </div>
          {filtered.map((c, i) => {
            const barPct = maxRevenue > 0 ? Math.min(100, (c.revenue / maxRevenue) * 100) : 0;
            const capPct = c.max_uses ? Math.min(100, (c.paid_redemptions / c.max_uses) * 100) : null;
            const capped = c.max_uses && c.paid_redemptions >= c.max_uses;
            const expired = c.expires_at && new Date(c.expires_at) < new Date();
            return (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "180px 90px 1fr 90px 90px 90px 90px 90px", padding: "10px 18px", borderTop: "1px solid #F0F5F0", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                  <span style={{ fontFamily: "monospace" as const, fontSize: "13px", fontWeight: 700, color: "#1B3A2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{c.code}</span>
                  <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                    {!c.is_active && <span style={{ fontFamily: SG, fontSize: "8px", fontWeight: 700, color: "#5A5A5A", background: "#F0F0F0", borderRadius: "6px", padding: "1px 5px", letterSpacing: "1px" }}>PAUSED</span>}
                    {expired && <span style={{ fontFamily: SG, fontSize: "8px", fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", borderRadius: "6px", padding: "1px 5px", letterSpacing: "1px" }}>EXPIRED</span>}
                    {capped && <span style={{ fontFamily: SG, fontSize: "8px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: "6px", padding: "1px 5px", letterSpacing: "1px" }}>MAX'D</span>}
                  </div>
                </div>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>{c.discount_type === "percent" ? `${c.discount_value}%` : peso(c.discount_value)}</span>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <div style={{ flex: 1, height: "6px", background: "#F2F7F2", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${barPct}%`, background: "#1A8040" }} />
                  </div>
                  <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#156530", whiteSpace: "nowrap" as const }}>{peso(c.revenue)}</span>
                </div>

                <span style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", textAlign: "right" as const }}>{c.paid_redemptions}{capPct != null && <span style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60" }}> /{c.max_uses}</span>}</span>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", textAlign: "right" as const }}>{c.redemptions}</span>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#7A5A0F", textAlign: "right" as const }}>{peso(c.discount_given)}</span>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", textAlign: "right" as const }}>{c.unique_customers}</span>
                <span style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", textAlign: "right" as const }}>{timeAgo(c.last_used)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
