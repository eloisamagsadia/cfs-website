"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD",
  borderRadius: "6px", padding: "10px 14px", color: "#1B3A2D",
  fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px",
  textTransform: "uppercase", display: "block", marginBottom: "6px",
};

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    display_name: "", bio: "", location: "",
    twitter: "", instagram: "", facebook: "",
    avatar_url: "", is_public: true,
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-in"); return; }
    loadProfile();
  }, [isLoaded, user]);

  async function loadProfile() {
    const res = await fetch("/api/profile");
    const data = await res.json();
    if (data.profile) {
      setForm({
        display_name: data.profile.display_name ?? "",
        bio: data.profile.bio ?? "",
        location: data.profile.location ?? "",
        twitter: data.profile.twitter ?? "",
        instagram: data.profile.instagram ?? "",
        facebook: data.profile.facebook ?? "",
        avatar_url: data.profile.avatar_url ?? "",
        is_public: data.profile.is_public ?? true,
      });
    }
    setLoading(false);
  }

  function upd(field: string, value: any) { setForm(p => ({ ...p, [field]: value })); }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB."); return; }
    setUploading(true); setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { url, error: uploadErr } = await res.json();
      if (uploadErr) throw new Error(uploadErr);
      upd("avatar_url", url);
    } catch (e: any) {
      setError(e.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.display_name.trim()) { setError("Display name is required."); return; }
    setSaving(true); setError(""); setSuccess(false);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: form.display_name.trim(),
        bio: form.bio.trim() || null,
        location: form.location.trim() || null,
        twitter: form.twitter.trim() || null,
        instagram: form.instagram.trim() || null,
        facebook: form.facebook.trim() || null,
        avatar_url: form.avatar_url || null,
        is_public: form.is_public,
      }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Save failed."); return; }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  if (!isLoaded || loading) return (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>MY PROFILE</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>How other CFS members see you</p>
      </div>

      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "24px" }}>
        <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "2px", marginBottom: "16px" }}>PROFILE PHOTO</div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#E8F0E4", border: "2px solid #1A8040", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {form.avatar_url
              ? <img src={form.avatar_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
              : <span style={{ fontFamily: R, fontSize: "28px", color: "#1A8040" }}>{(form.display_name || "M")[0].toUpperCase()}</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "inline-block", cursor: "pointer", position: "relative" }}>
              <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }}/>
              <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "11px", background: "#E8F0E4", color: "#1A8040", padding: "8px 16px", border: "2px solid #DDE8DD", borderRadius: "6px", letterSpacing: "1.5px" }}>
                {uploading ? "UPLOADING..." : "UPLOAD PHOTO"}
              </span>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} style={{ display: "none" }}/>
            </label>
            <p style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "8px" }}>JPG, PNG, WebP — max 5MB</p>
            {form.avatar_url && (
              <button onClick={() => upd("avatar_url", "")} style={{ fontFamily: B, fontSize: "11px", color: "#CC3344", background: "transparent", border: "none", cursor: "pointer", padding: 0, marginTop: "4px" }}>Remove photo</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "2px", marginBottom: "4px" }}>BASIC INFO</div>
        <div>
          <label style={labelStyle}>Display Name *</label>
          <input style={inputStyle} value={form.display_name} onChange={e => upd("display_name", e.target.value)} placeholder="How you appear to other members" maxLength={40}/>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "4px" }}>{form.display_name.length}/40</div>
        </div>
        <div>
          <label style={labelStyle}>Bio</label>
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px", lineHeight: 1.6 }} value={form.bio} onChange={e => upd("bio", e.target.value)} placeholder="Tell the fam a little about yourself..." maxLength={200}/>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "4px" }}>{form.bio.length}/200</div>
        </div>
        <div>
          <label style={labelStyle}>Location</label>
          <input style={inputStyle} value={form.location} onChange={e => upd("location", e.target.value)} placeholder="e.g. Quezon City, PH" maxLength={60}/>
        </div>
      </div>

      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "2px", marginBottom: "4px" }}>SOCIAL LINKS</div>
        {[
          { field: "twitter", label: "Twitter / X", prefix: "x.com/", placeholder: "username" },
          { field: "instagram", label: "Instagram", prefix: "instagram.com/", placeholder: "username" },
          { field: "facebook", label: "Facebook", prefix: "facebook.com/", placeholder: "username or profile URL" },
        ].map(({ field, label, prefix, placeholder }) => (
          <div key={field}>
            <label style={labelStyle}>{label}</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ background: "#E8F0E4", border: "1.5px solid #DDE8DD", borderRight: "none", borderRadius: "6px 0 0 6px", padding: "10px 12px", fontFamily: B, fontSize: "12px", color: "#5A7A60", flexShrink: 0 }}>{prefix}</span>
              <input style={{ ...inputStyle, borderRadius: "0 6px 6px 0", borderLeft: "none", flex: 1 }} value={(form as any)[field]} onChange={e => upd(field, e.target.value)} placeholder={placeholder}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "20px" }}>
        <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "2px", marginBottom: "14px" }}>PRIVACY</div>
        <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
          <div onClick={() => upd("is_public", !form.is_public)} style={{ width: "40px", height: "22px", borderRadius: "11px", background: form.is_public ? "#1A8040" : "#DDE8DD", border: "2px solid #080F06", position: "relative", flexShrink: 0, transition: "background 0.2s", cursor: "pointer" }}>
            <div style={{ position: "absolute", top: "2px", left: form.is_public ? "18px" : "2px", width: "14px", height: "14px", borderRadius: "50%", background: "#1B3A2D", transition: "left 0.2s" }}/>
          </div>
          <div>
            <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "1px" }}>PUBLIC PROFILE</div>
            <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>{form.is_public ? "Visible in Member Directory" : "Hidden from Member Directory"}</div>
          </div>
        </label>
      </div>

      {error && <div style={{ background: "#3D0A18", border: "1.5px solid #CC3344", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}
      {success && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "8px", padding: "12px 16px", fontFamily: R, fontSize: "13px", color: "#1A8040", letterSpacing: "1px" }}>✦ PROFILE SAVED!</div>}

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => router.back()} style={{ fontFamily: R, fontSize: "12px", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "6px", color: "#5A7A60", padding: "11px 20px", cursor: "pointer", letterSpacing: "1px" }}>BACK</button>
        <button onClick={handleSave} disabled={saving} style={{ position: "relative", background: "transparent", border: "none", padding: 0, cursor: saving ? "not-allowed" : "pointer", flex: 1 }}>
          <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }}/>
          <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "13px", background: saving ? "#E8F0E4" : "#1A8040", color: saving ? "#5A7A60" : "#080F06", padding: "11px 24px", border: "2px solid #080F06", borderRadius: "6px", letterSpacing: "2px" }}>
            {saving ? "SAVING..." : "SAVE PROFILE ✦"}
          </span>
        </button>
      </div>
    </div>
  );
}