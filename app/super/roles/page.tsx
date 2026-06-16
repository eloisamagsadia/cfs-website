"use client";
import { useEffect, useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const ROLES = ["super_admin", "admin", "moderator", "sponsor", "member"];
const ROLE_COLORS: Record<string, string> = {
  super_admin: "#F5C82A", admin: "#F07228", moderator: "#69C9D0", sponsor: "#B47FE3", member: "#3CCE2A",
};

export default function RolesPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/members").then(r => r.json()).then(d => {
      setMembers(d.members ?? []);
      setLoading(false);
    });
  }, []);

  async function updateRole(userId: string, role: string) {
    setUpdating(userId);
    setError(""); setSuccess("");
    const res = await fetch("/api/admin/members/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to update role");
    } else {
      setMembers(p => p.map(m => m.id === userId ? { ...m, role } : m));
      setSuccess(`Role updated to ${role}. User must sign out and back in.`);
    }
    setUpdating(null);
  }

  async function deleteUser(userId: string) {
    setDeleting(userId);
    setError(""); setSuccess("");
    const res = await fetch("/api/admin/members/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to delete user");
    } else {
      setMembers(p => p.filter(m => m.id !== userId));
      setSuccess("User deleted successfully.");
    }
    setDeleting(null);
    setConfirmDelete(null);
  }

  const filtered = members.filter(m =>
    m.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.id.includes(search)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F5C82A", letterSpacing: "3px", marginBottom: "4px" }}>ROLE MANAGEMENT</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Manage member roles across the platform</p>
      </div>

      {error && (
        <div style={{ background: "#3D0A18", border: "1.5px solid #F04060", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#F04060" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: "#0A2614", border: "1.5px solid #3CCE2A", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#3CCE2A" }}>
          {success}
        </div>
      )}

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
        style={{ background: "#1A2614", border: "1.5px solid #2C4820", borderRadius: "8px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none" }} />

      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ background: "#243520", padding: "10px 20px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "12px" }}>
          {["MEMBER", "CURRENT ROLE", "CHANGE ROLE", ""].map(h => (
            <span key={h} style={{ fontFamily: R, fontSize: "10px", color: "#5A7A50", letterSpacing: "1.5px" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A50" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A50" }}>No members found</div>
        ) : filtered.map((m, i) => (
          <div key={m.id} style={{ padding: "12px 20px", borderTop: "1px solid #2C4820", background: i % 2 === 0 ? "#1A2614" : "#162212", display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "12px", alignItems: "center" }}>
            {/* Member info */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#243520", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m.avatar_url
                  ? <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: R, fontSize: "13px", color: "#3CCE2A" }}>{(m.display_name ?? "M")[0].toUpperCase()}</span>}
              </div>
              <div>
                <div style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6" }}>{m.display_name ?? "Member"}</div>
                <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50" }}>{m.email ?? m.id.slice(0, 20) + "..."}</div>
              </div>
            </div>

            {/* Current role badge */}
            <span style={{ fontFamily: R, fontSize: "10px", color: ROLE_COLORS[m.role] ?? "#5A7A50", background: (ROLE_COLORS[m.role] ?? "#5A7A50") + "20", borderRadius: "4px", padding: "2px 8px", letterSpacing: "1px", width: "fit-content" }}>
              {(m.role ?? "member").toUpperCase()}
            </span>

            {/* Role dropdown */}
            <select value={m.role ?? "member"} onChange={e => updateRole(m.id, e.target.value)} disabled={updating === m.id}
              style={{ background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "6px 10px", color: "#F0EAD6", fontFamily: B, fontSize: "12px", cursor: "pointer", outline: "none", opacity: updating === m.id ? 0.5 : 1 }}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Delete button */}
            {confirmDelete === m.id ? (
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => deleteUser(m.id)} disabled={deleting === m.id}
                  style={{ fontFamily: B, fontSize: "11px", color: "#F04060", background: "#3D0A18", border: "1px solid #F04060", borderRadius: "5px", padding: "4px 10px", cursor: "pointer" }}>
                  {deleting === m.id ? "..." : "YES"}
                </button>
                <button onClick={() => setConfirmDelete(null)}
                  style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", background: "transparent", border: "1px solid #2C4820", borderRadius: "5px", padding: "4px 10px", cursor: "pointer" }}>
                  NO
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(m.id)}
                style={{ fontFamily: B, fontSize: "11px", color: "#F04060", background: "transparent", border: "1px solid #3D1A22", borderRadius: "5px", padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
