"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const ACTION_COLORS: Record<string, string> = {
  change_role: "#F07228",
  hide_post: "#F04060",
  unhide_post: "#3CCE2A",
  approve_fanwall: "#3CCE2A",
  reject_fanwall: "#F04060",
  ban_member: "#F04060",
  unban_member: "#3CCE2A",
  delete_post: "#F04060",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ModLogPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/mod-actions")
      .then(r => r.json())
      .then(({ actions }) => { setActions(actions ?? []); setLoading(false); });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>MOD LOG</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Moderator action history</p>
      </div>

      {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
      ) : actions.length === 0 ? (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A50", letterSpacing: "2px" }}>
          NO ACTIONS YET
        </div>
      ) : (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ background: "#243520", padding: "12px 20px", display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr", gap: "8px" }}>
            {["MODERATOR", "ACTION", "TARGET", "WHEN"].map(h => (
              <span key={h} style={{ fontFamily: R, fontSize: "11px", color: "#5A7A50", letterSpacing: "1.5px" }}>{h}</span>
            ))}
          </div>
          {actions.map((action: any, i: number) => {
            const color = ACTION_COLORS[action.action_type] ?? "#5A7A50";
            return (
              <div key={action.id} style={{ padding: "12px 20px", borderTop: "1px solid #2C4820", background: i % 2 === 0 ? "#1A2614" : "#162212", display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr", gap: "8px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#1A3D14", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {action.profiles?.avatar_url
                      ? <img src={action.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: R, fontSize: "11px", color: "#3CCE2A" }}>{(action.profiles?.display_name ?? "M")[0].toUpperCase()}</span>
                    }
                  </div>
                  <span style={{ fontFamily: B, fontSize: "12px", color: "#F0EAD6" }}>{action.profiles?.display_name ?? "Unknown"}</span>
                </div>
                <div>
                  <span style={{ fontFamily: R, fontSize: "10px", color, background: color + "20", borderRadius: "4px", padding: "2px 8px", letterSpacing: "1px" }}>
                    {action.action_type.replace(/_/g, " ").toUpperCase()}
                  </span>
                  {action.notes && <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", marginTop: "3px" }}>{action.notes}</div>}
                </div>
                <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>
                  {action.target_type}: {action.target_id?.slice(0, 8)}...
                </span>
                <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30" }}>{timeAgo(action.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
