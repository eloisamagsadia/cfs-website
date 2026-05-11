"use client";
import { useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default function AdminMembersClient({ members }: { members: any[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "admin" | "member" | "banned">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [localMembers, setLocalMembers] = useState(members);

  const filtered = localMembers.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (m.display_name ?? "").toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ? true :
      filter === "banned" ? m.is_banned :
      m.role === filter && !m.is_banned;
    return matchSearch && matchFilter;
  });

  async function toggleRole(member: any) {
    setLoadingId(member.id);
    const newRole = member.role === "admin" ? "member" : "admin";
    const res = await fetch("/api/admin/members/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: member.id, role: newRole }),
    });
    if (res.ok) {
      setLocalMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
    }
    setLoadingId(null);
  }

  async function toggleBan(member: any) {
    setLoadingId(member.id);
    const newBanned = !member.is_banned;
    const res = await fetch("/api/admin/members/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: member.id, banned: newBanned }),
    });
    if (res.ok) {
      setLocalMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_banned: newBanned } : m));
    }
    setLoadingId(null);
  }

  const totalAdmins  = localMembers.filter(m => m.role === "admin").length;
  const totalBanned  = localMembers.filter(m => m.is_banned).length;
  const totalMembers = localMembers.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>MEMBERS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>{totalMembers} registered members</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {[
          { label: "TOTAL", value: totalMembers, color: "#F0EAD6" },
          { label: "ADMINS", value: totalAdmins, color: "#F07228" },
          { label: "MEMBERS", value: totalMembers - totalAdmins - totalBanned, color: "#3CCE2A" },
          { label: "BANNED", value: totalBanned, color: "#F04060" },
        ].map(s => (
          <div key={s.label} style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "10px", padding: "12px 20px" }}>
            <div style={{ fontFamily: R, fontSize: "1.3rem", color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1.5px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or ID..."
          style={{ flex: 1, minWidth: "200px", background: "#1A2614", border: "1.5px solid #2C4820", borderRadius: "8px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none" }}
        />
        <div style={{ display: "flex", gap: "6px" }}>
          {(["all","admin","member","banned"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ fontFamily: R, fontSize: "11px", background: filter === f ? "#1A3D14" : "transparent", border: `1.5px solid ${filter === f ? "#3CCE2A" : "#2C4820"}`, color: filter === f ? "#3CCE2A" : "#5A7A50", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", letterSpacing: "1px" }}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.6fr 0.6fr 0.8fr", background: "#243520", padding: "12px 20px" }}>
          {["MEMBER", "ID", "ROLE", "POSTS", "BADGES", "ACTIONS"].map(h => (
            <span key={h} style={{ fontFamily: R, fontSize: "11px", color: "#5A7A50", letterSpacing: "1.5px" }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#3A5A30" }}>
            No members found.
          </div>
        )}

        {filtered.map((m: any, i: number) => {
          const isLoading = loadingId === m.id;
          return (
            <div key={m.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.6fr 0.6fr 0.8fr", padding: "12px 20px", borderTop: "1px solid #2C4820", background: m.is_banned ? "#2A0A0A" : i % 2 === 0 ? "#1A2614" : "#162212", alignItems: "center" }}>

              {/* Member */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1A3D14", border: "1.5px solid #2C4820", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: R, fontSize: "13px", color: "#3CCE2A" }}>{(m.display_name ?? "M")[0].toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div style={{ fontFamily: B, fontSize: "13px", color: m.is_banned ? "#5A3030" : "#F0EAD6" }}>
                    {m.display_name ?? "—"}
                    {m.is_banned && <span style={{ fontFamily: R, fontSize: "9px", color: "#F04060", background: "#3D0A14", border: "1px solid #F0406040", borderRadius: "4px", padding: "1px 6px", marginLeft: "6px", letterSpacing: "1px" }}>BANNED</span>}
                  </div>
                </div>
              </div>

              {/* ID */}
              <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30" }}>{m.id.slice(0, 8)}...</span>

              {/* Role */}
              <span style={{ fontFamily: R, fontSize: "11px", color: m.role === "admin" ? "#F07228" : "#3CCE2A", letterSpacing: "1px" }}>
                {m.role?.toUpperCase()}
              </span>

              {/* Posts */}
              <span style={{ fontFamily: R, fontSize: "13px", color: "#8AAA78" }}>{m.post_count}</span>

              {/* Badges */}
              <span style={{ fontFamily: R, fontSize: "13px", color: "#F5C82A" }}>{m.user_badges?.length ?? 0}</span>

              {/* Actions */}
              <div style={{ display: "flex", gap: "6px" }}>
                {/* Role toggle */}
                <button
                  onClick={() => toggleRole(m)}
                  disabled={isLoading}
                  title={m.role === "admin" ? "Demote to member" : "Make admin"}
                  style={{ fontFamily: R, fontSize: "9px", color: m.role === "admin" ? "#F07228" : "#5A7A50", background: "transparent", border: `1px solid ${m.role === "admin" ? "#F0722840" : "#2C4820"}`, borderRadius: "4px", padding: "4px 8px", cursor: "pointer", letterSpacing: "1px", opacity: isLoading ? 0.5 : 1 }}>
                  {m.role === "admin" ? "DEMOTE" : "ADMIN"}
                </button>
                {/* Ban toggle */}
                <button
                  onClick={() => toggleBan(m)}
                  disabled={isLoading}
                  title={m.is_banned ? "Unban member" : "Ban member"}
                  style={{ fontFamily: R, fontSize: "9px", color: m.is_banned ? "#3CCE2A" : "#F04060", background: "transparent", border: `1px solid ${m.is_banned ? "#3CCE2A40" : "#F0406040"}`, borderRadius: "4px", padding: "4px 8px", cursor: "pointer", letterSpacing: "1px", opacity: isLoading ? 0.5 : 1 }}>
                  {m.is_banned ? "UNBAN" : "BAN"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
