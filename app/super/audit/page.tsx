"use client";
import { useEffect, useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const ACTION_COLORS: Record<string,string> = {
  update_site_settings: "#1A8040", broadcast_notification: "#1A8040",
  change_role: "#156530", ban_member: "#CC3344", unban_member: "#1A8040",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-log").then(r => r.json()).then(d => { setLogs(d.logs ?? []); setLoading(false); });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", marginBottom: "4px" }}>AUDIT LOG</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Every admin action tracked and logged</p>
      </div>

      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ background: "#F2F7F2", padding: "10px 20px", display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr" }}>
          {["USER","ACTION","TARGET","WHEN"].map(h => <span key={h} style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "1.5px" }}>{h}</span>)}
        </div>
        {loading ? <div style={{ padding: "40px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>Loading...</div>
        : logs.length === 0 ? <div style={{ padding: "40px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>No audit logs yet.</div>
        : logs.map((log, i) => {
          const color = ACTION_COLORS[log.action] ?? "#5A7A60";
          return (
            <div key={log.id} style={{ padding: "12px 20px", borderTop: "1px solid #DDE8DD", background: i % 2 === 0 ? "#FFFFFF" : "#EDF7ED", display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#F2F7F2", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {log.profiles?.avatar_url ? <img src={log.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: R, fontSize: "11px", color: "#1A8040" }}>{(log.profiles?.display_name ?? "?")[0].toUpperCase()}</span>}
                </div>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>{log.profiles?.display_name ?? "Unknown"}</span>
              </div>
              <span style={{ fontFamily: R, fontSize: "10px", color, background: color + "20", borderRadius: "4px", padding: "2px 8px", letterSpacing: "1px", width: "fit-content" }}>
                {log.action.replace(/_/g, " ").toUpperCase()}
              </span>
              <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{log.target_type ?? "—"}</span>
              <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30" }}>{timeAgo(log.created_at)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
