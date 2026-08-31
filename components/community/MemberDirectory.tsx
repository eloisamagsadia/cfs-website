"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { IconX, IconCheck, IconSparkle, IconShield, IconWrench } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  paper:  "#FAFDF9",
  cream:  "#F2F7F2",
  mist:   "#E8F0E4",
  forest: "#1B3A2D",
  sage:   "#4A7C59",
  border: "#DDE8DD",
  hair:   "#EEF3EE",
  muted:  "#7A8E7A",
  green:  "#1A8040",
};

const ROLE_META: Record<string, { label: string; color: string; icon: React.ReactNode | null }> = {
  super_admin: { label: "SUPER",   color: "#156530", icon: <IconShield size={9} color="#156530" /> },
  admin:       { label: "ADMIN",   color: "#1A8040", icon: <IconShield size={9} color="#1A8040" /> },
  moderator:   { label: "MOD",     color: "#5A7A60", icon: <IconWrench size={9} color="#5A7A60" /> },
  sponsor:     { label: "SPONSOR", color: "#B78A1F", icon: <IconSparkle size={9} color="#B78A1F" /> },
  member:      { label: "",        color: "#1A8040", icon: null },
  guest:       { label: "GUEST",   color: "#5A7A60", icon: null },
};

type SortKey = "name" | "joined" | "role";

interface MemberDirectoryProps {
  members: any[];
  currentUserId: string;
  followingIds: string[];
}

export default function MemberDirectory({ members, currentUserId, followingIds: initialFollowing }: MemberDirectoryProps) {
  const [following, setFollowing] = useState(new Set(initialFollowing));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("joined");

  const roleRank: Record<string, number> = { super_admin: 0, admin: 1, moderator: 2, sponsor: 3, member: 4, guest: 5 };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = members.filter(m => {
      if (!q) return true;
      const name = (m.display_name ?? "").toLowerCase();
      const bio  = (m.bio ?? "").toLowerCase();
      return name.includes(q) || bio.includes(q);
    });
    return [...arr].sort((a, b) => {
      if (sort === "name")   return (a.display_name ?? "").localeCompare(b.display_name ?? "");
      if (sort === "role")   return (roleRank[a.role] ?? 4) - (roleRank[b.role] ?? 4);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [members, search, sort]);

  async function toggleFollow(userId: string) {
    if (loading) return;
    setLoading(userId);
    const wasFollowing = following.has(userId);
    const method = wasFollowing ? "DELETE" : "POST";
    setFollowing(prev => {
      const next = new Set(prev);
      wasFollowing ? next.delete(userId) : next.add(userId);
      return next;
    });
    try {
      const res = await fetch(`/api/community/follow/${userId}`, { method });
      if (!res.ok) throw new Error(`Follow ${method} failed: ${res.status}`);
    } catch (err) {
      setFollowing(prev => {
        const next = new Set(prev);
        wasFollowing ? next.add(userId) : next.delete(userId);
        return next;
      });
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        .md-card { transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s; }
        .md-card:hover { border-color: #1A8040 !important; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15,42,30,0.08); }
        @media (max-width: 480px) {
          .md-toolbar { flex-direction: column !important; align-items: stretch !important; }
          .md-sort { width: 100% !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: C.forest, letterSpacing: "3px", marginBottom: "4px" }}>MEMBER DIRECTORY</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: C.sage }}>
            {filtered.length} of {members.length} member{members.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/members/community" style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: C.muted, textDecoration: "none", letterSpacing: "1.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <svg width="6" height="10" viewBox="0 0 6 10"><path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
          BACK TO FEED
        </Link>
      </div>

      {/* Search + sort */}
      <div className="md-toolbar" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A8E7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or bio…"
            style={{ width: "100%", background: "#ffffff", border: `1.5px solid ${C.border}`, borderRadius: "10px", padding: "10px 40px 10px 40px", color: C.forest, fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              aria-label="Clear search"
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: C.mist, border: `1px solid ${C.border}`, borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <IconX size={10} color="#5A7A60" />
            </button>
          )}
        </div>
        <select
          className="md-sort"
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          style={{ background: "#ffffff", border: `1.5px solid ${C.border}`, borderRadius: "10px", padding: "10px 14px", color: C.forest, fontFamily: SG, fontSize: "11px", fontWeight: 700, letterSpacing: "1.2px", outline: "none", cursor: "pointer" }}
        >
          <option value="joined">SORT: NEWEST</option>
          <option value="name">SORT: A → Z</option>
          <option value="role">SORT: ROLE</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: `1.5px dashed ${C.border}`, borderRadius: "14px", padding: "56px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: C.forest, letterSpacing: "2px", marginBottom: "6px" }}>
            {members.length ? "NO MEMBERS MATCH" : "NO MEMBERS YET"}
          </div>
          {members.length > 0 && (
            <button type="button" onClick={() => setSearch("")}
              style={{ marginTop: "12px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: C.green, border: "none", borderRadius: "10px", padding: "9px 18px", cursor: "pointer", letterSpacing: "1.2px", boxShadow: "0 2px 8px rgba(26,128,64,0.25)" }}>
              CLEAR SEARCH
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
          {filtered.map(member => {
            const isMe = member.id === currentUserId;
            const isFollowing = following.has(member.id);
            const role = ROLE_META[member.role] ?? ROLE_META.member;

            return (
              <div key={member.id} className="md-card" style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Top row: avatar + name/role + action */}
                <Link href={`/members/community/members/${member.id}`} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit", flex: 1, minWidth: 0 }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `${role.color}15`, border: `2px solid ${role.color}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {member.avatar_url
                      ? <img src={member.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: R, fontSize: "16px", color: role.color }}>{(member.display_name ?? "M")[0].toUpperCase()}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: R, fontSize: "13px", color: C.forest, letterSpacing: "0.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {member.display_name ?? "Member"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                      {role.label && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontFamily: SG, fontSize: "8px", fontWeight: 700, color: role.color, background: `${role.color}12`, border: `1px solid ${role.color}30`, borderRadius: "999px", padding: "2px 6px", letterSpacing: "1px" }}>
                          {role.icon}{role.label}
                        </span>
                      )}
                      <span style={{ fontFamily: B, fontSize: "10px", color: C.muted }}>
                        since {new Date(member.created_at).toLocaleDateString("en-PH", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Bio */}
                {member.bio && (
                  <div style={{ fontFamily: B, fontSize: "11px", color: C.sage, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                    {member.bio}
                  </div>
                )}

                {/* Bottom row: follow action or YOU tag */}
                {isMe ? (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: C.sage, background: C.mist, borderRadius: "999px", padding: "4px 10px", letterSpacing: "1.5px" }}>YOU</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleFollow(member.id)}
                    disabled={loading === member.id}
                    style={{
                      alignSelf: "flex-start",
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "1.2px",
                      background: isFollowing ? C.mist : C.green,
                      color: isFollowing ? C.green : "#ffffff",
                      border: isFollowing ? `1.5px solid ${C.green}40` : "1.5px solid transparent",
                      borderRadius: "999px",
                      padding: "7px 14px",
                      cursor: loading === member.id ? "wait" : "pointer",
                      opacity: loading === member.id ? 0.6 : 1,
                      outline: "none",
                      transition: "background 0.15s",
                      boxShadow: isFollowing ? "none" : "0 2px 8px rgba(26,128,64,0.25)",
                    }}
                  >
                    {loading === member.id
                      ? "…"
                      : isFollowing
                        ? <><IconCheck size={10} color={C.green} /> FOLLOWING</>
                        : "FOLLOW +"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
