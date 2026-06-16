"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState } from "react";
import { IconCheck, IconX, IconTrash, IconMusic, IconPhoto, IconVideo, IconLink, IconMegaphone, IconUsers } from "@/components/shared/Icons";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  tiktok: <IconMusic size={14} color="#4A7C59" />,
  twitter: <IconMegaphone size={14} color="#4A7C59" />,
  instagram: <IconPhoto size={14} color="#4A7C59" />,
  youtube: <IconVideo size={14} color="#4A7C59" />,
  facebook: <IconUsers size={14} color="#4A7C59" />,
  other: <IconLink size={14} color="#4A7C59" />,
};

export default function AdminFanSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/events/fan-submissions?status=${filter}`);
    const d = await res.json();
    setSubmissions(d.submissions ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/events/fan-submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/events/fan-submissions?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>FAN SUBMISSIONS</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>{submissions.length} {filter} submissions</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px" }}>
        {["pending", "approved", "rejected", "all"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: B, fontSize: "11px", background: filter === f ? "#E8F4EC" : "#FFFFFF", color: filter === f ? "#1A8040" : "#5A7A60", border: `1.5px solid ${filter === f ? "#1A8040" : "#DDE8DD"}`, borderRadius: "6px", padding: "6px 14px", cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase" as const }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
      ) : submissions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", fontFamily: R, color: "#5A7A60", letterSpacing: "1px" }}>NO {filter.toUpperCase()} SUBMISSIONS</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {submissions.map((s: any) => (
            <div key={s.id} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
              {/* Thumbnail */}
              <div style={{ height: "150px", background: "#F2F7F2", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                {s.thumbnail_url
                  ? <img src={s.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{PLATFORM_ICONS[s.platform] ?? <IconLink size={48} color="#DDE8DD" />}</div>
                }
                <div style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(255,255,255,0.9)", borderRadius: "4px", padding: "2px 8px", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#4A7C59" }}>
                  {PLATFORM_ICONS[s.platform]} {s.platform}
                </div>
                <div style={{ position: "absolute", top: "8px", right: "8px", background: s.status === "approved" ? "#E8F0E4" : s.status === "rejected" ? "#FFE8EC" : "#E8F4EC", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", color: s.status === "approved" ? "#1A8040" : s.status === "rejected" ? "#CC3344" : "#1A8040" }}>
                  {s.status}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "12px 14px" }}>
                {s.caption && <p style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", marginBottom: "6px" }}>{s.caption}</p>}
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: B, fontSize: "11px", color: "#1A8040", wordBreak: "break-all" as const }}>{s.url}</a>
                <p style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "6px" }}>
                  {new Date(s.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "6px", padding: "0 14px 14px" }}>
                {s.status !== "approved" && (
                  <button onClick={() => updateStatus(s.id, "approved")} style={{ flex: 1, fontFamily: B, fontSize: "11px", background: "transparent", color: "#1A8040", border: "1.5px solid #1A8040", borderRadius: "6px", padding: "7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <IconCheck size={11} color="#1A8040" /> Approve
                  </button>
                )}
                {s.status !== "rejected" && (
                  <button onClick={() => updateStatus(s.id, "rejected")} style={{ flex: 1, fontFamily: B, fontSize: "11px", background: "transparent", color: "#CC3344", border: "1.5px solid #CC3344", borderRadius: "6px", padding: "7px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <IconX size={11} color="#CC3344" /> Reject
                  </button>
                )}
                <button onClick={() => remove(s.id)} style={{ fontFamily: B, fontSize: "11px", background: "transparent", color: "#5A7A60", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "7px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconTrash size={13} color="#5A7A60" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
