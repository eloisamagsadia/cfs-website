"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { toISOWithPHT, toPHTInputString } from "@/lib/date";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const STATUS_OPTIONS = ["upcoming", "ongoing", "completed", "cancelled"];
const STATUS_COLORS: any = { upcoming: "#1A8040", ongoing: "#156530", completed: "#5A7A60", cancelled: "#CC3344" };

export default function AdminEventEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", date: "", location: "", map_url: "",
    capacity: "", price: "0", is_members_only: false, banner_url: "", status: "upcoming", sponsor_access_at: "", member_access_at: "",
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/events`)
      .then(r => r.json())
      .then(data => {
        const ev = data.events?.find((e: any) => e.id === id);
        if (!ev) { setError("Event not found"); setLoading(false); return; }
        setForm({
          title: ev.title ?? "", description: ev.description ?? "",
          date: ev.date ? toPHTInputString(ev.date) : "",
          location: ev.location ?? "", map_url: ev.map_url ?? "",
          capacity: ev.capacity ? String(ev.capacity) : "",
          price: String(ev.price ?? 0), is_members_only: ev.is_members_only ?? false,
          banner_url: ev.banner_url ?? "", status: ev.status ?? "upcoming", sponsor_access_at: ev.sponsor_access_at ? toPHTInputString(ev.sponsor_access_at) : "", member_access_at: ev.member_access_at ? toPHTInputString(ev.member_access_at) : "",
        });
        setLoading(false);
      })
      .catch(() => { setError("Failed to load event"); setLoading(false); });
  }, [id]);

  const handleSave = async () => {
    setError("");
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.date) return setError("Date is required.");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...form, date: toISOWithPHT(form.date), price: Number(form.price), capacity: form.capacity ? Number(form.capacity) : null, sponsor_access_at: toISOWithPHT(form.sponsor_access_at), member_access_at: toISOWithPHT(form.member_access_at) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push("/admin/events");
      router.refresh();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      router.push("/admin/events");
      router.refresh();
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
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>EDIT EVENT</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>Update or remove this event</p>
        </div>
        <button onClick={() => router.back()} style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>

      {error && <div style={{ background: "#2C1010", border: "2px solid #CC3344", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}

      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div><label style={labelStyle}>EVENT TITLE *</label><input style={inputStyle} value={form.title} onChange={e => set("title", e.target.value)} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} /></div>

        <div className="edit-event-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div><label style={labelStyle}>DATE & TIME *</label><input type="datetime-local" style={inputStyle} value={form.date} onChange={e => set("date", e.target.value)} /></div>
          <div><label style={labelStyle}>LOCATION</label><input style={inputStyle} value={form.location} onChange={e => set("location", e.target.value)} /></div>
        </div>

        <div className="edit-event-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div><label style={labelStyle}>PRICE (₱)</label><input type="number" style={inputStyle} value={form.price} onChange={e => set("price", e.target.value)} /></div>
          <div><label style={labelStyle}>CAPACITY</label><input type="number" style={inputStyle} value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="Blank = unlimited" /></div>
        </div>

        <div><label style={labelStyle}>BANNER URL</label><input style={inputStyle} value={form.banner_url} onChange={e => set("banner_url", e.target.value)} placeholder="https://..." /></div>
        <div><label style={labelStyle}>MAP URL</label><input style={inputStyle} value={form.map_url} onChange={e => set("map_url", e.target.value)} placeholder="Google Maps URL" /></div>

        {/* Status */}
        <div>
          <label style={labelStyle}>STATUS</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => set("status", s)} style={{ fontFamily: R, fontSize: "11px", letterSpacing: "1px", padding: "6px 14px", borderRadius: "20px", border: `2px solid ${STATUS_COLORS[s]}`, background: form.status === s ? STATUS_COLORS[s] : "transparent", color: form.status === s ? "#080F06" : STATUS_COLORS[s], cursor: "pointer" }}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Members only */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => set("is_members_only", !form.is_members_only)} style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", background: form.is_members_only ? "#1A8040" : "#DDE8DD", position: "relative", transition: "background 0.2s" }}>
            <span style={{ position: "absolute", top: "3px", left: form.is_members_only ? "22px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#1B3A2D", transition: "left 0.2s" }} />
          </button>
          <span style={{ fontFamily: B, fontSize: "13px", color: form.is_members_only ? "#1A8040" : "#5A7A60" }}>
            {form.is_members_only ? "Members only" : "Open to everyone"}
          </span>
        </div>
      </div>

      {/* Early access */}
      <div style={{ background: "#1A804010", border: "1.5px solid #1A804060", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontFamily: R, fontSize: "11px", color: "#1A8040", letterSpacing: "2px" }}>✦ SPONSOR EARLY ACCESS (optional)</div>
        <div className="edit-event-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={labelStyle}>Early Access Opens</label>
            <input type="datetime-local" style={inputStyle} value={form.sponsor_access_at} onChange={e => set("sponsor_access_at", e.target.value)} />
            <span style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60" }}>Sponsors get first access from this date & time (PHT)</span>
          </div>
          <div>
            <label style={labelStyle}>General Registration Opens</label>
            <input type="datetime-local" style={inputStyle} value={form.member_access_at} onChange={e => set("member_access_at", e.target.value)} />
            <span style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60" }}>Open to all members from this date & time (PHT)</span>
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
          ? <button onClick={() => setConfirmDelete(true)} style={{ fontFamily: B, fontSize: "12px", background: "none", border: "2px solid #CC3344", borderRadius: "6px", color: "#CC3344", padding: "10px 16px", cursor: "pointer" }}>🗑 Delete Event</button>
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
