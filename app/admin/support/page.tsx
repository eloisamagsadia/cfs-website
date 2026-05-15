"use client";
import { useEffect, useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const STATUS_COLORS: Record<string, string> = {
  open: "#F5C82A",
  in_progress: "#F07228",
  resolved: "#3CCE2A",
  closed: "#5A7A50",
};

const STATUSES = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES = ["low", "normal", "high", "urgent"];
const PRIORITY_COLORS: Record<string, string> = {
  low: "#5A7A50", normal: "#8AAA78", high: "#F07228", urgent: "#F04060"
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [selected, setSelected] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    const res = await fetch("/api/support");
    const d = await res.json();
    setTickets(d.tickets ?? []);
    setLoading(false);
  }

  function openTicket(t: any) {
    setSelected(t);
    setAdminNotes(t.admin_notes ?? "");
    setStatus(t.status);
    setPriority(t.priority);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, status, priority, admin_notes: adminNotes }),
    });
    const data = await res.json();
    if (res.ok) {
      setTickets(prev => prev.map(t => t.id === selected.id ? data.ticket : t));
      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); setSelected(null); }, 1500);
    }
    setSaving(false);
  }

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);
  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    closed: tickets.filter(t => t.status === "closed").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>SUPPORT TICKETS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>{counts.open} open · {tickets.length} total</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {["all", ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ fontFamily: R, fontSize: "11px", letterSpacing: "1px", padding: "6px 14px", borderRadius: "20px", border: `2px solid ${filter === s ? (STATUS_COLORS[s] ?? "#3CCE2A") : "#2C4820"}`, background: filter === s ? (STATUS_COLORS[s] ?? "#3CCE2A") + "20" : "transparent", color: filter === s ? (STATUS_COLORS[s] ?? "#3CCE2A") : "#5A7A50", cursor: "pointer" }}>
            {s.replace("_", " ").toUpperCase()} ({counts[s as keyof typeof counts] ?? tickets.length})
          </button>
        ))}
      </div>

      {/* Tickets list */}
      {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-text" style={{ width: "80%" }} />
      <div className="skeleton skeleton-text" style={{ width: "60%" }} />
      <div className="skeleton skeleton-card" />
    </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(t => (
            <div key={t.id} onClick={() => openTicket(t)}
              style={{ background: selected?.id === t.id ? "#1F3018" : "#1A2614", border: `2px solid ${selected?.id === t.id ? "#3CCE2A" : "#2C4820"}`, borderRadius: "12px", padding: "14px 20px", cursor: "pointer", display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", letterSpacing: "0.5px", marginBottom: "3px" }}>{t.subject}</div>
                <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>
                  {t.profiles?.display_name ?? "Member"} · {t.category} · {timeAgo(t.created_at)}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontFamily: R, fontSize: "10px", color: PRIORITY_COLORS[t.priority], background: PRIORITY_COLORS[t.priority] + "20", borderRadius: "20px", padding: "2px 8px" }}>{t.priority.toUpperCase()}</span>
                <span style={{ fontFamily: R, fontSize: "10px", color: STATUS_COLORS[t.status], background: STATUS_COLORS[t.status] + "20", borderRadius: "20px", padding: "2px 8px" }}>{t.status.replace("_", " ").toUpperCase()}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A50", letterSpacing: "2px" }}>NO TICKETS</div>
          )}
        </div>
      )}

      {/* Ticket detail modal */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "16px", padding: "28px", width: "520px", maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: R, fontSize: "15px", color: "#F0EAD6", letterSpacing: "1px", marginBottom: "4px" }}>{selected.subject}</div>
                <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{selected.profiles?.display_name} · {selected.category} · {timeAgo(selected.created_at)}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#5A7A50", cursor: "pointer", fontSize: "20px" }}>✕</button>
            </div>

            <div style={{ background: "#0F1A0B", borderRadius: "8px", padding: "14px 16px", fontFamily: B, fontSize: "13px", color: "#C8C0A8", lineHeight: 1.7 }}>
              {selected.message}
            </div>

            <div>
              <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", marginBottom: "8px", letterSpacing: "1px" }}>STATUS</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    style={{ fontFamily: R, fontSize: "10px", padding: "5px 12px", borderRadius: "20px", border: `1.5px solid ${status === s ? STATUS_COLORS[s] : "#2C4820"}`, background: status === s ? STATUS_COLORS[s] + "20" : "transparent", color: status === s ? STATUS_COLORS[s] : "#5A7A50", cursor: "pointer", letterSpacing: "1px" }}>
                    {s.replace("_", " ").toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", marginBottom: "8px", letterSpacing: "1px" }}>PRIORITY</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {PRIORITIES.map(p => (
                  <button key={p} onClick={() => setPriority(p)}
                    style={{ fontFamily: R, fontSize: "10px", padding: "5px 12px", borderRadius: "20px", border: `1.5px solid ${priority === p ? PRIORITY_COLORS[p] : "#2C4820"}`, background: priority === p ? PRIORITY_COLORS[p] + "20" : "transparent", color: priority === p ? PRIORITY_COLORS[p] : "#5A7A50", cursor: "pointer", letterSpacing: "1px" }}>
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", marginBottom: "6px", letterSpacing: "1px" }}>REPLY / NOTES (visible to member)</div>
              <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                placeholder="Write a reply or internal note..."
                rows={4}
                style={{ width: "100%", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>

            {saveSuccess && (
              <div style={{ background: "#1A3D14", border: "1.5px solid #3CCE2A", borderRadius: "8px", padding: "10px 14px", fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "1px", textAlign: "center" }}>
                ✓ TICKET UPDATED
              </div>
            )}
            <button onClick={handleSave} disabled={saving || saveSuccess}
              style={{ fontFamily: R, fontSize: "12px", background: saving ? "#243520" : "#F07228", color: saving ? "#5A7A50" : "#080F06", border: "none", borderRadius: "6px", padding: "10px", cursor: saving ? "not-allowed" : "pointer", letterSpacing: "1.5px" }}>
              {saving ? "SAVING..." : "UPDATE TICKET"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
