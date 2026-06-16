"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState, useRef } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const CATEGORIES = [
  { value: "events", label: "Events", icon: "🎪" },
  { value: "projects", label: "Projects", icon: "🎨" },
  { value: "behind_scenes", label: "Behind the Scenes", icon: "🎬" },
];

const DEFAULT_FORM = { title: "", description: "", type: "photo", category: "events", media_url: "", thumbnail_url: "", is_published: false };

export default function AdminExclusivePage() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/exclusive").then(r => r.json()).then(({ content }) => {
      setContent(content ?? []);
      setLoading(false);
    });
  }, []);

  async function uploadFile(file: File, folder: string): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url ?? null;
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, "gallery");
    if (url) setForm(p => ({ ...p, media_url: url }));
    setUploading(false);
  }

  async function handleThumbUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, "gallery");
    if (url) setForm(p => ({ ...p, thumbnail_url: url }));
    setUploading(false);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.media_url) return;
    setSaving(true);
    const method = editingId ? "PATCH" : "POST";
    const body = editingId ? { id: editingId, ...form } : form;
    const res = await fetch("/api/exclusive", {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.content) {
      if (editingId) setContent(prev => prev.map(c => c.id === editingId ? data.content : c));
      else setContent(prev => [data.content, ...prev]);
      setForm(DEFAULT_FORM); setEditingId(null); setShowForm(false);
    }
    setSaving(false);
  }

  async function togglePublish(item: any) {
    const res = await fetch("/api/exclusive", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, is_published: !item.is_published }),
    });
    const data = await res.json();
    if (data.content) setContent(prev => prev.map(c => c.id === item.id ? data.content : c));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this content?")) return;
    await fetch(`/api/exclusive?id=${id}`, { method: "DELETE" });
    setContent(prev => prev.filter(c => c.id !== id));
  }

  function startEdit(item: any) {
    setForm({ title: item.title, description: item.description ?? "", type: item.type, category: item.category, media_url: item.media_url, thumbnail_url: item.thumbnail_url ?? "", is_published: item.is_published });
    setEditingId(item.id);
    setShowForm(true);
  }

  const filtered = activeCategory === "all" ? content : content.filter(c => c.category === activeCategory);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>EXCLUSIVE CONTENT</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Sponsor-only photos and videos</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(DEFAULT_FORM); }}
          style={{ fontFamily: R, fontSize: "11px", background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", letterSpacing: "1px" }}>
          + ADD CONTENT
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: "#FFFFFF", border: "2px solid #1A8040", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#1A8040", letterSpacing: "2px", marginBottom: "16px" }}>
            {editingId ? "EDIT CONTENT" : "NEW EXCLUSIVE CONTENT"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>TITLE *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Behind the scenes at BINI concert"
                style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>TYPE</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none" }}>
                <option value="photo">📷 Photo</option>
                <option value="video">🎬 Video</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>CATEGORY</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none" }}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>MEDIA *</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input value={form.media_url} onChange={e => setForm(p => ({ ...p, media_url: e.target.value }))}
                  placeholder="Paste URL or upload file"
                  style={{ flex: 1, background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none" }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ fontFamily: B, fontSize: "11px", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#4A7C59", cursor: "pointer" }}>
                  {uploading ? "..." : "📁 Upload"}
                </button>
              </div>
              {form.media_url && form.type === "photo" && (
                <img src={form.media_url} alt="" style={{ marginTop: "8px", height: "80px", borderRadius: "6px", objectFit: "cover" }} />
              )}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>THUMBNAIL (optional)</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))}
                  placeholder="Paste URL or upload thumbnail"
                  style={{ flex: 1, background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none" }} />
                <button onClick={() => thumbInputRef.current?.click()} disabled={uploading}
                  style={{ fontFamily: B, fontSize: "11px", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#4A7C59", cursor: "pointer" }}>
                  {uploading ? "..." : "📁 Upload"}
                </button>
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>DESCRIPTION</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="Optional description..."
                style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(p => ({ ...p, is_published: e.target.checked }))} id="publish" />
              <label htmlFor="publish" style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", cursor: "pointer" }}>Publish immediately</label>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button onClick={() => { setShowForm(false); setEditingId(null); setForm(DEFAULT_FORM); }}
              style={{ fontFamily: R, fontSize: "11px", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "6px", color: "#5A7A60", padding: "8px 16px", cursor: "pointer", letterSpacing: "1px" }}>
              CANCEL
            </button>
            <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.media_url}
              style={{ fontFamily: R, fontSize: "11px", background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", letterSpacing: "1px", opacity: (saving || !form.title.trim() || !form.media_url) ? 0.5 : 1 }}>
              {saving ? "SAVING..." : editingId ? "UPDATE" : "PUBLISH"}
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,video/mp4" style={{ display: "none" }} onChange={handleMediaUpload} />
          <input ref={thumbInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleThumbUpload} />
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => setActiveCategory("all")}
          style={{ fontFamily: R, fontSize: "11px", background: activeCategory === "all" ? "#E8F0E4" : "transparent", border: `1.5px solid ${activeCategory === "all" ? "#1A8040" : "#DDE8DD"}`, color: activeCategory === "all" ? "#1A8040" : "#5A7A60", borderRadius: "20px", padding: "5px 14px", cursor: "pointer", letterSpacing: "1px" }}>
          ALL ({content.length})
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setActiveCategory(cat.value)}
            style={{ fontFamily: R, fontSize: "11px", background: activeCategory === cat.value ? "#E8F0E4" : "transparent", border: `1.5px solid ${activeCategory === cat.value ? "#1A8040" : "#DDE8DD"}`, color: activeCategory === cat.value ? "#1A8040" : "#5A7A60", borderRadius: "20px", padding: "5px 14px", cursor: "pointer", letterSpacing: "1px" }}>
            {cat.icon} {cat.label.toUpperCase()} ({content.filter(c => c.category === cat.value).length})
          </button>
        ))}
      </div>

      {/* Content grid */}
      {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>✨</div>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#5A7A60", letterSpacing: "2px" }}>NO CONTENT YET</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {filtered.map(item => (
            <div key={item.id} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
              {/* Thumbnail */}
              <div style={{ position: "relative", height: "160px", background: "#F7FAF5" }}>
                {(item.thumbnail_url || item.media_url) && item.type === "photo" && (
                  <img src={item.thumbnail_url || item.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                {item.type === "video" && (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "32px" }}>🎬</span>
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>VIDEO</span>
                  </div>
                )}
                {/* Status badge */}
                <div style={{ position: "absolute", top: "8px", right: "8px", background: item.is_published ? "#E8F0E4" : "#E8F4EC", border: `1px solid ${item.is_published ? "#1A8040" : "#156530"}`, borderRadius: "20px", padding: "2px 8px" }}>
                  <span style={{ fontFamily: R, fontSize: "9px", color: item.is_published ? "#1A8040" : "#156530", letterSpacing: "1px" }}>
                    {item.is_published ? "PUBLISHED" : "DRAFT"}
                  </span>
                </div>
                {/* Category badge */}
                <div style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(0,0,0,0.6)", borderRadius: "20px", padding: "2px 8px" }}>
                  <span style={{ fontFamily: B, fontSize: "9px", color: "#1A8040" }}>
                    {CATEGORIES.find(c => c.value === item.category)?.icon} {item.category.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
              {/* Info */}
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", marginBottom: "6px" }}>{item.title}</div>
                {item.description && <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginBottom: "8px" }}>{item.description}</div>}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => togglePublish(item)}
                    style={{ fontFamily: B, fontSize: "10px", background: "none", border: `1px solid ${item.is_published ? "#156530" : "#1A8040"}`, borderRadius: "4px", color: item.is_published ? "#156530" : "#1A8040", padding: "4px 8px", cursor: "pointer" }}>
                    {item.is_published ? "UNPUBLISH" : "PUBLISH"}
                  </button>
                  <button onClick={() => startEdit(item)}
                    style={{ fontFamily: B, fontSize: "10px", background: "none", border: "1px solid #DDE8DD", borderRadius: "4px", color: "#4A7C59", padding: "4px 8px", cursor: "pointer" }}>
                    ✏ EDIT
                  </button>
                  <button onClick={() => handleDelete(item.id)}
                    style={{ fontFamily: B, fontSize: "10px", background: "none", border: "1px solid #CC3344", borderRadius: "4px", color: "#CC3344", padding: "4px 8px", cursor: "pointer" }}>
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
