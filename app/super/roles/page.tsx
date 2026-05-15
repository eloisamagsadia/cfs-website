"use client";
import { useEffect, useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const ROLES = ["super_admin","admin","moderator","sponsor","member"];
const ROLE_COLORS: Record<string,string> = { super_admin:"#F5C82A", admin:"#F07228", moderator:"#69C9D0", sponsor:"#B47FE3", member:"#3CCE2A" };

export default function RolesPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/members").then(r => r.json()).then(d => { setMembers(d.members ?? []); setLoading(false); });
  }, []);

  async function updateRole(userId: string, role: string) {
    setUpdating(userId);
    await fetch("/api/admin/members/role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, role }) });
    setMembers(p => p.map(m => m.id === userId ? { ...m, role } : m));
    setUpdating(null);
  }

  const filtered = members.filter(m => m.display_name?.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F5C82A", letterSpacing: "3px", marginBottom: "4px" }}>ROLE MANAGEMENT</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Manage member roles across the platform</p>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
        style={{ background: "#1A2614", border: "1.5px solid #2C4820", borderRadius: "8px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none" }} />

      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ background: "#243520", padding: "10px 20px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px" }}>
          {["MEMBER","CURRENT ROLE","CHANGE ROLE"].map(h => <span key={h} style={{ fontFamily: R, fontSize: "10px", color: "#5A7A50", letterSpacing: "1.5px" }}>{h}</span>)}
        </div>
        {loading ? <div style={{ padding: "40px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A50" }}>Loading...</div>
        : filtered.map((m, i) => (
          <div key={m.id} style={{ padding: "12px 20px", borderTop: "1px solid #2C4820", background: i % 2 === 0 ? "#1A2614" : "#162212", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#243520", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontFamily: R, fontSize: "13px", color: "#3CCE2A" }}>{(m.display_name ?? "M")[0].toUpperCase()}</span>}
              </div>
              <div>
                <div style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6" }}>{m.display_name ?? "Member"}</div>
                <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50" }}>{m.id.slice(0, 20)}...</div>
              </div>
            </div>
            <span style={{ fontFamily: R, fontSize: "10px", color: ROLE_COLORS[m.role] ?? "#5A7A50", background: (ROLE_COLORS[m.role] ?? "#5A7A50") + "20", borderRadius: "4px", padding: "2px 8px", letterSpacing: "1px", width: "fit-content" }}>
              {(m.role ?? "member").toUpperCase()}
            </span>
            <select value={m.role ?? "member"} onChange={e => updateRole(m.id, e.target.value)} disabled={updating === m.id}
              style={{ background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "6px 10px", color: "#F0EAD6", fontFamily: B, fontSize: "12px", cursor: "pointer", outline: "none" }}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
