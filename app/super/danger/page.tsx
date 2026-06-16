"use client";
import { useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default function DangerPage() {
  const [exportLoading, setExportLoading] = useState(false);

  async function resetImageCounts() {
    if (!confirm("Reset ALL members image post counts to 0? This cannot be undone.")) return;
    await fetch("/api/admin/site-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reset_image_counts: true }) });
    alert("Done! All image post counts reset.");
  }

  async function exportMembers() {
    setExportLoading(true);
    const res = await fetch("/api/admin/members/export");
    const data = await res.json();
    const csv = [
      ["ID","Display Name","Role","Joined","Banned"].join(","),
      ...(data.members ?? []).map((m: any) => [m.id, m.display_name, m.role, m.created_at, m.is_banned].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `cfs-members-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setExportLoading(false);
  }

  const actions = [
    { label: "Reset All Image Post Counts", desc: "Sets all members monthly image post count to 0", action: resetImageCounts, color: "#1A8040" },
    { label: "Export Members CSV", desc: "Download all member data as a CSV file", action: exportMembers, color: "#1A8040", loading: exportLoading },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#CC3344", letterSpacing: "3px", marginBottom: "4px" }}>☠️ DANGER ZONE</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Irreversible actions — proceed with caution</p>
      </div>

      <div style={{ background: "#FFF5F6", border: "2px solid #CC3344", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {actions.map(({ label, desc, action, color, loading: l }) => (
          <div key={label} style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "10px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", marginBottom: "3px" }}>{label}</div>
              <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{desc}</div>
            </div>
            <button onClick={action} disabled={l} style={{ fontFamily: R, fontSize: "10px", background: "transparent", border: `1.5px solid ${color}`, color, borderRadius: "6px", padding: "6px 14px", cursor: "pointer", letterSpacing: "1px", opacity: l ? 0.5 : 1 }}>
              {l ? "..." : "RUN"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
