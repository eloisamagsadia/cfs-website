"use client";
import { useState, useEffect } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const SC: Record<string, string> = {
  completed: "#3CCE2A",
  pending:   "#F5C82A",
  failed:    "#F04060",
};

const TIERS = [
  { name: "Supermoon",    min: 8000,  color: "#F5C82A" },
  { name: "Blue Moon",    min: 5000,  color: "#8EE440" },
  { name: "Harvest Moon", min: 3000,  color: "#F07228" },
  { name: "Blood Moon",   min: 1500,  color: "#F04060" },
];

function getTier(amount: number) {
  return TIERS.find(t => amount >= t.min) ?? null;
}

function fmt(n: number) {
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const COLS = "2fr 1fr 0.8fr 1fr 1fr 1.2fr 1.5fr";
const HEADERS = ["DONOR", "DONATED", "FEE", "TOTAL PAID", "STATUS", "DATE & TIME", "REF / PAYMONGO"];

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [search, setSearch]       = useState("");

  useEffect(() => {
    fetch("/api/admin/donations").then(r => r.json()).then(d => {
      setDonations(d.donations ?? []);
      setLoading(false);
    });
  }, []);

  const totalCollected = donations.filter(d => d.status === "completed").reduce((s, d) => s + Number(d.amount), 0);
  const pendingCount   = donations.filter(d => d.status === "pending").length;
  const completedCount = donations.filter(d => d.status === "completed").length;
  const failedCount    = donations.filter(d => d.status === "failed").length;

  const filtered = donations.filter(d => {
    const matchFilter = filter === "all" || d.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      d.profiles?.display_name?.toLowerCase().includes(q) ||
      d.profiles?.email?.toLowerCase().includes(q) ||
      d.message?.toLowerCase().includes(q) ||
      d.id?.toLowerCase().includes(q) ||
      d.paymongo_ref?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>DONATIONS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>
          {completedCount} completed · <span style={{ color: "#3CCE2A" }}>₱{totalCollected.toLocaleString()} collected</span>
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {[
          { label: "TOTAL DONATIONS", value: donations.length,                      color: "#1B3A2D" },
          { label: "COLLECTED",       value: `₱${totalCollected.toLocaleString()}`, color: "#3CCE2A" },
          { label: "PENDING",         value: pendingCount,                           color: "#F5C82A" },
          { label: "FAILED",          value: failedCount,                            color: "#F04060" },
        ].map(s => (
          <div key={s.label} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "10px", padding: "14px 18px" }}>
            <div style={{ fontFamily: R, fontSize: "1.4rem", color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60", letterSpacing: "1px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {["all", "completed", "pending", "failed"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontFamily: R, fontSize: "11px", letterSpacing: "1px", padding: "6px 14px", borderRadius: "20px", border: `2px solid ${filter === f ? "#3CCE2A" : "#DDE8DD"}`, background: filter === f ? "#3CCE2A" : "transparent", color: filter === f ? "#080F06" : "#5A7A60", cursor: "pointer" }}>
            {f.toUpperCase()}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donor, message, ref..."
          style={{ marginLeft: "auto", background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "7px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "12px", outline: "none", minWidth: "220px" }} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: B, color: "#5A7A60" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A60" }}>
          NO DONATIONS {filter !== "all" ? `WITH STATUS "${filter.toUpperCase()}"` : "YET"}
        </div>
      ) : (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "auto" }}>
          {/* Header */}
          <div style={{ background: "#F2F7F2", padding: "10px 20px", display: "grid", gridTemplateColumns: COLS, gap: "12px", minWidth: "900px" }}>
            {HEADERS.map(h => (
              <span key={h} style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "1.5px" }}>{h}</span>
            ))}
          </div>

          {filtered.map((d, i) => {
            const total    = Number(d.amount);
            const intended = d.donation_amount ? Number(d.donation_amount) : null;
            const fee      = intended != null ? total - intended : null;
            const tier     = getTier(intended ?? total);
            const statusColor = SC[d.status] ?? "#5A7A60";
            const dt       = new Date(d.created_at);
            const dateStr  = dt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
            const timeStr  = dt.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true });
            const refNo    = (d.id as string).slice(0, 8).toUpperCase();

            return (
              <div key={d.id} style={{ padding: "14px 20px", borderTop: "1px solid #DDE8DD", background: i % 2 === 0 ? "#FFFFFF" : "#EDF7ED", display: "grid", gridTemplateColumns: COLS, gap: "12px", alignItems: "center", minWidth: "900px" }}>

                {/* DONOR */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#F2F7F2", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {d.profiles?.avatar_url
                      ? <img src={d.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: R, fontSize: "13px", color: "#3CCE2A" }}>{(d.profiles?.display_name ?? "M")[0].toUpperCase()}</span>
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", whiteSpace: "nowrap" }}>
                        {d.profiles?.display_name ?? "Member"}
                      </span>
                      {d.is_anonymous && (
                        <span style={{ fontFamily: R, fontSize: "9px", color: "#5A7A60", background: "#DDE8DD", borderRadius: "4px", padding: "1px 6px", letterSpacing: "1px" }}>ANON</span>
                      )}
                      {tier && (
                        <span style={{ fontFamily: R, fontSize: "9px", color: tier.color, background: tier.color + "18", border: `1px solid ${tier.color}40`, borderRadius: "4px", padding: "1px 6px", letterSpacing: "1px" }}>
                          {tier.name.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {d.profiles?.email && (
                      <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.profiles.email}</div>
                    )}
                    {d.message && (
                      <div style={{ fontFamily: B, fontSize: "10px", color: "#4A7C59", fontStyle: "italic", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{d.message}"</div>
                    )}
                  </div>
                </div>

                {/* DONATED (intended) */}
                <div>
                  {intended != null ? (
                    <span style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D" }}>₱{fmt(intended)}</span>
                  ) : (
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>—</span>
                  )}
                </div>

                {/* FEE */}
                <div>
                  {fee != null ? (
                    <span style={{ fontFamily: B, fontSize: "12px", color: "#F04060" }}>+₱{fmt(fee)}</span>
                  ) : (
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>—</span>
                  )}
                </div>

                {/* TOTAL PAID */}
                <span style={{ fontFamily: R, fontSize: "14px", color: "#3CCE2A" }}>₱{fmt(total)}</span>

                {/* STATUS */}
                <span style={{ fontFamily: R, fontSize: "10px", color: statusColor, background: statusColor + "20", borderRadius: "20px", padding: "3px 10px", letterSpacing: "1px", width: "fit-content" }}>
                  {(d.status ?? "pending").toUpperCase()}
                </span>

                {/* DATE & TIME */}
                <div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#4A7C59" }}>{dateStr}</div>
                  <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60" }}>{timeStr}</div>
                </div>

                {/* REF / PAYMONGO */}
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: "11px", color: "#1B3A2D", letterSpacing: "1px" }}>#{refNo}</div>
                  {d.paymongo_ref && (
                    <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#5A7A60", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.paymongo_ref}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
