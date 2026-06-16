"use client";
import { useState, useEffect } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const SC: Record<string, string> = {
  completed: "#3CCE2A",
  pending:   "#F5C82A",
  failed:    "#F04060",
};

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

  const totalCollected = donations
    .filter(d => d.status === "completed")
    .reduce((s, d) => s + Number(d.amount), 0);
  const pendingCount   = donations.filter(d => d.status === "pending").length;
  const completedCount = donations.filter(d => d.status === "completed").length;

  const filtered = donations.filter(d => {
    const matchFilter = filter === "all" || d.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      d.profiles?.display_name?.toLowerCase().includes(q) ||
      d.profiles?.email?.toLowerCase().includes(q) ||
      d.message?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>DONATIONS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>
          {completedCount} completed · <span style={{ color: "#3CCE2A" }}>₱{totalCollected.toLocaleString()} collected</span>
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        {[
          { label: "TOTAL DONATIONS", value: donations.length,                               color: "#F0EAD6" },
          { label: "COLLECTED",       value: `₱${totalCollected.toLocaleString()}`,          color: "#3CCE2A" },
          { label: "PENDING",         value: pendingCount,                                    color: "#F5C82A" },
        ].map(s => (
          <div key={s.label} style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "10px", padding: "14px 18px" }}>
            <div style={{ fontFamily: R, fontSize: "1.4rem", color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {["all", "completed", "pending", "failed"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontFamily: R, fontSize: "11px", letterSpacing: "1px", padding: "6px 14px", borderRadius: "20px", border: `2px solid ${filter === f ? "#3CCE2A" : "#2C4820"}`, background: filter === f ? "#3CCE2A" : "transparent", color: filter === f ? "#080F06" : "#5A7A50", cursor: "pointer" }}>
            {f.toUpperCase()}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donor or message..."
          style={{ marginLeft: "auto", background: "#1A2614", border: "1.5px solid #2C4820", borderRadius: "8px", padding: "7px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "12px", outline: "none", minWidth: "220px" }} />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: B, color: "#5A7A50" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A50" }}>
          NO DONATIONS {filter !== "all" ? `WITH STATUS "${filter.toUpperCase()}"` : "YET"}
        </div>
      ) : (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", overflow: "hidden" }}>
          {/* Header */}
          <div style={{ background: "#243520", padding: "10px 20px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px" }}>
            {["DONOR", "AMOUNT", "STATUS", "DATE"].map(h => (
              <span key={h} style={{ fontFamily: R, fontSize: "10px", color: "#5A7A50", letterSpacing: "1.5px" }}>{h}</span>
            ))}
          </div>

          {filtered.map((d, i) => (
            <div key={d.id} style={{ padding: "14px 20px", borderTop: "1px solid #2C4820", background: i % 2 === 0 ? "#1A2614" : "#162212", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px", alignItems: "center" }}>
              {/* Donor */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#243520", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {d.is_anonymous ? (
                    <span style={{ fontFamily: R, fontSize: "13px", color: "#5A7A50" }}>?</span>
                  ) : d.profiles?.avatar_url ? (
                    <img src={d.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontFamily: R, fontSize: "13px", color: "#3CCE2A" }}>{(d.profiles?.display_name ?? "M")[0].toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6" }}>
                    {d.is_anonymous ? "Anonymous" : (d.profiles?.display_name ?? "Member")}
                  </div>
                  {!d.is_anonymous && d.profiles?.email && (
                    <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50" }}>{d.profiles.email}</div>
                  )}
                  {d.message && (
                    <div style={{ fontFamily: B, fontSize: "11px", color: "#8AAA78", fontStyle: "italic", marginTop: "2px" }}>"{d.message}"</div>
                  )}
                </div>
              </div>

              {/* Amount */}
              <span style={{ fontFamily: R, fontSize: "14px", color: "#3CCE2A" }}>
                ₱{Number(d.amount).toLocaleString()}
              </span>

              {/* Status */}
              <span style={{ fontFamily: R, fontSize: "10px", color: SC[d.status] ?? "#5A7A50", background: (SC[d.status] ?? "#5A7A50") + "20", borderRadius: "20px", padding: "3px 10px", letterSpacing: "1px", width: "fit-content" }}>
                {(d.status ?? "pending").toUpperCase()}
              </span>

              {/* Date */}
              <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>
                {new Date(d.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
