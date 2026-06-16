"use client";
import { useEffect, useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const NOTIF_TYPES = [
  { value: "announcement",   label: "📣 Announcement" },
  { value: "event_reminder", label: "🎫 Event Reminder" },
  { value: "order_update",   label: "🛍 Order Update" },
  { value: "badge_earned",   label: "⭐ Badge" },
  { value: "new_report",     label: "📋 New Report" },
];

const TYPE_ICONS: Record<string, string> = {
  announcement: "📣", event_reminder: "🎫", order_update: "🛍",
  community_reply: "💬", badge_earned: "⭐", new_follower: "👤",
  donation_ack: "♥", new_report: "📋", community_mention: "📢",
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD",
  borderRadius: "6px", padding: "10px 14px", color: "#1B3A2D",
  fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box",
};

export default function AdminNotificationsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [target, setTarget] = useState<"all" | "member" | "event">("all");
  const [form, setForm] = useState({ title: "", message: "", type: "announcement", link: "", targetUserId: "", eventId: "" });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  useEffect(() => { loadStats(); loadMembers(); loadEvents(); }, []);

  async function loadStats() {
    setLoadingStats(true);
    const res = await fetch("/api/admin/notifications/stats");
    const data = await res.json();
    setStats(data);
    setLoadingStats(false);
  }

  async function loadMembers() {
    const res1 = await fetch("/api/admin/members"); const d1 = await res1.json(); const data = d1.members ?? [];
    setMembers(data ?? []);
  }

  async function loadEvents() {
    const res2 = await fetch("/api/admin/events"); const d2 = await res2.json(); const data = d2.events ?? [];
    setEvents(data ?? []);
  }

  function upd(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSend() {
    if (!form.title.trim() || !form.message.trim()) {
      setResult({ ok: false, msg: "Title and message are required." }); return;
    }
    if (target === "member" && !form.targetUserId) {
      setResult({ ok: false, msg: "Please select a member." }); return;
    }
    if (target === "event" && !form.eventId) {
      setResult({ ok: false, msg: "Please select an event." }); return;
    }

    setSending(true); setResult(null);
    try {
      const res = await fetch("/api/admin/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ ok: true, msg: `✦ Sent to ${data.sent} member${data.sent !== 1 ? "s" : ""}!` });
      setForm({ title: "", message: "", type: "announcement", link: "", targetUserId: "", eventId: "" });
      await loadStats();
    } catch (e: any) {
      setResult({ ok: false, msg: e.message ?? "Failed to send." });
    } finally {
      setSending(false);
    }
  }

  const filteredMembers = members.filter(m =>
    !memberSearch || m.display_name?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div>
        <div style={{ display: "inline-block", background: "#F07228", border: "2px solid #080F06", borderRadius: "6px", padding: "3px 12px", marginBottom: "8px" }}>
          <span style={{ fontFamily: R, fontSize: "10px", color: "#080F06", letterSpacing: "2px" }}>⚠ ADMIN ONLY</span>
        </div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>NOTIFICATIONS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Broadcast messages, send reminders, and track engagement</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "10px" }}>
        {[
          { label: "TOTAL SENT",   value: loadingStats ? "..." : (stats?.total ?? 0),       color: "#1B3A2D", bg: "#FFFFFF" },
          { label: "TOTAL READ",   value: loadingStats ? "..." : (stats?.read ?? 0),        color: "#3CCE2A", bg: "#E8F0E4" },
          { label: "UNREAD",       value: loadingStats ? "..." : (stats?.unread ?? 0),      color: "#F5C82A", bg: "#3D3000" },
          { label: "READ RATE",    value: loadingStats ? "..." : `${stats?.readRate ?? 0}%`, color: "#F07228", bg: "#3D1A0A" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ position: "relative", padding: "4px 4px 6px 0" }}>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "calc(100% - 4px)", height: "calc(100% - 4px)", borderRadius: "10px", background: "#080F06" }}/>
            <div style={{ position: "relative", background: bg, border: "2px solid #DDE8DD", borderRadius: "10px", padding: "16px", zIndex: 1 }}>
              <div style={{ fontFamily: R, fontSize: "1.6rem", color, letterSpacing: "1px" }}>{value}</div>
              <div style={{ fontFamily: B, fontSize: "11px", color: "#4A7C59", letterSpacing: "1px" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Type breakdown */}
      {stats?.byType?.length > 0 && (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "2px", marginBottom: "14px" }}>ENGAGEMENT BY TYPE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {stats.byType.map((t: any) => (
              <div key={t.type} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px", flexShrink: 0 }}>{TYPE_ICONS[t.type] ?? "🔔"}</span>
                <span style={{ fontFamily: R, fontSize: "11px", color: "#4A7C59", letterSpacing: "1px", width: "140px", flexShrink: 0, textTransform: "uppercase" }}>
                  {t.type.replace(/_/g, " ")}
                </span>
                <div style={{ flex: 1, height: "8px", background: "#F2F7F2", borderRadius: "20px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${t.readRate}%`, background: "#3CCE2A", borderRadius: "20px", transition: "width 0.5s" }}/>
                </div>
                <span style={{ fontFamily: R, fontSize: "11px", color: "#3CCE2A", width: "50px", textAlign: "right", flexShrink: 0 }}>{t.readRate}%</span>
                <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", flexShrink: 0 }}>{t.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compose form */}
      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "24px" }}>
        <div style={{ fontFamily: R, fontSize: "14px", color: "#F07228", letterSpacing: "2px", marginBottom: "18px" }}>SEND NOTIFICATION</div>

        {/* Target selector */}
        <div style={{ marginBottom: "18px" }}>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "8px", textTransform: "uppercase" }}>Send To</div>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { v: "all",    label: "📢 All Members" },
              { v: "member", label: "👤 Specific Member" },
              { v: "event",  label: "🎫 Event Registrants" },
            ].map(({ v, label }) => (
              <button key={v} onClick={() => setTarget(v as any)} style={{
                fontFamily: R, fontSize: "11px", letterSpacing: "1px",
                background: target === v ? "#3D1A0A" : "transparent",
                color: target === v ? "#F07228" : "#5A7A60",
                border: `1.5px solid ${target === v ? "#F07228" : "#DDE8DD"}`,
                borderRadius: "6px", padding: "8px 14px", cursor: "pointer", flex: 1,
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional: member search */}
        {target === "member" && (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>Search Member</div>
            <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search by name..." style={inputStyle}/>
            {memberSearch && (
              <div style={{ background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", marginTop: "4px", maxHeight: "160px", overflowY: "auto" }}>
                {filteredMembers.slice(0, 8).map(m => (
                  <div key={m.id} onClick={() => { upd("targetUserId", m.id); setMemberSearch(m.display_name ?? ""); }} style={{
                    padding: "10px 14px", cursor: "pointer", fontFamily: B, fontSize: "13px",
                    color: form.targetUserId === m.id ? "#3CCE2A" : "#1B3A2D",
                    background: form.targetUserId === m.id ? "#E8F0E4" : "transparent",
                    borderBottom: "1px solid #DDE8DD",
                  }}>
                    {m.display_name ?? "Member"}
                  </div>
                ))}
                {filteredMembers.length === 0 && (
                  <div style={{ padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>No members found</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Conditional: event selector */}
        {target === "event" && (
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>Select Event</div>
            <select value={form.eventId} onChange={e => upd("eventId", e.target.value)} style={inputStyle}>
              <option value="">Choose an event...</option>
              {events.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title} — {new Date(e.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <div style={{ gridColumn: "1/-1" }}>
            <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>Title *</div>
            <input value={form.title} onChange={e => upd("title", e.target.value)} placeholder="Notification title..." style={inputStyle} maxLength={100}/>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>Message *</div>
            <textarea value={form.message} onChange={e => upd("message", e.target.value)} placeholder="Full notification message..." rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} maxLength={300}/>
          </div>
          <div>
            <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>Type</div>
            <select value={form.type} onChange={e => upd("type", e.target.value)} style={inputStyle}>
              {NOTIF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>Link (optional)</div>
            <input value={form.link} onChange={e => upd("link", e.target.value)} placeholder="/members/events" style={inputStyle}/>
          </div>
        </div>

        {result && (
          <div style={{ background: result.ok ? "#E8F0E4" : "#3D0A18", border: `1.5px solid ${result.ok ? "#3CCE2A" : "#F04060"}`, borderRadius: "8px", padding: "12px 16px", fontFamily: R, fontSize: "13px", color: result.ok ? "#3CCE2A" : "#F04060", letterSpacing: "1px", marginBottom: "14px" }}>
            {result.msg}
          </div>
        )}

        <button onClick={handleSend} disabled={sending} style={{ position: "relative", display: "block", background: "transparent", border: "none", padding: 0, cursor: sending ? "not-allowed" : "pointer", width: "100%" }}>
          <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }}/>
          <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "14px", background: sending ? "#E8F0E4" : "#F07228", color: sending ? "#5A7A60" : "#1B3A2D", padding: "12px", border: "2px solid #080F06", borderRadius: "6px", textAlign: "center", letterSpacing: "2px" }}>
            {sending ? "SENDING..." : target === "all" ? "📣 SEND TO ALL MEMBERS" : target === "event" ? "🎫 SEND TO REGISTRANTS" : "👤 SEND TO MEMBER"}
          </span>
        </button>
      </div>

      {/* Recent history */}
      {stats?.recent?.length > 0 && (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "2px", marginBottom: "14px" }}>RECENT NOTIFICATIONS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {stats.recent.map((n: any) => (
              <div key={n.id} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #DDE8DD" }}>
                <span style={{ fontSize: "14px", flexShrink: 0 }}>{TYPE_ICONS[n.type] ?? "🔔"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "0.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: R, fontSize: "10px", color: n.is_read ? "#3CCE2A" : "#F5C82A", letterSpacing: "1px" }}>
                    {n.is_read ? "READ" : "UNREAD"}
                  </span>
                  <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{timeAgo(n.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
