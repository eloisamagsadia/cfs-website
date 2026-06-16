"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const ACTION_COLORS: Record<string, string> = {
  update_site_settings: "#1A8040",
  broadcast_notification: "#1A8040",
  change_role: "#156530",
  ban_member: "#CC3344",
  unban_member: "#1A8040",
  default: "#5A7A60",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SuperAdminPage() {
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [sponsorPerks, setSponsorPerks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: "", message: "", link: "" });
  const [activeTab, setActiveTab] = useState<"overview" | "settings" | "broadcast" | "roles" | "audit" | "danger">("overview");
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/site-settings").then(r => r.json()),
      fetch("/api/admin/audit-log").then(r => r.json()),
      fetch("/api/admin/sponsor-perks").then(r => r.json()),
      fetch("/api/admin/stats").then(r => r.json()).catch(() => ({ stats: null })),
    ]).then(([settingsData, logsData, perksData, statsData]) => {
      setSettings(settingsData.settings);
      setLogs(logsData.logs ?? []);
      setSponsorPerks(perksData.perks);
      setStats(statsData.stats);
      setLoading(false);
    });
  }, []);

  async function saveSetting(key: string, value: any) {
    setSaving(true);
    const res = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    const data = await res.json();
    if (data.settings) setSettings(data.settings);
    setSaving(false);
  }

  async function saveSettings() {
    setSaving(true);
    const res = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (data.settings) setSettings(data.settings);
    setSaving(false);
  }

  async function saveSponsorPerks() {
    setSaving(true);
    const res = await fetch("/api/admin/sponsor-perks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sponsorPerks),
    });
    const data = await res.json();
    if (data.perks) setSponsorPerks(data.perks);
    setSaving(false);
  }

  async function sendBroadcast() {
    if (!broadcast.title.trim() || !broadcast.message.trim()) return;
    setBroadcasting(true);
    const res = await fetch("/api/admin/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(broadcast),
    });
    const data = await res.json();
    if (data.success) {
      setBroadcastSent(true);
      setBroadcast({ title: "", message: "", link: "" });
      setTimeout(() => setBroadcastSent(false), 3000);
    }
    setBroadcasting(false);
  }

  async function resetImagePostCounts() {
    if (!confirm("Reset ALL members image post counts to 0? This cannot be undone.")) return;
    await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset_image_counts: true }),
    });
    alert("Done! All image post counts reset.");
  }

  async function exportMembers() {
    setExportLoading(true);
    const res = await fetch("/api/admin/members/export");
    const data = await res.json();
    const csv = [
      ["ID", "Display Name", "Role", "Joined", "Posts", "Banned"].join(","),
      ...(data.members ?? []).map((m: any) =>
        [m.id, m.display_name, m.role, m.created_at, m.post_count, m.is_banned].join(",")
      )
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cfs-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setExportLoading(false);
  }

  const TABS = [
    { id: "overview", label: "📊 Overview" },
    { id: "settings", label: "🔧 Settings" },
    { id: "broadcast", label: "📣 Broadcast" },
    { id: "audit", label: "📋 Audit Log" },
    { id: "danger", label: "☠️ Danger Zone" },
  ];

  if (loading) return (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #FFFBE8, #FFF7D4)", border: "2px solid #1A804040", borderRadius: "16px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
          <span style={{ fontSize: "24px" }}>⚡</span>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", margin: 0 }}>SUPER ADMIN</h1>
        </div>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59", margin: 0 }}>Full platform control — with great power comes great responsibility.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            style={{ fontFamily: R, fontSize: "11px", background: activeTab === tab.id ? "#E8F4EC" : "transparent", border: `1.5px solid ${activeTab === tab.id ? "#156530" : "#DDE8DD"}`, color: activeTab === tab.id ? "#156530" : "#5A7A60", borderRadius: "8px", padding: "7px 16px", cursor: "pointer", letterSpacing: "1px" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
            {[
              { label: "TOTAL MEMBERS", value: stats?.total_members ?? "—", color: "#1B3A2D", icon: "👥" },
              { label: "SPONSORS", value: stats?.sponsors ?? "—", color: "#1A8040", icon: "✦" },
              { label: "ADMINS", value: stats?.admins ?? "—", color: "#1A8040", icon: "🛡" },
              { label: "MODERATORS", value: stats?.moderators ?? "—", color: "#5A7A60", icon: "🔧" },
              { label: "TOTAL POSTS", value: stats?.total_posts ?? "—", color: "#1A8040", icon: "💬" },
              { label: "TOTAL TICKETS", value: stats?.total_tickets ?? "—", color: "#156530", icon: "🎫" },
              { label: "TOTAL EVENTS", value: stats?.total_events ?? "—", color: "#1A8040", icon: "🎪" },
              { label: "EXCLUSIVE CONTENT", value: stats?.exclusive_content ?? "—", color: "#1A8040", icon: "✨" },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "10px", padding: "14px 16px" }}>
                <div style={{ fontSize: "20px", marginBottom: "6px" }}>{icon}</div>
                <div style={{ fontFamily: R, fontSize: "1.4rem", color }}>{value}</div>
                <div style={{ fontFamily: B, fontSize: "9px", color: "#5A7A60", letterSpacing: "1.5px" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Sponsor slots */}
          {sponsorPerks && (
            <div style={{ background: "#FFFFFF", border: "2px solid #1A804060", borderRadius: "12px", padding: "20px" }}>
              <div style={{ fontFamily: R, fontSize: "12px", color: "#1A8040", letterSpacing: "2px", marginBottom: "12px" }}>✦ SPONSOR SLOTS</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D" }}>{stats?.sponsors ?? 0} / {sponsorPerks.max_sponsors} slots used</span>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>{sponsorPerks.max_sponsors - (stats?.sponsors ?? 0)} remaining</span>
              </div>
              <div style={{ background: "#F2F7F2", borderRadius: "20px", height: "8px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(((stats?.sponsors ?? 0) / sponsorPerks.max_sponsors) * 100, 100)}%`, background: "#1A8040", borderRadius: "20px", transition: "width 0.5s" }} />
              </div>
            </div>
          )}

          {/* Site status */}
          {settings && (
            <div style={{ background: "#FFFFFF", border: `2px solid ${settings.maintenance_mode ? "#CC3344" : "#1A8040"}30`, borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: R, fontSize: "12px", color: settings.maintenance_mode ? "#CC3344" : "#1A8040", letterSpacing: "2px", marginBottom: "4px" }}>
                  {settings.maintenance_mode ? "🔴 MAINTENANCE MODE ON" : "🟢 SITE LIVE"}
                </div>
                <div style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59" }}>
                  {settings.maintenance_mode ? "Site is under maintenance" : "coletfs.com is live and running"}
                </div>
              </div>
              <button onClick={() => saveSetting("maintenance_mode", !settings.maintenance_mode)}
                style={{ fontFamily: R, fontSize: "11px", background: settings.maintenance_mode ? "#1A8040" : "#CC3344", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer", letterSpacing: "1px" }}>
                {settings.maintenance_mode ? "DISABLE" : "ENABLE"}
              </button>
            </div>
          )}

          {/* Announcement */}
          {settings?.announcement_active && (
            <div style={{ background: "#E8F0E4", border: `2px solid ${settings.announcement_color}`, borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D" }}>📣 {settings.announcement_text}</div>
              <button onClick={() => saveSetting("announcement_active", false)}
                style={{ background: "none", border: "none", color: "#5A7A60", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS ── */}
      {activeTab === "settings" && settings && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontFamily: R, fontSize: "13px", color: "#1A8040", letterSpacing: "2px" }}>🔧 SITE SETTINGS</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>MAX IMAGE POSTS/MONTH</label>
                <input type="number" value={settings.max_image_posts_per_month}
                  onChange={e => setSettings((p: any) => ({ ...p, max_image_posts_per_month: Number(e.target.value) }))}
                  style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>MAX POST LENGTH (chars)</label>
                <input type="number" value={settings.max_community_post_length}
                  onChange={e => setSettings((p: any) => ({ ...p, max_community_post_length: Number(e.target.value) }))}
                  style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            <button onClick={saveSettings} disabled={saving}
              style={{ fontFamily: R, fontSize: "11px", background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", letterSpacing: "1px", width: "fit-content", opacity: saving ? 0.7 : 1 }}>
              {saving ? "SAVING..." : "SAVE SETTINGS"}
            </button>
          </div>

          {/* Sponsor settings */}
          {sponsorPerks && (
            <div style={{ background: "#FFFFFF", border: "2px solid #1A804060", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#1A8040", letterSpacing: "2px" }}>✦ SPONSOR SETTINGS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>MAX SPONSORS</label>
                  <input type="number" value={sponsorPerks.max_sponsors}
                    onChange={e => setSponsorPerks((p: any) => ({ ...p, max_sponsors: Number(e.target.value) }))}
                    style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>EARLY ACCESS DAYS</label>
                  <input type="number" value={sponsorPerks.early_access_days}
                    onChange={e => setSponsorPerks((p: any) => ({ ...p, early_access_days: Number(e.target.value) }))}
                    style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <button onClick={saveSponsorPerks} disabled={saving}
                style={{ fontFamily: R, fontSize: "11px", background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "8px 20px", cursor: "pointer", letterSpacing: "1px", width: "fit-content", opacity: saving ? 0.7 : 1 }}>
                {saving ? "SAVING..." : "SAVE SPONSOR SETTINGS"}
              </button>
            </div>
          )}

          {/* Announcement banner */}
          <div style={{ background: "#FFFFFF", border: "2px solid #1A8040", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontFamily: R, fontSize: "13px", color: "#1A8040", letterSpacing: "2px" }}>📣 SITE ANNOUNCEMENT</div>
            <input value={settings.announcement_text ?? ""} onChange={e => setSettings((p: any) => ({ ...p, announcement_text: e.target.value }))}
              placeholder="e.g. Site maintenance tonight at 12AM"
              style={{ background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none" }} />
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>Color:</label>
              <input type="color" value={settings.announcement_color ?? "#1A8040"} onChange={e => setSettings((p: any) => ({ ...p, announcement_color: e.target.value }))}
                style={{ width: "36px", height: "32px", borderRadius: "6px", border: "1.5px solid #DDE8DD", cursor: "pointer" }} />
              <button onClick={async () => {
                setSaving(true);
                const res = await fetch("/api/admin/site-settings", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ announcement_text: settings.announcement_text, announcement_color: settings.announcement_color, announcement_active: !settings.announcement_active }),
                });
                const data = await res.json();
                if (data.settings) setSettings(data.settings);
                setSaving(false);
              }}
                style={{ fontFamily: R, fontSize: "11px", background: settings.announcement_active ? "#CC3344" : "#1A8040", color: "#FFFFFF", border: "none", borderRadius: "6px", padding: "7px 14px", cursor: "pointer", letterSpacing: "1px" }}>
                {settings.announcement_active ? "HIDE ANNOUNCEMENT" : "SHOW ANNOUNCEMENT"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BROADCAST ── */}
      {activeTab === "broadcast" && (
        <div style={{ background: "#FFFFFF", border: "2px solid #1A8040", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#1A8040", letterSpacing: "2px" }}>📣 BROADCAST TO ALL MEMBERS</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>This sends a notification to every active member on the platform.</div>
          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>TITLE *</label>
            <input value={broadcast.title} onChange={e => setBroadcast(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g. New event announced! 🎉"
              style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>MESSAGE *</label>
            <textarea value={broadcast.message} onChange={e => setBroadcast(p => ({ ...p, message: e.target.value }))}
              rows={3} placeholder="Type your message here..."
              style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>LINK (optional)</label>
            <input value={broadcast.link} onChange={e => setBroadcast(p => ({ ...p, link: e.target.value }))}
              placeholder="e.g. /events or /members/community"
              style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
          </div>
          {broadcastSent && (
            <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "8px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#1A8040" }}>
              ✅ Broadcast sent successfully!
            </div>
          )}
          <button onClick={sendBroadcast} disabled={broadcasting || !broadcast.title.trim() || !broadcast.message.trim()}
            style={{ fontFamily: R, fontSize: "12px", background: "#1A8040", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "12px 24px", cursor: "pointer", letterSpacing: "1.5px", width: "fit-content", opacity: (broadcasting || !broadcast.title.trim() || !broadcast.message.trim()) ? 0.5 : 1 }}>
            {broadcasting ? "SENDING..." : "📣 SEND TO ALL MEMBERS"}
          </button>
        </div>
      )}

      {/* ── AUDIT LOG ── */}
      {activeTab === "audit" && (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ background: "#F2F7F2", padding: "12px 20px", display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr" }}>
            {["USER", "ACTION", "TARGET", "WHEN"].map(h => (
              <span key={h} style={{ fontFamily: R, fontSize: "11px", color: "#5A7A60", letterSpacing: "1.5px" }}>{h}</span>
            ))}
          </div>
          {logs.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>No audit logs yet.</div>
          ) : logs.map((log: any, i: number) => {
            const color = ACTION_COLORS[log.action] ?? ACTION_COLORS.default;
            return (
              <div key={log.id} style={{ padding: "12px 20px", borderTop: "1px solid #DDE8DD", background: i % 2 === 0 ? "#FFFFFF" : "#EDF7ED", display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#E8F0E4", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {log.profiles?.avatar_url
                      ? <img src={log.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: R, fontSize: "11px", color: "#1A8040" }}>{(log.profiles?.display_name ?? "?")[0].toUpperCase()}</span>
                    }
                  </div>
                  <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>{log.profiles?.display_name ?? "Unknown"}</span>
                </div>
                <span style={{ fontFamily: R, fontSize: "10px", color, background: color + "20", borderRadius: "4px", padding: "2px 8px", letterSpacing: "1px", width: "fit-content" }}>
                  {log.action.replace(/_/g, " ").toUpperCase()}
                </span>
                <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{log.target_type ?? "—"}</span>
                <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{timeAgo(log.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DANGER ZONE ── */}
      {activeTab === "danger" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ background: "#FFF5F6", border: "2px solid #CC3344", borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontFamily: R, fontSize: "13px", color: "#CC3344", letterSpacing: "2px", marginBottom: "16px" }}>☠️ DANGER ZONE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                {
                  label: "Reset All Image Post Counts",
                  desc: "Sets all members' monthly image post count to 0",
                  action: resetImagePostCounts,
                  color: "#1A8040",
                },
                {
                  label: "Export Members CSV",
                  desc: "Download all member data as a CSV file",
                  action: exportMembers,
                  color: "#1A8040",
                  loading: exportLoading,
                },
              ].map(({ label, desc, action, color, loading: l }) => (
                <div key={label} style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "10px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", marginBottom: "3px" }}>{label}</div>
                    <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{desc}</div>
                  </div>
                  <button onClick={action} disabled={l}
                    style={{ fontFamily: R, fontSize: "10px", background: "transparent", border: `1.5px solid ${color}`, color, borderRadius: "6px", padding: "6px 14px", cursor: "pointer", letterSpacing: "1px", opacity: l ? 0.5 : 1 }}>
                    {l ? "..." : "RUN"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
