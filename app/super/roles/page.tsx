"use client";
import { useEffect, useState } from "react";
import { SkListLoading } from "@/components/shared/Skeleton";
import { usePagination, TableCountBar, TablePagination } from "@/components/shared/TablePagination";

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
  const [roleFilter, setRoleFilter] = useState<string>("all");
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
    const res = await fetch("/api/super/members-role", {
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

  // Counts drive the chip badges and are computed over ALL members, not the
  // searched subset — a chip reading "ADMIN 3" should mean three admins exist,
  // not three that happen to match the current search box.
  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = members.filter(m => (m.role ?? "member") === r).length;
    return acc;
  }, {} as Record<string, number>);

  const filtered = members.filter(m => {
    if (roleFilter !== "all" && (m.role ?? "member") !== roleFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (m.display_name?.toLowerCase().includes(q) ?? false)
        || (m.email?.toLowerCase().includes(q) ?? false)
        || m.id.toLowerCase().includes(q);
  });

  // Role Management listed all 640 members, each with its own select and
  // delete button. Paged over the searched set; resetKey returns to page 1
  // when the search narrows things.
  const { page, setPage, pageSize, setPageSize, pageCount, startIdx, paged } =
    usePagination(filtered, 25, `${search}|${roleFilter}`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", marginBottom: "4px" }}>ROLE MANAGEMENT</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Manage member roles across the platform</p>
      </div>

      {error && (
        <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>
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

      {/* Role filter — the page managed roles but gave no way to see just one.
          Finding the 3 admins among 640 members meant scrolling or guessing a
          search term. Counts come from the full set so a chip always states how
          many exist, regardless of what is typed in the search box. */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {[{ key: "all", label: "ALL", count: members.length },
          ...ROLES.map(r => ({ key: r, label: r.replace("_", " ").toUpperCase(), count: roleCounts[r] ?? 0 }))
        ].map(c => {
          const active = roleFilter === c.key;
          const tone = c.key === "all" ? "#1B3A2D" : (ROLE_COLORS[c.key] ?? "#5A7A60");
          return (
            <button key={c.key} type="button" onClick={() => setRoleFilter(c.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                fontFamily: R, fontSize: "10px", letterSpacing: "1.3px",
                color: active ? "#FFFFFF" : tone,
                background: active ? tone : "#FFFFFF",
                border: `1.5px solid ${active ? tone : "#DDE8DD"}`,
                borderRadius: "999px", padding: "7px 14px", cursor: "pointer",
              }}>
              {c.label}
              <span style={{ fontFamily: B, fontSize: "10px", fontWeight: 700, background: active ? "rgba(255,255,255,0.25)" : "#F2F7F2", color: active ? "#FFFFFF" : tone, borderRadius: "999px", padding: "1px 7px" }}>
                {c.count}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
        <TableCountBar total={members.length} filteredTotal={filtered.length} pageSize={pageSize} setPageSize={setPageSize} noun="MEMBERS" />
        <div style={{ background: "#F2F7F2", padding: "10px 20px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "12px" }}>
          {["MEMBER", "CURRENT ROLE", "CHANGE ROLE", ""].map(h => (
            <span key={h} style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "1.5px" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <SkListLoading rows={5} />
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>No members match this filter.</div>
        ) : paged.map((m, i) => (
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
                  style={{ fontFamily: B, fontSize: "11px", color: "#CC3344", background: "#FFE8EC", border: "1px solid #CC3344", borderRadius: "5px", padding: "4px 10px", cursor: "pointer" }}>
                  {deleting === m.id ? "..." : "YES"}
                </button>
                <button onClick={() => setConfirmDelete(null)}
                  style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", background: "transparent", border: "1px solid #DDE8DD", borderRadius: "5px", padding: "4px 10px", cursor: "pointer" }}>
                  NO
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(m.id)}
                style={{ fontFamily: B, fontSize: "11px", color: "#CC3344", background: "transparent", border: "1px solid #CC3344", borderRadius: "5px", padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>
                Delete
              </button>
            )}
          </div>
        ))}

        <TablePagination page={page} setPage={setPage} pageCount={pageCount} startIdx={startIdx} pageSize={pageSize} filteredTotal={filtered.length} />
      </div>
    </div>
  );
}
