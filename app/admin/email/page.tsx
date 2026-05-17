"use client";
import { useState, useEffect } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const ROLE_COLORS: Record<string, string> = {
  super_admin: "#F5C82A", admin: "#F07228", moderator: "#69C9D0",
  sponsor: "#B47FE3", member: "#3CCE2A",
};

const TEMPLATES = [
  {
    id: "thankyou",
    label: "Thank You",
    emoji: "♥",
    subject: "Thank you for your support, [NAME]!",
    message: `Dear [NAME],

We wanted to take a moment to express our heartfelt gratitude for your continued support of CFS Bini Colet Fan Club.

Your kindness and generosity mean the world to us and to Colet. Because of supporters like you, we are able to continue doing what we love — bringing fans together and supporting Colet on her journey.

Salamat sa lahat! We truly appreciate you.

With love,
CFS Bini Colet Fan Club ♥`,
  },
  {
    id: "reward",
    label: "Reward / Badge",
    emoji: "✦",
    subject: "You earned a special reward, [NAME]! ✦",
    message: `Hi [NAME],

Great news — you've earned a special recognition from CFS Bini Colet Fan Club!

Your dedication and support have not gone unnoticed. We see you, and we appreciate everything you do for the community.

Keep being amazing!

With love,
CFS Bini Colet Fan Club ✦`,
  },
  {
    id: "announcement",
    label: "Announcement",
    emoji: "📣",
    subject: "Important update from CFS Bini Colet Fan Club",
    message: `Hi [NAME],

We have exciting news to share with you!

[Write your announcement here]

Stay tuned for more updates. Thank you for being part of the CFS family!

With love,
CFS Bini Colet Fan Club`,
  },
];

