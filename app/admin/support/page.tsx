"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const STATUS_COLORS: Record<string, string> = {
  open: "#F5C82A", in_progress: "#F07228", resolved: "#3CCE2A", closed: "#5A7A50",
};
const STATUSES = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES = ["low", "normal", "high", "urgent"];
const PRIORITY_COLORS: Record<string, string> = {
  low: "#5A7A50", normal: "#8AAA78", high: "#F07228", urgent: "#F04060",
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
  const [filterStatus, setFilterStatus] = useState("open");
  const [filterPriority, setFilterPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [priorities, setPriorities] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    const res = await fetch("/api/support");
    const d = await res.json();
    const t = d.tickets ?? [];
    setTickets(t);
    const notes: Record<string, string> = {};
    const sts: Record<string, string> = {};
    const pris: Record<string, string> = {};
    t.forEach((ticket: any) => {
      notes[ticket.id] = ticket.admin_notes ?? "";
      sts[ticket.id] = ticket.status;
      pris[ticket.id] = ticket.priority;
    });
    setAdminNotes(notes);
    setStatuses(sts);
    setPriorities(pris);
    setLoading(false);
  }

  async function handleSave(ticketId: string) {
    setSaving(ticketId);
    const res = await fetch("/api/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ticketId, status: statuses[ticketId], priority: priorities[ticketId], admin_notes: adminNotes[ticketId] }),
    });
    const data = await res.json();
    if (res.ok) {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...data.ticket } : t));
      setSaveSuccess(ticketId);
      setTimeout(() => setSaveSuccess(null), 2000);
    }
    setSaving(null);
  }

  const filtered = tickets
    .filter(t => filterStatus === "all" || t.status === filterStatus)
    .filter(t => filterPriority === "all" || t.priority === filterPriority)
    .filter(t => !search || t.subject?.toLowerCase().includes(search.toLowerCase()) || (t.profiles?.display_name ?? "").toLowerCase().includes(search.toLowerCase()) || t.category?.toLowerCase().includes(search.toLowerCase()));

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
      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px" }}>STATUS</span>
          {["all", ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ fontFamily: R, fontSize: "10px", letterSpacing: "1px", padding: "4px 12px", borderRadius: "20px", border: `1.5px solid ${filterStatus === s ? (STATUS_COLORS[s] ?? "#3CCE2A") : "#2C4820"}`, background: filterStatus === s ? (STATUS_COLORS[s] ?? "#3CCE2A") + "20" : "transparent", color: filterStatus === s ? (STATUS_COLORS[s] ?? "#3CCE2A") : "#5A7A50", cursor: "pointer" }}>
              {s.replace("_", " ").toUpperCase()} ({counts[s as keyof typeof counts] ?? tickets.length})
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px" }}>PRIORITY</span>
          {["all", ...PRIORITIES].map(p => (
            <button key={p} onClick={() => setFilterPriority(p)}
              style={{ fontFamily: R, fontSize: "10px", letterSpacing: "1px", padding: "4px 12px", borderRadius: "20px", border: `1.5px solid ${filterPriority === p ? (PRIORITY_COLORS[p] ?? "#3CCE2A") : "#2C4820"}`, background: filterPriority === p ? (PRIORITY_COLORS[p] ?? "#3CCE2A") + "20" : "transparent", color: filterPriority === p ? (PRIORITY_COLORS[p] ?? "#3CCE2A") : "#5A7A50", cursor: "pointer" }}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject, member, or category..."
          style={{ width: "100%", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "8px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
          <SkeletonPage /></div>
      ) : (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", overflow: "hidden" }}>
          {/* Table header */}
          <div className="support-table-header" className="support-table-header" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 140px 32px", gap: "12px", padding: "10px 16px", borderBottom: "1px solid #2C4820", background: "#162010" }}>
            {["SUBJECT", "MEMBER", "CATEGORY", "DATE", "STATUS", ""].map(h => (
              <span key={h} style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1.5px" }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filtered.map(t => (
              <div key={t.id}>
                {/* Row */}
                <div onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  className="support-table-row" className="support-table-row" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 140px 32px", gap: "12px", padding: "12px 16px", borderBottom: "1px solid #1E3018", cursor: "pointer", background: expanded === t.id ? "#1F3018" : "transparent", alignItems: "center" }}
                  onMouseEnter={e => { if (expanded !== t.id) (e.currentTarget as HTMLDivElement).style.background = "#1C2E14"; }}
                  onMouseLeave={e => { if (expanded !== t.id) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                  <div>
                    <div style={{ fontFamily: R, fontSize: "12px", color: "#F0EAD6", letterSpacing: "0.5px", marginBottom: "2px" }}>{t.subject}</div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {t.attachments?.length > 0 && <span style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50" }}>{t.attachments.length} attachment{t.attachments.length > 1 ? "s" : ""}</span>}
                      {t.member_reply && <span style={{ fontFamily: B, fontSize: "10px", color: "#F07228" }}>↩ replied</span>}
                    </div>
                  </div>
                  <span style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>{t.profiles?.display_name ?? "Member"}</span>
                  <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50" }}>{t.category}</span>
                  <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{timeAgo(t.created_at)}</span>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <span style={{ fontFamily: R, fontSize: "9px", color: PRIORITY_COLORS[t.priority], background: PRIORITY_COLORS[t.priority] + "20", borderRadius: "20px", padding: "2px 6px" }}>{t.priority[0].toUpperCase()}</span>
                    <span style={{ fontFamily: R, fontSize: "9px", color: STATUS_COLORS[t.status], background: STATUS_COLORS[t.status] + "20", borderRadius: "20px", padding: "2px 6px" }}>{t.status.replace("_"," ").toUpperCase()}</span>
                  </div>
                  <span style={{ color: "#5A7A50", fontSize: "12px", textAlign: "center" }}>{expanded === t.id ? "▲" : "▼"}</span>
                </div>

                {/* Expanded thread */}
                {expanded === t.id && (
                  <div style={{ borderBottom: "1px solid #2C4820", padding: "20px", background: "#162010", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ background: "#243520", borderRadius: "8px", padding: "12px 14px" }}>
                      <div style={{ fontFamily: R, fontSize: "10px", color: "#5A7A50", letterSpacing: "1px", marginBottom: "6px" }}>
                        {t.profiles?.display_name ?? "MEMBER"} · {timeAgo(t.created_at)}
                      </div>
                      <div style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6", lineHeight: 1.7 }}>{t.message}</div>
                    </div>

                    {t.attachments?.length > 0 && (
                      <div>
                        <div style={{ fontFamily: R, fontSize: "10px", color: "#5A7A50", letterSpacing: "1px", marginBottom: "8px" }}>ATTACHMENTS</div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {t.attachments.map((url: string, i: number) => (
                            <img key={i} src={url} alt="" onClick={() => setLightboxImg(url)}
                              style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1.5px solid #2C4820", cursor: "zoom-in" }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {t.admin_notes && (
                      <div style={{ background: "#0F2A0B", border: "1px solid #3CCE2A30", borderRadius: "8px", padding: "12px 14px" }}>
                        <div style={{ fontFamily: R, fontSize: "10px", color: "#3CCE2A", letterSpacing: "1px", marginBottom: "6px" }}>YOUR REPLY</div>
                        <div style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6", lineHeight: 1.6 }}>{t.admin_notes}</div>
                      </div>
                    )}

                    {t.member_reply && (
                      <div style={{ background: "#2A1F0A", border: "1px solid #F07228", borderRadius: "8px", padding: "12px 14px" }}>
                        <div style={{ fontFamily: R, fontSize: "10px", color: "#F07228", letterSpacing: "1px", marginBottom: "6px" }}>
                          MEMBER REPLY · {timeAgo(t.member_replied_at)}
                        </div>
                        <div style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6", lineHeight: 1.6 }}>{t.member_reply}</div>
                      </div>
                    )}

                    <div style={{ borderTop: "1px solid #2C4820", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", marginBottom: "6px", letterSpacing: "1px" }}>STATUS</div>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {STATUSES.map(s => (
                              <button key={s} onClick={() => setStatuses(prev => ({ ...prev, [t.id]: s }))}
                                style={{ fontFamily: R, fontSize: "10px", padding: "4px 10px", borderRadius: "20px", border: `1.5px solid ${statuses[t.id] === s ? STATUS_COLORS[s] : "#2C4820"}`, background: statuses[t.id] === s ? STATUS_COLORS[s] + "20" : "transparent", color: statuses[t.id] === s ? STATUS_COLORS[s] : "#5A7A50", cursor: "pointer", letterSpacing: "1px" }}>
                                {s.replace("_", " ").toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", marginBottom: "6px", letterSpacing: "1px" }}>PRIORITY</div>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {PRIORITIES.map(p => (
                              <button key={p} onClick={() => setPriorities(prev => ({ ...prev, [t.id]: p }))}
                                style={{ fontFamily: R, fontSize: "10px", padding: "4px 10px", borderRadius: "20px", border: `1.5px solid ${priorities[t.id] === p ? PRIORITY_COLORS[p] : "#2C4820"}`, background: priorities[t.id] === p ? PRIORITY_COLORS[p] + "20" : "transparent", color: priorities[t.id] === p ? PRIORITY_COLORS[p] : "#5A7A50", cursor: "pointer", letterSpacing: "1px" }}>
                                {p.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", marginBottom: "6px", letterSpacing: "1px" }}>REPLY TO MEMBER</div>
                        <textarea value={adminNotes[t.id] ?? ""} onChange={e => setAdminNotes(prev => ({ ...prev, [t.id]: e.target.value }))}
                          placeholder="Write a reply..." rows={3}
                          style={{ width: "100%", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                      </div>

                      {saveSuccess === t.id && (
                        <div style={{ background: "#1A3D14", border: "1.5px solid #3CCE2A", borderRadius: "8px", padding: "10px 14px", fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "1px", textAlign: "center" }}>
                          ✓ TICKET UPDATED
                        </div>
                      )}

                      <button onClick={() => handleSave(t.id)} disabled={saving === t.id || saveSuccess === t.id}
                        style={{ fontFamily: R, fontSize: "12px", background: saving === t.id || saveSuccess === t.id ? "#243520" : "#F07228", color: saving === t.id || saveSuccess === t.id ? "#5A7A50" : "#080F06", border: "none", borderRadius: "6px", padding: "10px", cursor: "pointer", letterSpacing: "1.5px" }}>
                        {saving === t.id ? "SAVING..." : "UPDATE TICKET"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A50", letterSpacing: "2px" }}>NO TICKETS</div>
            )}
          </div>
        </div>
      )}

      {lightboxImg && (
        <div onClick={() => setLightboxImg(null)} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <button onClick={() => setLightboxImg(null)} style={{ position: "absolute", top: "20px", right: "24px", background: "none", border: "none", color: "#F0EAD6", fontSize: "28px", cursor: "pointer" }}>✕</button>
          <img src={lightboxImg} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: "8px" }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
