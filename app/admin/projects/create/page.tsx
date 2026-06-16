"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default function AdminProjectCreatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", status: "ongoing", progress_percent: "0", category: "" });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.title.trim()) return setError("Title is required.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, progress_percent: Number(form.progress_percent) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      router.push("/admin/projects"); router.refresh();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const inputStyle = { width: "100%", background: "#0F1A0C", border: "2px solid #DDE8DD", borderRadius: "8px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { fontFamily: B, fontSize: "12px", color: "#4A7C59", letterSpacing: "1px", marginBottom: "6px", display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "720px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>ADD PROJECT</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>Create a new CFS fan project</p>
        </div>
        <button onClick={() => router.back()} style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>

      {error && <div style={{ background: "#2C1010", border: "2px solid #CC3344", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}

      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div><label style={labelStyle}>PROJECT TITLE *</label><input style={inputStyle} placeholder="e.g. Colet Birthday Project 2026" value={form.title} onChange={e => set("title", e.target.value)} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} placeholder="What is this project about?" value={form.description} onChange={e => set("description", e.target.value)} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>STATUS</label>
            <select style={inputStyle} value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div><label style={labelStyle}>CATEGORY</label><input style={inputStyle} placeholder="e.g. Birthday, Charity, Promo" value={form.category} onChange={e => set("category", e.target.value)} /></div>
        </div>
        {form.status === "ongoing" && (
          <div>
            <label style={labelStyle}>PROGRESS ({form.progress_percent}%)</label>
            <input type="range" min="0" max="100" value={form.progress_percent} onChange={e => set("progress_percent", e.target.value)} style={{ width: "100%", accentColor: "#1A8040" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "4px" }}><span>0%</span><span style={{ color: "#1A8040" }}>{form.progress_percent}%</span><span>100%</span></div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={handleSubmit} disabled={saving} style={{ position: "relative", display: "inline-block", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
          <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "12px", background: "#1A8040", color: "#1B3A2D", padding: "10px 28px", border: "2px solid #1B3A2D", borderRadius: "6px", letterSpacing: "1.5px" }}>{saving ? "SAVING..." : "CREATE PROJECT"}</span>
        </button>
        <button onClick={() => router.back()} style={{ fontFamily: R, fontSize: "12px", background: "none", border: "2px solid #DDE8DD", borderRadius: "6px", color: "#5A7A60", padding: "10px 20px", cursor: "pointer", letterSpacing: "1px" }}>CANCEL</button>
      </div>
    </div>
  );
}
