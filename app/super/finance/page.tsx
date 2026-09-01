"use client";
import { useEffect, useState } from "react";
import { IconTicket, IconHeart, IconShoppingBag } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Bucket = { total: number; count: number };
type Data = {
  range: { from: string; to: string };
  donations: Bucket;
  orders: Bucket;
  tickets: Bucket;
  grand_total: number;
};

function toInputDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function toInputDateStart(d: string): string {
  return new Date(d + "T00:00:00.000Z").toISOString();
}

function toInputDateEnd(d: string): string {
  return new Date(d + "T23:59:59.999Z").toISOString();
}

function fmt(n: number): string {
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PRESETS: { label: string; days: number }[] = [
  { label: "7 days",  days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year",  days: 365 },
];

export default function FinancePage() {
  const [from, setFrom] = useState(toInputDate(new Date(Date.now() - 30 * 86_400_000).toISOString()));
  const [to,   setTo]   = useState(toInputDate(new Date().toISOString()));
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const qs = new URLSearchParams({ from: toInputDateStart(from), to: toInputDateEnd(to) });
      const res = await fetch(`/api/super/finance?${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Load failed");
      setData(json);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to]);

  function applyPreset(days: number) {
    setFrom(toInputDate(new Date(Date.now() - days * 86_400_000).toISOString()));
    setTo(toInputDate(new Date().toISOString()));
  }

  const cards = data ? [
    { label: "TICKETS",   icon: <IconTicket size={18} color="#1A8040" />, total: data.tickets.total,   count: data.tickets.count,   color: "#1A8040" },
    { label: "DONATIONS", icon: <IconHeart  size={18} color="#CC3344" />, total: data.donations.total, count: data.donations.count, color: "#CC3344" },
    { label: "SHOP",      icon: <IconShoppingBag size={18} color="#B78A1F" />, total: data.orders.total,    count: data.orders.count,    color: "#B78A1F" },
  ] : [];

  const inputStyle: React.CSSProperties = { background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none" };
  const labelStyle: React.CSSProperties = { fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", display: "block", marginBottom: "5px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", margin: 0 }}>FINANCIALS</h1>
        <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "4px 0 0" }}>
          Combined revenue from paid tickets, donations, and shop orders.
        </p>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}

      {/* Date range */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label style={labelStyle}>FROM</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>TO</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.days)}
              style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", background: "#F7FAF5", border: "1.5px solid #DDE8DD", borderRadius: "999px", padding: "7px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
              {p.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grand total */}
      <div style={{ background: "linear-gradient(135deg, #1A8040 0%, #156530 100%)", borderRadius: "16px", padding: "24px 28px", color: "#ffffff" }}>
        <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "2px", opacity: 0.85 }}>GRAND TOTAL</div>
        <div style={{ fontFamily: R, fontSize: "2.2rem", letterSpacing: "1px", marginTop: "6px" }}>
          {loading ? "…" : `₱${fmt(data?.grand_total ?? 0)}`}
        </div>
        <div style={{ fontFamily: B, fontSize: "12px", opacity: 0.85, marginTop: "4px" }}>
          {loading ? "" : `${(data?.tickets.count ?? 0) + (data?.donations.count ?? 0) + (data?.orders.count ?? 0)} transactions · ${from} → ${to}`}
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              {c.icon}
              <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>{c.label}</span>
            </div>
            <div style={{ fontFamily: R, fontSize: "1.5rem", color: c.color, letterSpacing: "1px" }}>{loading ? "…" : `₱${fmt(c.total)}`}</div>
            <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", marginTop: "3px" }}>{loading ? "" : `${c.count} transaction${c.count === 1 ? "" : "s"}`}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", lineHeight: 1.6 }}>
        Tickets: sum of tier price (fallback to event price) for tickets with status active or used and payment_status paid.
        Donations: sum of amount where status is completed. Shop: sum of order total where payment_status is paid.
      </div>
    </div>
  );
}
