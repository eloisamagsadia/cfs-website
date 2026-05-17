"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default function AdminProjectEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", status: "ongoing", progress_percent: "0", category: "" });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) return;
    fetch("/api/admin/projects").then(r => r.json()).then(data => {
      const p = data.projects?.find((p: any) => p.id === id);
      if (!p) { setError("Project not found"); setLoading(false); return; }
      setForm({ title: p.title ?? "", description: p.description ?? "", status: p.status ?? "ongoing", progress_percent: String(p.progress_percent ?? 0), category: p.category ?? "" });
      setLoading(false);
    }).catch(() => { setError("Failed to load"); setLoading(false); });
  }, [id]);

  const handleSave = async () => {
    setError("");
    if (!form.title.trim()) return setError("Title is required.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/projects", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...form, progress_percent: Number(form.progress_percent) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push("/admin/projects"); router.refresh();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/projects?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      router.push("/admin/projects"); router.refresh();
    } catch (e: any) { setError(e.message); setDeleting(false); setConfirmDelete(false); }
  };

  const inputStyle = { width: "100%", background: "#0F1A0C", border: "2px solid #2C4820", borderRadius: "8px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { fontFamily: B, fontSize: "12px", color: "#8AAA78", letterSpacing: "1px", marginBottom: "6px", display: "block" };

<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "720px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>EDIT PROJECT</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#5A7A50" }}>Update or remove this project</p>
        </div>
        <button onClick={() => router.back()} style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>

      {error && <div style={{ background: "#2C1010", border: "2px solid #F04060", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#F04060" }}>{error}</div>}

      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div><label style={labelStyle}>PROJECT TITLE *</label><input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>STATUS</label>
            <select style={inputStyle} value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div><label style={labelStyle}>CATEGORY</label><input style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)} /></div>
        </div>
        {form.status === "ongoing" && (
          <div>
            <label style={labelStyle}>PROGRESS ({form.progress_percent}%)</label>
            <input type="range" min="0" max="100" value={form.progress_percent} onChange={e => set("progress_percent", e.target.value)} style={{ width: "100%", accentColor: "#3CCE2A" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: B, fontSize: "11px", color: "#5A7A50", marginTop: "4px" }}><span>0%</span><span style={{ color: "#3CCE2A" }}>{form.progress_percent}%</span><span>100%</span></div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={handleSave} disabled={saving} style={{ position: "relative", display: "inline-block", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
            <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "12px", background: "#F07228", color: "#F0EAD6", padding: "10px 28px", border: "2px solid #080F06", borderRadius: "6px", letterSpacing: "1.5px" }}>{saving ? "SAVING..." : "SAVE CHANGES"}</span>
          </button>
          <button onClick={() => router.back()} style={{ fontFamily: R, fontSize: "12px", background: "none", border: "2px solid #2C4820", borderRadius: "6px", color: "#5A7A50", padding: "10px 20px", cursor: "pointer", letterSpacing: "1px" }}>CANCEL</button>
        </div>
        {!confirmDelete
          ? <button onClick={() => setConfirmDelete(true)} style={{ fontFamily: B, fontSize: "12px", background: "none", border: "2px solid #F04060", borderRadius: "6px", color: "#F04060", padding: "10px 16px", cursor: "pointer" }}>🗑 Delete Project</button>
          : <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontFamily: B, fontSize: "12px", color: "#F04060" }}>Sure?</span>
              <button onClick={handleDelete} disabled={deleting} style={{ fontFamily: B, fontSize: "12px", background: "#F04060", border: "none", borderRadius: "6px", color: "#fff", padding: "8px 14px", cursor: "pointer" }}>{deleting ? "Deleting..." : "Yes, Delete"}</button>
              <button onClick={() => setConfirmDelete(false)} style={{ fontFamily: B, fontSize: "12px", background: "none", border: "2px solid #2C4820", borderRadius: "6px", color: "#5A7A50", padding: "8px 14px", cursor: "pointer" }}>Cancel</button>
            </div>
        }
      </div>
    </div>
  );
}
