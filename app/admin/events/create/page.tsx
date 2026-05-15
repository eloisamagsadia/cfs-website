"use client";
import { useState } from "react";
import { toISOWithPHT } from "@/lib/date";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/admin/FileUpload";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default function CreateEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "", map_url: "", price: "0", capacity: "", is_members_only: false, banner_url: "", status: "upcoming", sponsor_access_at: "", member_access_at: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const upd = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const inputStyle = { width: "100%", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", textTransform: "uppercase" as const, display: "block", marginBottom: "6px" };
  const STATUS_OPTIONS = ["upcoming", "ongoing", "completed", "cancelled"];
  const STATUS_COLORS: any = { upcoming: "#3CCE2A", ongoing: "#F5C82A", completed: "#5A7A50", cancelled: "#F04060" };

  async function handleSave() {
    if (!form.title || !form.date) { setError("Title and date are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: toISOWithPHT(form.date), price: Number(form.price) || 0, capacity: form.capacity ? Number(form.capacity) : null, sponsor_access_at: toISOWithPHT(form.sponsor_access_at), member_access_at: toISOWithPHT(form.member_access_at) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      router.push("/admin/events"); router.refresh();
    } catch (e: any) { setError(e.message); setSaving(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "720px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>CREATE EVENT</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Add a new CFS event</p>
        </div>
        <button onClick={() => router.back()} style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>

      {error && <div style={{ background: "#2C1010", border: "2px solid #F04060", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#F04060" }}>{error}</div>}

      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div><label style={labelStyle}>Event Title *</label><input style={inputStyle} value={form.title} onChange={e => upd("title", e.target.value)} placeholder="CFS Fam Meet 2026" /></div>
        <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }} value={form.description} onChange={e => upd("description", e.target.value)} placeholder="Event details..." /></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div><label style={labelStyle}>Date & Time *</label><input type="datetime-local" style={inputStyle} value={form.date} onChange={e => upd("date", e.target.value)} /></div>
          <div><label style={labelStyle}>Location</label><input style={inputStyle} value={form.location} onChange={e => upd("location", e.target.value)} placeholder="Quezon City, PH" /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div><label style={labelStyle}>Price (₱)</label><input type="number" style={inputStyle} value={form.price} onChange={e => upd("price", e.target.value)} placeholder="0 for free" /></div>
          <div><label style={labelStyle}>Capacity</label><input type="number" style={inputStyle} value={form.capacity} onChange={e => upd("capacity", e.target.value)} placeholder="Blank = unlimited" /></div>
        </div>

        <div><label style={labelStyle}>Map URL</label><input style={inputStyle} value={form.map_url} onChange={e => upd("map_url", e.target.value)} placeholder="Google Maps URL" /></div>

        {/* Banner upload */}
        <FileUpload
          folder="events"
          label="BANNER IMAGE"
          currentUrl={form.banner_url}
          onUploaded={url => upd("banner_url", url)}
          onRemove={() => upd("banner_url", "")}
        />

        {/* Status */}
        <div>
          <label style={labelStyle}>Status</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => upd("status", s)} style={{ fontFamily: R, fontSize: "11px", letterSpacing: "1px", padding: "6px 14px", borderRadius: "20px", border: `2px solid ${STATUS_COLORS[s]}`, background: form.status === s ? STATUS_COLORS[s] : "transparent", color: form.status === s ? "#080F06" : STATUS_COLORS[s], cursor: "pointer" }}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Members only */}
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <input type="checkbox" checked={form.is_members_only} onChange={e => upd("is_members_only", e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "#3CCE2A" }} />
          <span style={{ fontFamily: R, fontSize: "12px", color: "#8AAA78", letterSpacing: "1px" }}>MEMBERS ONLY EVENT</span>
        </label>

        {/* Early access */}
        <div style={{ background: "#B47FE310", border: "1.5px solid #B47FE360", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#B47FE3", letterSpacing: "2px" }}>✦ SPONSOR EARLY ACCESS (optional)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Early Access Opens</label>
              <input type="datetime-local" style={inputStyle} value={form.sponsor_access_at} onChange={e => upd("sponsor_access_at", e.target.value)} />
              <span style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50" }}>Sponsors get first access from this date & time (PHT)</span>
            </div>
            <div>
              <label style={labelStyle}>General Registration Opens</label>
              <input type="datetime-local" style={inputStyle} value={form.member_access_at} onChange={e => upd("member_access_at", e.target.value)} />
              <span style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50" }}>Open to all members from this date & time (PHT)</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => router.back()} style={{ fontFamily: R, fontSize: "12px", background: "transparent", border: "1.5px solid #2C4820", borderRadius: "6px", color: "#5A7A50", padding: "10px 20px", cursor: "pointer", letterSpacing: "1px" }}>CANCEL</button>
          <button onClick={handleSave} disabled={saving} style={{ position: "relative", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
            <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
            <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "12px", background: saving ? "#1A3D14" : "#3CCE2A", color: saving ? "#5A7A50" : "#080F06", padding: "10px 22px", border: "2px solid #080F06", borderRadius: "6px", letterSpacing: "1.5px" }}>{saving ? "SAVING..." : "SAVE EVENT ✦"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