export default function AdminEmailPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/members").then(r => r.json()).then(d => setMembers(d.members ?? []));
  }, []);

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || (m.display_name ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q);
    const matchRole = filterRole === "all" || m.role === filterRole;
    return matchSearch && matchRole && m.email;
  });

  function toggleMember(m: any) {
    setSelected(prev => prev.find(s => s.id === m.id) ? prev.filter(s => s.id !== m.id) : [...prev, m]);
  }

  function selectAll() { setSelected(filtered.filter(m => m.email)); }
  function clearAll() { setSelected([]); }

  async function handleSend() {
    if (!selected.length) { setError("Select at least one recipient."); return; }
    if (!subject.trim() || !message.trim()) { setError("Subject and message are required."); return; }
    setSending(true); setError(""); setSuccess("");
    const res = await fetch("/api/admin/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipients: selected.map(m => ({ email: m.email, name: m.display_name })),
        subject: subject.trim(),
        message: message.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to send"); setSending(false); return; }
    setSuccess(`Email sent to ${selected.length} recipient${selected.length > 1 ? "s" : ""}!`);
    setSelected([]);
    setSubject("");
    setMessage("");
    setSending(false);
  }

  const inp = { width: "100%", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>SEND EMAIL</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Send a custom email to any member.</p>
      </div>

      {error && <div style={{ background: "#2C1010", border: "2px solid #F04060", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#F04060" }}>{error}</div>}
      {success && <div style={{ background: "#1A3D14", border: "2px solid #3CCE2A", borderRadius: "8px", padding: "12px 16px", fontFamily: R, fontSize: "13px", color: "#3CCE2A", letterSpacing: "1px" }}>✓ {success}</div>}

      <div className="email-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* Recipients */}
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#8AAA78", letterSpacing: "2px" }}>RECIPIENTS</div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["all", "sponsor", "admin", "moderator", "member"].map(r => (
              <button key={r} onClick={() => setFilterRole(r)}
                style={{ fontFamily: R, fontSize: "10px", padding: "4px 10px", borderRadius: "20px", border: `1.5px solid ${filterRole === r ? (ROLE_COLORS[r] ?? "#3CCE2A") : "#2C4820"}`, background: filterRole === r ? (ROLE_COLORS[r] ?? "#3CCE2A") + "20" : "transparent", color: filterRole === r ? (ROLE_COLORS[r] ?? "#3CCE2A") : "#5A7A50", cursor: "pointer", letterSpacing: "1px" }}>
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." style={inp} />

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={selectAll} style={{ fontFamily: B, fontSize: "11px", background: "transparent", border: "1.5px solid #2C4820", borderRadius: "6px", color: "#8AAA78", padding: "5px 10px", cursor: "pointer" }}>Select All ({filtered.length})</button>
            <button onClick={clearAll} style={{ fontFamily: B, fontSize: "11px", background: "transparent", border: "1.5px solid #2C4820", borderRadius: "6px", color: "#5A7A50", padding: "5px 10px", cursor: "pointer" }}>Clear</button>
          </div>

          <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
            {filtered.map(m => {
              const isSelected = !!selected.find(s => s.id === m.id);
              const color = ROLE_COLORS[m.role] ?? "#3CCE2A";
              return (
                <div key={m.id} onClick={() => toggleMember(m)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", background: isSelected ? "#1A3D14" : "transparent", border: `1.5px solid ${isSelected ? "#3CCE2A" : "transparent"}` }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: `2px solid ${isSelected ? "#3CCE2A" : "#2C4820"}`, background: isSelected ? "#3CCE2A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isSelected && <span style={{ color: "#080F06", fontSize: "12px", fontWeight: "bold" }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6" }}>{m.display_name}</div>
                    <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{m.email}</div>
                  </div>
                  <span style={{ fontFamily: R, fontSize: "9px", color, background: color + "20", borderRadius: "20px", padding: "2px 8px", flexShrink: 0 }}>{m.role?.toUpperCase()}</span>
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ padding: "20px", textAlign: "center", fontFamily: B, fontSize: "12px", color: "#3A5A30" }}>No members found</div>}
          </div>

          {selected.length > 0 && (
            <div style={{ fontFamily: B, fontSize: "12px", color: "#3CCE2A", padding: "6px 12px", background: "#1A3D14", borderRadius: "6px" }}>
              {selected.length} recipient{selected.length > 1 ? "s" : ""} selected
            </div>
          )}
        </div>

        {/* Compose */}
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#8AAA78", letterSpacing: "2px", marginBottom: "4px" }}>TEMPLATES</div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => {
                setActiveTemplate(t.id);
                setSubject(t.subject);
                setMessage(t.message);
              }}
                style={{ fontFamily: B, fontSize: "11px", background: activeTemplate === t.id ? "#1A3D14" : "#243520", border: `1.5px solid ${activeTemplate === t.id ? "#3CCE2A" : "#2C4820"}`, borderRadius: "6px", padding: "6px 12px", color: activeTemplate === t.id ? "#3CCE2A" : "#8AAA78", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{t.emoji}</span>{t.label}
              </button>
            ))}
            {activeTemplate && (
              <button onClick={() => { setActiveTemplate(null); setSubject(""); setMessage(""); }}
                style={{ fontFamily: B, fontSize: "11px", background: "transparent", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "6px 10px", color: "#5A7A50", cursor: "pointer" }}>
                Clear
              </button>
            )}
          </div>
          {activeTemplate && (
            <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", marginBottom: "8px", background: "#0F1A0B", borderRadius: "6px", padding: "6px 10px" }}>
              💡 Use [NAME] as placeholder — it will be replaced with each recipient's name.
            </div>
          )}
          <div style={{ fontFamily: R, fontSize: "11px", color: "#8AAA78", letterSpacing: "2px" }}>COMPOSE</div>

          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>SUBJECT *</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Thank you for your support!" style={inp} />
          </div>

          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>MESSAGE *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Write your message here..."
              rows={10}
              style={{ ...inp, resize: "vertical" }} />
          </div>

          <button onClick={handleSend} disabled={sending || !selected.length || !subject || !message}
            style={{ fontFamily: R, fontSize: "12px", background: sending || !selected.length || !subject || !message ? "#243520" : "#3CCE2A", color: sending || !selected.length || !subject || !message ? "#5A7A50" : "#080F06", border: "none", borderRadius: "6px", padding: "12px", cursor: "pointer", letterSpacing: "1.5px" }}>
            {sending ? "SENDING..." : `SEND TO ${selected.length} RECIPIENT${selected.length !== 1 ? "S" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
