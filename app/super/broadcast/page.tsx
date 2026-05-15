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
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F5C82A", letterSpacing: "3px", marginBottom: "4px" }}>BROADCAST</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Send a notification to all members on the platform</p>
      </div>

      {sent !== null && (
        <div style={{ background: "#1A3D14", border: "2px solid #3CCE2A", borderRadius: "10px", padding: "14px 18px", fontFamily: B, fontSize: "13px", color: "#3CCE2A" }}>
          ✅ Broadcast sent to {sent} members!
        </div>
      )}

      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {[
          { label: "TITLE *", key: "title", placeholder: "e.g. New event announced! 🎉" },
          { label: "LINK (optional)", key: "link", placeholder: "e.g. /events or /members/community" },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", display: "block", marginBottom: "4px" }}>{label}</label>
            <input value={(form as any)[key]} onChange={e => upd(key, e.target.value)} placeholder={placeholder}
              style={{ width: "100%", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        ))}
        <div>
          <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", display: "block", marginBottom: "4px" }}>MESSAGE *</label>
          <textarea value={form.message} onChange={e => upd("message", e.target.value)} rows={4} placeholder="Type your message..."
            style={{ width: "100%", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" as const }} />
        </div>
        <button onClick={send} disabled={sending || !form.title.trim() || !form.message.trim()}
          style={{ fontFamily: R, fontSize: "12px", background: "#3CCE2A", color: "#080F06", border: "none", borderRadius: "8px", padding: "12px 24px", cursor: "pointer", letterSpacing: "1.5px", opacity: (sending || !form.title.trim() || !form.message.trim()) ? 0.5 : 1 }}>
          {sending ? "SENDING..." : "📣 SEND TO ALL MEMBERS"}
        </button>
      </div>
    </div>
  );
}
