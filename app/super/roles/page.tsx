"use client";
import { useEffect, useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const ROLES = ["super_admin", "admin", "moderator", "sponsor", "member"];
const ROLE_COLORS: Record<string, string> = {
  super_admin: "#156530", admin: "#1A8040", moderator: "#5A7A60", sponsor: "#1A8040", member: "#1A8040",
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
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", marginBottom: "4px" }}>ROLE MANAGEMENT</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Manage member roles across the platform</p>
      </div>

      {error && (
        <div style={{ background: "#3D0A18", border: "1.5px solid #CC3344", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#1A8040" }}>
          {success}
        </div>
      )}

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
        style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none" }} />

      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ background: "#F2F7F2", padding: "10px 20px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "12px" }}>
          {["MEMBER", "CURRENT ROLE", "CHANGE ROLE", ""].map(h => (
            <span key={h} style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "1.5px" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>No members found</div>
        ) : filtered.map((m, i) => (
          <div key={m.id} style={{ padding: "12px 20px", borderTop: "1px solid #DDE8DD", background: i % 2 === 0 ? "#FFFFFF" : "#EDF7ED", display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "12px", alignItems: "center" }}>
            {/* Member info */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#F2F7F2", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m.avatar_url
                  ? <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: R, fontSize: "13px", color: "#1A8040" }}>{(m.display_name ?? "M")[0].toUpperCase()}</span>}
              </div>
              <div>
                <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D" }}>{m.display_name ?? "Member"}</div>
                <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60" }}>{m.email ?? m.id.slice(0, 20) + "..."}</div>
              </div>
            </div>

            {/* Current role badge */}
            <span style={{ fontFamily: R, fontSize: "10px", color: ROLE_COLORS[m.role] ?? "#5A7A60", background: (ROLE_COLORS[m.role] ?? "#5A7A60") + "20", borderRadius: "4px", padding: "2px 8px", letterSpacing: "1px", width: "fit-content" }}>
              {(m.role ?? "member").toUpperCase()}
            </span>

            {/* Role dropdown */}
            <select value={m.role ?? "member"} onChange={e => updateRole(m.id, e.target.value)} disabled={updating === m.id}
              style={{ background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "6px 10px", color: "#1B3A2D", fontFamily: B, fontSize: "12px", cursor: "pointer", outline: "none", opacity: updating === m.id ? 0.5 : 1 }}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Delete button */}
            {confirmDelete === m.id ? (
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => deleteUser(m.id)} disabled={deleting === m.id}
                  style={{ fontFamily: B, fontSize: "11px", color: "#CC3344", background: "#3D0A18", border: "1px solid #CC3344", borderRadius: "5px", padding: "4px 10px", cursor: "pointer" }}>
                  {deleting === m.id ? "..." : "YES"}
                </button>
                <button onClick={() => setConfirmDelete(null)}
                  style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", background: "transparent", border: "1px solid #DDE8DD", borderRadius: "5px", padding: "4px 10px", cursor: "pointer" }}>
                  NO
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(m.id)}
                style={{ fontFamily: B, fontSize: "11px", color: "#CC3344", background: "transparent", border: "1px solid #3D1A22", borderRadius: "5px", padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
