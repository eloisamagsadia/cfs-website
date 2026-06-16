"use client";
import { useState } from "react";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

interface MemberDirectoryProps {
  members: any[];
  currentUserId: string;
  followingIds: string[];
}

export default function MemberDirectory({ members, currentUserId, followingIds: initialFollowing }: MemberDirectoryProps) {
  const [following, setFollowing] = useState(new Set(initialFollowing));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = members.filter(m =>
    !search || m.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleFollow(userId: string) {
    if (loading) return;
    setLoading(userId);
    const isFollowing = following.has(userId);
    const method = isFollowing ? "DELETE" : "POST";
    await fetch(`/api/community/follow/${userId}`, { method });
    setFollowing(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(userId) : next.add(userId);
      return next;
    });
    setLoading(null);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:"12px" }}>
        <div>
          <h1 style={{ fontFamily:R, fontSize:"1.6rem", color:"#1B3A2D", letterSpacing:"3px", marginBottom:"4px" }}>MEMBER DIRECTORY</h1>
          <p style={{ fontFamily:B, fontSize:"13px", color:"#4A7C59" }}>{filtered.length} members</p>
        </div>
        <Link href="/members/community" style={{ fontFamily:R, fontSize:"11px", color:"#5A7A60", textDecoration:"none", letterSpacing:"1px", display:"flex", alignItems:"center", gap:"6px" }}>
          <svg width="6" height="10" viewBox="0 0 6 10"><path d="M5 1L1 5L5 9" stroke="#5A7A60" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
          BACK TO FEED
        </Link>
      </div>

      {/* Search */}
      <input
        value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search members..."
        style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"8px", padding:"10px 16px", color:"#1B3A2D", fontFamily:B, fontSize:"14px", outline:"none", width:"100%", boxSizing:"border-box" }}
      />

      {/* Members grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"10px" }}>
        {filtered.map((member) => {
          const isMe = member.id === currentUserId;
          const isFollowing = following.has(member.id);
          return (
            <div key={member.id} style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"16px", textAlign:"center" }} className="card-hover">
              {/* Avatar */}
              <div style={{ width:"56px", height:"56px", borderRadius:"50%", background:"#E8F0E4", border:"2px solid #1A8040", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", margin:"0 auto 10px" }}>
                {member.avatar_url
                  ? <img src={member.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <span style={{ fontFamily:R, fontSize:"22px", color:"#1A8040" }}>{(member.display_name ?? "M")[0].toUpperCase()}</span>
                }
              </div>
              <div style={{ fontFamily:R, fontSize:"13px", color:"#1B3A2D", letterSpacing:"1px", marginBottom:"4px" }}>
<Link href={`/members/community/members/${member.id}`} style={{ textDecoration:"none", color:"inherit" }}>{member.display_name ?? "Member"}</Link>
              </div>
              {member.bio && (
                <div style={{ fontFamily:B, fontSize:"11px", color:"#5A7A60", lineHeight:1.5, marginBottom:"10px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as const }}>
                  {member.bio}
                </div>
              )}
              <div style={{ fontFamily:R, fontSize:"10px", color:"#5A7A60", letterSpacing:"1px", marginBottom:"10px" }}>
                SINCE {new Date(member.created_at).toLocaleDateString("en-PH",{month:"short",year:"numeric"})}
              </div>
              {!isMe && (
                <button
                  onClick={() => toggleFollow(member.id)}
                  disabled={loading === member.id}
                  style={{
                    fontFamily:R, fontSize:"11px", letterSpacing:"1px",
                    background: isFollowing ? "transparent" : "#1A8040",
                    color: isFollowing ? "#1A8040" : "#080F06",
                    border: `1.5px solid ${isFollowing ? "#1A8040" : "#080F06"}`,
                    borderRadius:"20px", padding:"5px 16px", cursor:"pointer", width:"100%",
                  }}
                >
                  {loading === member.id ? "..." : isFollowing ? "FOLLOWING ✓" : "FOLLOW +"}
                </button>
              )}
              {isMe && (
                <span style={{ fontFamily:R, fontSize:"10px", color:"#5A7A60", letterSpacing:"1px" }}>YOU</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
