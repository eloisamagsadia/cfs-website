"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const currentYear = new Date().getFullYear();

export default function AdminReportEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", year: String(currentYear), quarter: "1",
    summary: "", content: "", pdf_url: "", is_published: false,
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) return;
    fetch("/api/admin/reports").then(r => r.json()).then(data => {
      const r = data.reports?.find((r: any) => r.id === id);
      if (!r) { setError("Report not found"); setLoading(false); return; }
      setForm({
        title: r.title ?? "", year: String(r.year ?? currentYear),
        quarter: String(r.quarter ?? 1), summary: r.summary ?? "",
        content: r.content ?? "", pdf_url: r.pdf_url ?? "",
        is_published: r.is_published ?? false,
      });
      setLoading(false);
    }).catch(() => { setError("Failed to load"); setLoading(false); });
  }, [id]);

  const handleSave = async () => {
    setError("");
    if (!form.title.trim()) return setError("Title is required.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...form, year: Number(form.year), quarter: Number(form.quarter) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push("/admin/reports"); router.refresh();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/reports?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      router.push("/admin/reports"); router.refresh();
    } catch (e: any) { setError(e.message); setDeleting(false); setConfirmDelete(false); }
  };

  const inputStyle = { width: "100%", background: "#0F1A0C", border: "2px solid #DDE8DD", borderRadius: "8px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { fontFamily: B, fontSize: "12px", color: "#4A7C59", letterSpacing: "1px", marginBottom: "6px", display: "block" };

<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "720px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>EDIT REPORT</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>Update or remove this transparency report</p>
        </div>
        <button onClick={() => router.back()} style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>

      {error && <div style={{ background: "#2C1010", border: "2px solid #CC3344", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}

      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>

        <div><label style={labelStyle}>REPORT TITLE *</label><input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} /></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>YEAR *</label>
            <select style={inputStyle} value={form.year} onChange={e => set("year", e.target.value)}>
              {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>QUARTER *</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[1, 2, 3, 4].map(q => (
                <button key={q} onClick={() => set("quarter", String(q))} style={{ flex: 1, fontFamily: R, fontSize: "13px", padding: "10px 0", borderRadius: "8px", border: `2px solid ${form.quarter === String(q) ? "#1A8040" : "#DDE8DD"}`, background: form.quarter === String(q) ? "#E8F0E4" : "#0F1A0C", color: form.quarter === String(q) ? "#1A8040" : "#5A7A60", cursor: "pointer", letterSpacing: "1px" }}>
                  Q{q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div><label style={labelStyle}>SUMMARY</label><textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={form.summary} onChange={e => set("summary", e.target.value)} /></div>
        <div><label style={labelStyle}>FULL CONTENT</label><textarea style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }} value={form.content} onChange={e => set("content", e.target.value)} /></div>
        <div>
          <label style={labelStyle}>PDF URL</label>
          <input style={inputStyle} placeholder="https://..." value={form.pdf_url} onChange={e => set("pdf_url", e.target.value)} />
        </div>

        {/* Publish toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", background: form.is_published ? "#E8F0E4" : "#0F1A0C", border: `2px solid ${form.is_published ? "#1A8040" : "#DDE8DD"}`, borderRadius: "8px", padding: "14px 16px" }}>
          <button onClick={() => set("is_published", !form.is_published)} style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", background: form.is_published ? "#1A8040" : "#DDE8DD", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
            <span style={{ position: "absolute", top: "3px", left: form.is_published ? "22px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#1B3A2D", transition: "left 0.2s" }} />
          </button>
          <div>
            <div style={{ fontFamily: R, fontSize: "12px", color: form.is_published ? "#1A8040" : "#5A7A60", letterSpacing: "1px" }}>
              {form.is_published ? "PUBLISHED" : "DRAFT"}
            </div>
            <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "2px" }}>
              {form.is_published ? "Visible to the public" : "Only visible to admins"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={handleSave} disabled={saving} style={{ position: "relative", display: "inline-block", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
            <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "12px", background: "#1A8040", color: "#FFFFFF", padding: "10px 28px", border: "2px solid #1B3A2D", borderRadius: "6px", letterSpacing: "1.5px" }}>
              {saving ? "SAVING..." : "SAVE CHANGES"}
            </span>
          </button>
          <button onClick={() => router.back()} style={{ fontFamily: R, fontSize: "12px", background: "none", border: "2px solid #DDE8DD", borderRadius: "6px", color: "#5A7A60", padding: "10px 20px", cursor: "pointer", letterSpacing: "1px" }}>CANCEL</button>
        </div>
        {!confirmDelete
          ? <button onClick={() => setConfirmDelete(true)} style={{ fontFamily: B, fontSize: "12px", background: "none", border: "2px solid #CC3344", borderRadius: "6px", color: "#CC3344", padding: "10px 16px", cursor: "pointer" }}>🗑 Delete Report</button>
          : <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontFamily: B, fontSize: "12px", color: "#CC3344" }}>Sure?</span>
              <button onClick={handleDelete} disabled={deleting} style={{ fontFamily: B, fontSize: "12px", background: "#CC3344", border: "none", borderRadius: "6px", color: "#fff", padding: "8px 14px", cursor: "pointer" }}>{deleting ? "Deleting..." : "Yes, Delete"}</button>
              <button onClick={() => setConfirmDelete(false)} style={{ fontFamily: B, fontSize: "12px", background: "none", border: "2px solid #DDE8DD", borderRadius: "6px", color: "#5A7A60", padding: "8px 14px", cursor: "pointer" }}>Cancel</button>
            </div>
        }
      </div>
    </div>
  );
}
