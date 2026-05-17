"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const inp = { width: "100%", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "10px 14px", color: "#F0EAD6", fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

const CATEGORIES = ["general", "orders", "events", "account", "technical", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  general: "General Inquiry", orders: "Orders & Shipping", events: "Events & Tickets",
  account: "Account Issues", technical: "Technical Problem", other: "Other",
};

export default function SupportPage() {
  const router = useRouter();
  const [form, setForm] = useState({ subject: "", message: "", category: "general" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [attachments, setAttachments] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "support");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url ?? null;
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3);
    const newFiles = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setAttachments(prev => [...prev, ...newFiles].slice(0, 3));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit() {
    if (!form.subject.trim() || !form.message.trim()) { setError("Subject and message are required."); return; }
    setSaving(true); setUploading(true); setError("");

    let uploadedUrls: string[] = [];
    for (const a of attachments) {
      const url = await uploadFile(a.file);
      if (url) uploadedUrls.push(url);
    }
    setUploading(false);

    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, attachments: uploadedUrls }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to submit ticket"); setSaving(false); return; }
    setSuccess(true);
    setSaving(false);
  }

  if (success) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>
      <div style={{ background: "#1A3D14", border: "2px solid #3CCE2A", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
        <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}><svg width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="28" fill="#1A3D14"/><circle cx="28" cy="28" r="26" stroke="#3CCE2A" strokeWidth="2"/><path d="M17 28.5L24 36L39 21" stroke="#3CCE2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        <div style={{ fontFamily: R, fontSize: "1.2rem", color: "#3CCE2A", letterSpacing: "2px", marginBottom: "8px" }}>TICKET SUBMITTED</div>
        <div style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78", lineHeight: 1.6, marginBottom: "24px" }}>
          We received your message and will get back to you soon. You can track your tickets below.
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={() => { setSuccess(false); setForm({ subject: "", message: "", category: "general" }); setAttachments([]); }}
            style={{ fontFamily: R, fontSize: "11px", background: "transparent", border: "1.5px solid #2C4820", borderRadius: "6px", color: "#5A7A50", padding: "8px 16px", cursor: "pointer", letterSpacing: "1px" }}>
            SUBMIT ANOTHER
          </button>
          <button onClick={() => router.push("/members/support/tickets")}
            style={{ fontFamily: R, fontSize: "11px", background: "#3CCE2A", color: "#080F06", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", letterSpacing: "1px" }}>
            VIEW MY TICKETS
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "600px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>HELP & SUPPORT</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Submit a ticket and we'll get back to you.</p>
      </div>

      {error && <div style={{ background: "#2C1010", border: "2px solid #F04060", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#F04060" }}>{error}</div>}

      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>CATEGORY</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setForm(p => ({ ...p, category: c }))}
                style={{ fontFamily: B, fontSize: "11px", background: form.category === c ? "#1A3D14" : "transparent", border: `1.5px solid ${form.category === c ? "#3CCE2A" : "#2C4820"}`, borderRadius: "6px", padding: "6px 12px", color: form.category === c ? "#3CCE2A" : "#5A7A50", cursor: "pointer" }}>
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>SUBJECT *</label>
          <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Brief description of your issue" style={inp} />
        </div>

        <div>
          <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>MESSAGE *</label>
          <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
            placeholder="Describe your issue in detail..." rows={5} style={{ ...inp, resize: "vertical" }} />
        </div>

        {/* Attachments */}
        <div>
          <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>ATTACHMENTS <span style={{ color: "#3A5A30" }}>(up to 3 photos)</span></label>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
          {attachments.length < 3 && (
            <button onClick={() => fileRef.current?.click()}
              style={{ fontFamily: B, fontSize: "12px", background: "transparent", border: "1.5px dashed #2C4820", borderRadius: "8px", color: "#5A7A50", padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
              📎 Attach Photo
            </button>
          )}
          {attachments.length > 0 && (
            <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
              {attachments.map((a, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={a.preview} alt="" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1.5px solid #2C4820" }} />
                  <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                    style={{ position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", background: "#F04060", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={saving}
          style={{ fontFamily: R, fontSize: "12px", background: saving ? "#243520" : "#3CCE2A", color: saving ? "#5A7A50" : "#080F06", border: "none", borderRadius: "6px", padding: "12px", cursor: saving ? "not-allowed" : "pointer", letterSpacing: "1.5px", opacity: saving ? 0.7 : 1 }}>
          {uploading ? "UPLOADING..." : saving ? "SUBMITTING..." : "SUBMIT TICKET"}
        </button>
      </div>

      <div style={{ textAlign: "center" }}>
        <button onClick={() => router.push("/members/support/tickets")}
          style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          View my previous tickets →
        </button>
      </div>
    </div>
  );
}
