"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const REGIONS = ["Metro Manila", "Luzon", "Visayas", "Mindanao"];
const REGION_COLORS: Record<string, string> = {
  "Metro Manila": "#3CCE2A",
  "Luzon": "#F07228",
  "Visayas": "#F5C82A",
  "Mindanao": "#F04060",
};

export default function AdminShippingPage() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadRates(); }, []);

  async function loadRates() {
    const res = await fetch("/api/shipping");
    const d = await res.json();
    setRates(d.rates ?? []);
    setLoading(false);
  }

  async function saveRate(id: string) {
    setSaving(true);
    const res = await fetch("/api/shipping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, rate: Number(editValue) }),
    });
    const data = await res.json();
    if (res.ok) {
      setRates(prev => prev.map(r => r.id === id ? data.rate : r));
      setEditingId(null);
    }
    setSaving(false);
  }

  const byRegion = REGIONS.reduce((acc, region) => {
    acc[region] = rates.filter(r => r.region === region);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>SHIPPING RATES</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Weight-based rates per region. Click a rate to edit.</p>
      </div>

      {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {REGIONS.map(region => {
            const color = REGION_COLORS[region];
            const regionRates = byRegion[region] ?? [];
            return (
              <div key={region} style={{ background: "#1A2614", border: `2px solid ${color}40`, borderRadius: "12px", overflow: "hidden" }}>
                <div style={{ background: color + "15", padding: "12px 16px", borderBottom: `1px solid ${color}30` }}>
                  <span style={{ fontFamily: R, fontSize: "12px", color, letterSpacing: "2px" }}>{region.toUpperCase()}</span>
                </div>
                <div style={{ padding: "4px 0" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "8px 16px", borderBottom: "1px solid #2C4820" }}>
                    {["FROM", "TO", "RATE"].map(h => (
                      <span key={h} style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1.5px" }}>{h}</span>
                    ))}
                  </div>
                  {regionRates.map(r => (
                    <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "10px 16px", borderBottom: "1px solid #1E3018", alignItems: "center" }}>
                      <span style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>{r.weight_from}kg</span>
                      <span style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>{r.weight_to}kg</span>
                      {editingId === r.id ? (
                        <div style={{ display: "flex", gap: "4px" }}>
                          <input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            type="number"
                            style={{ width: "70px", background: "#243520", border: `1.5px solid ${color}`, borderRadius: "4px", padding: "4px 6px", color: "#F0EAD6", fontFamily: B, fontSize: "12px", outline: "none" }}
                            onKeyDown={e => { if (e.key === "Enter") saveRate(r.id); if (e.key === "Escape") setEditingId(null); }}
                            autoFocus
                          />
                          <button onClick={() => saveRate(r.id)} disabled={saving}
                            style={{ background: color, border: "none", borderRadius: "4px", color: "#080F06", padding: "4px 8px", cursor: "pointer", fontFamily: R, fontSize: "10px" }}>
                            {saving ? "..." : "✓"}
                          </button>
                        </div>
                      ) : (
                        <span onClick={() => { setEditingId(r.id); setEditValue(String(r.rate)); }}
                          style={{ fontFamily: R, fontSize: "13px", color, cursor: "pointer", letterSpacing: "0.5px" }}
                          title="Click to edit">
                          ₱{Number(r.rate).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
