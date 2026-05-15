"use client";
import { useEffect, useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [perks, setPerks] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/site-settings").then(r => r.json()),
      fetch("/api/admin/sponsor-perks").then(r => r.json()),
    ]).then(([s, p]) => { setSettings(s.settings); setPerks(p.perks); });
  }, []);

  async function save() {
    setSaving(true);
    await Promise.all([
      fetch("/api/admin/site-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }),
      fetch("/api/admin/sponsor-perks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(perks) }),
    ]);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function toggleMaintenance() {
    const res = await fetch("/api/admin/site-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ maintenance_mode: !settings.maintenance_mode }) });
    const data = await res.json();
    if (data.settings) setSettings(data.settings);
  }

  async function toggleAnnouncement() {
    const res = await fetch("/api/admin/site-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ announcement_text: settings.announcement_text, announcement_color: settings.announcement_color, announcement_active: !settings.announcement_active }) });
    const data = await res.json();
    if (data.settings) setSettings(data.settings);
  }

<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-text" style={{ width: "80%" }} />
      <div className="skeleton skeleton-text" style={{ width: "60%" }} />
      <div className="skeleton skeleton-card" />
    </div>

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "720px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F5C82A", letterSpacing: "3px", marginBottom: "4px" }}>SITE SETTINGS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Configure platform-wide settings</p>
      </div>

      {saved && <div style={{ background: "#1A3D14", border: "2px solid #3CCE2A", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#3CCE2A" }}>✅ Settings saved!</div>}

      {/* Site status */}
      <div style={{ background: "#1A2614", border: `2px solid ${settings.maintenance_mode ? "#F04060" : "#3CCE2A"}40`, borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: R, fontSize: "12px", color: settings.maintenance_mode ? "#F04060" : "#3CCE2A", letterSpacing: "1.5px" }}>{settings.maintenance_mode ? "🔴 MAINTENANCE MODE ON" : "🟢 SITE LIVE"}</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", marginTop: "4px" }}>{settings.maintenance_mode ? "Members cannot access the site" : "coletfs.com is live"}</div>
        </div>
        <button onClick={toggleMaintenance} style={{ fontFamily: R, fontSize: "11px", background: settings.maintenance_mode ? "#3CCE2A" : "#F04060", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", letterSpacing: "1px" }}>
          {settings.maintenance_mode ? "DISABLE" : "ENABLE"}
        </button>
      </div>

      {/* General settings */}
      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontFamily: R, fontSize: "12px", color: "#F07228", letterSpacing: "2px" }}>🔧 GENERAL SETTINGS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { label: "MAX IMAGE POSTS/MONTH", key: "max_image_posts_per_month" },
            { label: "MAX POST LENGTH (chars)", key: "max_community_post_length" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", display: "block", marginBottom: "4px" }}>{label}</label>
              <input type="number" value={settings[key]} onChange={e => setSettings((p: any) => ({ ...p, [key]: Number(e.target.value) }))}
                style={{ width: "100%", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "8px 12px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const }} />
            </div>
          ))}
        </div>
      </div>

      {/* Sponsor settings */}
      {perks && (
        <div style={{ background: "#1A2614", border: "2px solid #B47FE360", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#B47FE3", letterSpacing: "2px" }}>✦ SPONSOR SETTINGS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              { label: "MAX SPONSORS", key: "max_sponsors" },
              { label: "EARLY ACCESS DAYS", key: "early_access_days" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", display: "block", marginBottom: "4px" }}>{label}</label>
                <input type="number" value={perks[key]} onChange={e => setPerks((p: any) => ({ ...p, [key]: Number(e.target.value) }))}
                  style={{ width: "100%", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "8px 12px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcement */}
      <div style={{ background: "#1A2614", border: "2px solid #F07228", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontFamily: R, fontSize: "12px", color: "#F07228", letterSpacing: "2px" }}>📣 SITE ANNOUNCEMENT</div>
        <input value={settings.announcement_text ?? ""} onChange={e => setSettings((p: any) => ({ ...p, announcement_text: e.target.value }))} placeholder="Announcement text..."
          style={{ background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "8px 12px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none" }} />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>Color:</label>
          <input type="color" value={settings.announcement_color ?? "#F07228"} onChange={e => setSettings((p: any) => ({ ...p, announcement_color: e.target.value }))}
            style={{ width: "36px", height: "32px", borderRadius: "6px", border: "1.5px solid #2C4820", cursor: "pointer" }} />
          <button onClick={toggleAnnouncement} style={{ fontFamily: R, fontSize: "11px", background: settings.announcement_active ? "#F04060" : "#3CCE2A", color: "#080F06", border: "none", borderRadius: "6px", padding: "7px 14px", cursor: "pointer", letterSpacing: "1px" }}>
            {settings.announcement_active ? "HIDE" : "SHOW"}
          </button>
        </div>
      </div>

      <button onClick={save} disabled={saving} style={{ fontFamily: R, fontSize: "12px", background: "#F5C82A", color: "#080F06", border: "none", borderRadius: "8px", padding: "12px 24px", cursor: "pointer", letterSpacing: "1.5px", width: "fit-content", opacity: saving ? 0.7 : 1 }}>
        {saving ? "SAVING..." : "SAVE ALL SETTINGS"}
      </button>
    </div>
  );
}
