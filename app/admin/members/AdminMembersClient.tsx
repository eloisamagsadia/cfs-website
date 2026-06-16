"use client";
import { useState } from "react";
import { IconX, IconCheck, IconWarning } from "@/components/shared/Icons";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const ROLES = ["super_admin", "admin", "moderator", "sponsor", "member"];

const ROLE_COLORS: Record<string, string> = {
  super_admin: "#156530",
  admin: "#1A8040",
  moderator: "#5A7A60",
  sponsor: "#1A8040",
  member: "#1A8040",
  guest: "#5A7A60",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "SUPER ADMIN",
  admin: "ADMIN",
  moderator: "MOD",
  sponsor: "SPONSOR",
  member: "MEMBER",
  guest: "GUEST",
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function AdminMembersClient({ members, callerRole }: { members: any[], callerRole: string }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [localMembers, setLocalMembers] = useState(members);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [sponsorCount, setSponsorCount] = useState(members.filter(m => m.role === "sponsor").length);

  const isSuperAdmin = callerRole === "super_admin";

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

  async function changeRole(member: any, newRole: string) {
    setLoadingId(member.id);
    const res = await fetch("/api/admin/members/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: member.id, role: newRole }),
    });
    const data = await res.json();
    if (res.ok) {
      setLocalMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
      if (member.role === "sponsor" && newRole !== "sponsor") setSponsorCount(p => p - 1);
      if (newRole === "sponsor" && member.role !== "sponsor") setSponsorCount(p => p + 1);
      if (selectedMember?.id === member.id) setSelectedMember({ ...selectedMember, role: newRole });
    } else {
      alert(data.error);
    }
    setLoadingId(null);
  }

  async function toggleBan(member: any) {
    setLoadingId(member.id);
    const newBanned = !member.is_banned;
    const res = await fetch("/api/admin/members/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: member.id, banned: newBanned }),
    });
    if (res.ok) {
      setLocalMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_banned: newBanned } : m));
      if (selectedMember?.id === member.id) setSelectedMember({ ...selectedMember, is_banned: newBanned });
    }
    setLoadingId(null);
  }

  const counts = {
    total: localMembers.length,
    super_admin: localMembers.filter(m => m.role === "super_admin").length,
    admin: localMembers.filter(m => m.role === "admin").length,
    moderator: localMembers.filter(m => m.role === "moderator").length,
    sponsor: sponsorCount,
    member: localMembers.filter(m => m.role === "member").length,
    banned: localMembers.filter(m => m.is_banned).length,
  };

  // Can caller change this member's role?
  function canChangeRole(target: any) {
    if (target.role === "super_admin" && !isSuperAdmin) return false;
    if (["admin"].includes(target.role) && !isSuperAdmin) return false;
    return true;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>MEMBERS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>{counts.total} registered members</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[
          { label: "TOTAL", value: counts.total, color: "#1B3A2D" },
          { label: "SUPER ADMIN", value: counts.super_admin, color: ROLE_COLORS.super_admin },
          { label: "ADMIN", value: counts.admin, color: ROLE_COLORS.admin },
          { label: "MOD", value: counts.moderator, color: ROLE_COLORS.moderator },
          { label: "SPONSOR", value: counts.sponsor, color: ROLE_COLORS.sponsor },
          { label: "MEMBER", value: counts.member, color: ROLE_COLORS.member },
          { label: "BANNED", value: counts.banned, color: "#CC3344" },
        ].map(s => (
          <div key={s.label} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "10px", padding: "10px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: R, fontSize: "1.2rem", color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: B, fontSize: "9px", color: "#5A7A60", letterSpacing: "1.5px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or ID..."
          style={{ flex: 1, minWidth: "200px", background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none" }} />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["all", ...ROLES, "banned"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ fontFamily: R, fontSize: "10px", background: filter === f ? "#E8F0E4" : "transparent", border: `1.5px solid ${filter === f ? (ROLE_COLORS[f] ?? "#1A8040") : "#DDE8DD"}`, color: filter === f ? (ROLE_COLORS[f] ?? "#1A8040") : "#5A7A60", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", letterSpacing: "1px" }}>
              {f === "all" ? "ALL" : ROLE_LABELS[f] ?? f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table — desktop only */}
      <div className="members-table-desktop" style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.5fr 0.5fr 1.2fr", background: "#F2F7F2", padding: "12px 20px" }}>
          {["MEMBER", "ROLE", "JOINED", "POSTS", "BADGES", "ACTIONS"].map(h => (
            <span key={h} style={{ fontFamily: R, fontSize: "11px", color: "#5A7A60", letterSpacing: "1.5px" }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>No members found.</div>
        )}

        {filtered.map((m: any, i: number) => {
          const isLoading = loadingId === m.id;
          const roleColor = ROLE_COLORS[m.role] ?? "#5A7A60";
          const canChange = canChangeRole(m);
          return (
            <div key={m.id}
              onClick={() => setSelectedMember(m)}
              style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 0.5fr 0.5fr 1.2fr", padding: "12px 20px", borderTop: "1px solid #DDE8DD", background: m.is_banned ? "#2A0A0A" : i % 2 === 0 ? "#FFFFFF" : "#EDF7ED", alignItems: "center", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F2F7F2")}
              onMouseLeave={e => (e.currentTarget.style.background = m.is_banned ? "#2A0A0A" : i % 2 === 0 ? "#FFFFFF" : "#EDF7ED")}
            >
              {/* Member */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: `2px solid ${roleColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: R, fontSize: "13px", color: roleColor }}>{(m.display_name ?? "M")[0].toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div style={{ fontFamily: B, fontSize: "13px", color: m.is_banned ? "#5A3030" : "#1B3A2D", display: "flex", alignItems: "center", gap: "6px" }}>
                    {m.display_name ?? "—"}
                    {m.is_banned && <span style={{ fontFamily: R, fontSize: "9px", color: "#CC3344", background: "#3D0A14", borderRadius: "4px", padding: "1px 6px" }}>BANNED</span>}
                  </div>
                </div>
              </div>

              {/* Role badge */}
              <span style={{ fontFamily: R, fontSize: "10px", color: roleColor, background: roleColor + "20", borderRadius: "20px", padding: "3px 10px", letterSpacing: "1px", width: "fit-content" }}>
                {ROLE_LABELS[m.role] ?? m.role?.toUpperCase()}
              </span>

              {/* Joined */}
              <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{timeAgo(m.created_at)}</span>

              {/* Posts */}
              <span style={{ fontFamily: R, fontSize: "13px", color: "#4A7C59" }}>{m.post_count}</span>

              {/* Badges */}
              <span style={{ fontFamily: R, fontSize: "13px", color: "#156530" }}>{m.user_badges?.length ?? 0}</span>

              {/* Actions */}
              <div style={{ display: "flex", gap: "4px" }} onClick={e => e.stopPropagation()}>
                {canChange && (
                  <select
                    value={m.role}
                    onChange={e => changeRole(m, e.target.value)}
                    disabled={isLoading}
                    style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "4px", padding: "4px 6px", color: roleColor, fontFamily: B, fontSize: "10px", outline: "none", cursor: "pointer" }}>
                    {ROLES.filter(r => isSuperAdmin || !["super_admin", "admin"].includes(r)).map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                )}
                <button onClick={() => toggleBan(m)} disabled={isLoading}
                  style={{ fontFamily: R, fontSize: "9px", color: m.is_banned ? "#1A8040" : "#CC3344", background: "transparent", border: `1px solid ${m.is_banned ? "#1A804040" : "#CC334440"}`, borderRadius: "4px", padding: "4px 8px", cursor: "pointer", letterSpacing: "1px", opacity: isLoading ? 0.5 : 1 }}>
                  {m.is_banned ? "UNBAN" : "BAN"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cards — mobile only */}
      <div className="members-cards-mobile" style={{ flexDirection: "column", gap: "8px" }}>
        {filtered.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>No members found.</div>
        )}
        {filtered.map((m: any) => {
          const isLoading = loadingId === m.id;
          const roleColor = ROLE_COLORS[m.role] ?? "#5A7A60";
          const canChange = canChangeRole(m);
          return (
            <div key={m.id}
              onClick={() => setSelectedMember(m)}
              style={{ background: m.is_banned ? "#2A0A0A" : "#FFFFFF", border: `2px solid ${m.is_banned ? "#CC334440" : "#DDE8DD"}`, borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
            >
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: `2px solid ${roleColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                {m.avatar_url
                  ? <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: R, fontSize: "15px", color: roleColor }}>{(m.display_name ?? "M")[0].toUpperCase()}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: B, fontSize: "13px", color: m.is_banned ? "#5A3030" : "#1B3A2D", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  {m.display_name ?? "—"}
                  {m.is_banned && <span style={{ fontFamily: R, fontSize: "9px", color: "#CC3344", background: "#3D0A14", borderRadius: "4px", padding: "1px 6px" }}>BANNED</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: R, fontSize: "10px", color: roleColor, background: roleColor + "20", borderRadius: "20px", padding: "2px 8px", letterSpacing: "1px" }}>
                    {ROLE_LABELS[m.role] ?? m.role?.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{timeAgo(m.created_at)}</span>
                  <span style={{ fontFamily: B, fontSize: "11px", color: "#4A7C59" }}>{m.post_count} posts</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                {canChange && (
                  <select
                    value={m.role}
                    onChange={e => changeRole(m, e.target.value)}
                    disabled={isLoading}
                    style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "4px", padding: "4px 6px", color: roleColor, fontFamily: B, fontSize: "10px", outline: "none", cursor: "pointer" }}
                  >
                    {ROLES.filter(r => isSuperAdmin || !["super_admin", "admin"].includes(r)).map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                )}
                <button onClick={() => toggleBan(m)} disabled={isLoading}
                  style={{ fontFamily: R, fontSize: "9px", color: m.is_banned ? "#1A8040" : "#CC3344", background: "transparent", border: `1px solid ${m.is_banned ? "#1A804040" : "#CC334440"}`, borderRadius: "4px", padding: "4px 8px", cursor: "pointer", letterSpacing: "1px", opacity: isLoading ? 0.5 : 1 }}>
                  {m.is_banned ? "UNBAN" : "BAN"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Member detail modal */}
      {selectedMember && (
        <div onClick={() => setSelectedMember(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "16px", padding: "28px", width: "420px", maxWidth: "90vw", display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", border: `2px solid ${ROLE_COLORS[selectedMember.role] ?? "#1A8040"}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {selectedMember.avatar_url
                  ? <img src={selectedMember.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: R, fontSize: "22px", color: ROLE_COLORS[selectedMember.role] ?? "#1A8040" }}>{(selectedMember.display_name ?? "M")[0].toUpperCase()}</span>
                }
              </div>
              <div>
                <div style={{ fontFamily: R, fontSize: "16px", color: "#1B3A2D", letterSpacing: "1px" }}>{selectedMember.display_name ?? "Member"}</div>
                <span style={{ fontFamily: R, fontSize: "10px", color: ROLE_COLORS[selectedMember.role], background: (ROLE_COLORS[selectedMember.role] ?? "#1A8040") + "20", borderRadius: "20px", padding: "2px 10px" }}>
                  {ROLE_LABELS[selectedMember.role] ?? selectedMember.role}
                </span>
              </div>
              <button onClick={() => setSelectedMember(null)}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "#5A7A60", cursor: "pointer", display: "flex" }}><IconX size={18} color="#5A7A60" /></button>
            </div>

            {/* Details grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "#F7FAF5", borderRadius: "10px", padding: "16px" }}>
              {[
                { label: "Member ID", value: selectedMember.id.slice(0, 16) + "..." },
                { label: "Joined", value: new Date(selectedMember.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) },
                { label: "Posts", value: selectedMember.post_count },
                { label: "Badges", value: selectedMember.user_badges?.length ?? 0 },
                { label: "Image Posts Used", value: `${selectedMember.image_post_count ?? 0}/10` },
                { label: "Status", value: selectedMember.is_banned ? <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#CC3344" }}><IconWarning size={11} color="#CC3344" /> BANNED</span> : <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#1A8040" }}><IconCheck size={11} color="#1A8040" /> ACTIVE</span> },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "2px" }}>{label}</div>
                  <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D" }}>{value}</div>
                </div>
              ))}
            </div>

            {selectedMember.bio && (
              <div style={{ background: "#F7FAF5", borderRadius: "10px", padding: "12px 16px" }}>
                <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60", marginBottom: "4px" }}>BIO</div>
                <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", lineHeight: 1.6 }}>{selectedMember.bio}</div>
              </div>
            )}

            {/* Actions */}
            {canChangeRole(selectedMember) && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {ROLES.filter(r => r !== selectedMember.role && (isSuperAdmin || !["super_admin", "admin"].includes(r))).map(r => (
                  <button key={r} onClick={() => changeRole(selectedMember, r)} disabled={loadingId === selectedMember.id}
                    style={{ fontFamily: R, fontSize: "10px", background: (ROLE_COLORS[r] ?? "#1A8040") + "20", border: `1.5px solid ${ROLE_COLORS[r] ?? "#1A8040"}`, color: ROLE_COLORS[r] ?? "#1A8040", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", letterSpacing: "1px" }}>
                    → {ROLE_LABELS[r]}
                  </button>
                ))}
                <button onClick={() => toggleBan(selectedMember)} disabled={loadingId === selectedMember.id}
                  style={{ fontFamily: R, fontSize: "10px", background: selectedMember.is_banned ? "#E8F0E4" : "#3D0A14", border: `1.5px solid ${selectedMember.is_banned ? "#1A8040" : "#CC3344"}`, color: selectedMember.is_banned ? "#1A8040" : "#CC3344", borderRadius: "6px", padding: "6px 14px", cursor: "pointer", letterSpacing: "1px" }}>
                  {selectedMember.is_banned ? "UNBAN" : "BAN"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
