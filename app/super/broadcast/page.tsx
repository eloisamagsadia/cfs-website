"use client";
import { useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default function BroadcastPage() {
  const [form, setForm] = useState({ title: "", message: "", link: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<number | null>(null);
  const upd = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function send() {
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true);
    const res = await fetch("/api/admin/broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) { setSent(data.sent); setForm({ title: "", message: "", link: "" }); }
    setSending(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", marginBottom: "4px" }}>BROADCAST</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Send a notification to all members on the platform</p>
      </div>

      {sent !== null && (
        <div style={{ background: "#E8F0E4", border: "2px solid #1A8040", borderRadius: "10px", padding: "14px 18px", fontFamily: B, fontSize: "13px", color: "#1A8040" }}>
          ✅ Broadcast sent to {sent} members!
        </div>
      )}

      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {[
          { label: "TITLE *", key: "title", placeholder: "e.g. New event announced! 🎉" },
          { label: "LINK (optional)", key: "link", placeholder: "e.g. /events or /members/community" },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>{label}</label>
            <input value={(form as any)[key]} onChange={e => upd(key, e.target.value)} placeholder={placeholder}
              style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        ))}
        <div>
          <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>MESSAGE *</label>
          <textarea value={form.message} onChange={e => upd("message", e.target.value)} rows={4} placeholder="Type your message..."
            style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" as const }} />
        </div>
        <button onClick={send} disabled={sending || !form.title.trim() || !form.message.trim()}
          style={{ fontFamily: R, fontSize: "12px", background: "#1A8040", color: "#F7FAF5", border: "none", borderRadius: "8px", padding: "12px 24px", cursor: "pointer", letterSpacing: "1.5px", opacity: (sending || !form.title.trim() || !form.message.trim()) ? 0.5 : 1 }}>
          {sending ? "SENDING..." : "📣 SEND TO ALL MEMBERS"}
        </button>
      </div>
    </div>
  );
}
