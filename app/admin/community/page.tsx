"use client";
import { useState, useEffect } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [postsRes, reportsRes] = await Promise.all([
      fetch("/api/admin/community"),
      fetch("/api/community/posts?limit=0").catch(() => ({ ok: false })),
    ]);
    if (postsRes.ok) { const d = await postsRes.json(); setPosts(d.posts ?? []); }
    setLoading(false);
  }

  async function togglePin(post: any) {
    setActionLoading(post.id + "-pin");
    await fetch("/api/admin/community", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: post.id, is_pinned: !post.is_pinned }) });
    setPosts(ps => ps.map(p => p.id === post.id ? { ...p, is_pinned: !p.is_pinned } : p));
    setActionLoading(null);
  }

  async function toggleHide(post: any) {
    setActionLoading(post.id + "-hide");
    await fetch("/api/admin/community", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: post.id, is_hidden: !post.is_hidden }) });
    setPosts(ps => ps.map(p => p.id === post.id ? { ...p, is_hidden: !p.is_hidden } : p));
    setActionLoading(null);
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post permanently?")) return;
    setActionLoading(id + "-delete");
    await fetch(`/api/admin/community?id=${id}`, { method: "DELETE" });
    setPosts(ps => ps.filter(p => p.id !== id));
    setActionLoading(null);
  }

  const totalPosts = posts.length;
  const hiddenPosts = posts.filter(p => p.is_hidden).length;
  const pinnedPosts = posts.filter(p => p.is_pinned).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>COMMUNITY</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>{totalPosts} posts · {pinnedPosts} pinned · {hiddenPosts} hidden</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        {[
          { label: "TOTAL POSTS", value: totalPosts, color: "#3CCE2A" },
          { label: "PINNED", value: pinnedPosts, color: "#F5C82A" },
          { label: "HIDDEN", value: hiddenPosts, color: "#F04060" },
        ].map(s => (
          <div key={s.label} style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "10px", padding: "14px 18px" }}>
            <div style={{ fontFamily: R, fontSize: "1.4rem", color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Posts list */}
      <div>
        <h2 style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", letterSpacing: "2px", marginBottom: "12px" }}>ALL POSTS</h2>
        {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-text" style={{ width: "80%" }} />
      <div className="skeleton skeleton-text" style={{ width: "60%" }} />
      <div className="skeleton skeleton-card" />
    </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {posts.map((p: any) => (
              <div key={p.id} style={{ background: p.is_hidden ? "#1A1010" : "#1A2614", border: `2px solid ${p.is_pinned ? "#F5C82A40" : p.is_hidden ? "#F0406040" : "#2C4820"}`, borderRadius: "10px", padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "1px" }}>{p.profiles?.display_name ?? "Member"}</span>
                      {p.is_pinned && <span style={{ fontFamily: R, fontSize: "9px", color: "#F5C82A", background: "#3D3000", border: "1px solid #F5C82A40", borderRadius: "4px", padding: "1px 6px", letterSpacing: "1px" }}>📌 PINNED</span>}
                      {p.is_hidden && <span style={{ fontFamily: R, fontSize: "9px", color: "#F04060", background: "#3D0A18", border: "1px solid #F0406040", borderRadius: "4px", padding: "1px 6px", letterSpacing: "1px" }}>🚫 HIDDEN</span>}
                      <span style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50" }}>{new Date(p.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</span>
                    </div>
                    <p style={{ fontFamily: B, fontSize: "13px", color: p.is_hidden ? "#5A4040" : "#C8C0A8", margin: 0 }}>
                      {p.content?.slice(0, 120)}{p.content?.length > 120 ? "..." : ""}
                    </p>
                    <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                      <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30" }}>💬 {p.community_comments?.length ?? 0}</span>
                      <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30" }}>❤ {p.community_reactions?.length ?? 0}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    <button
                      onClick={() => togglePin(p)}
                      disabled={actionLoading === p.id + "-pin"}
                      title={p.is_pinned ? "Unpin" : "Pin"}
                      style={{ background: p.is_pinned ? "#3D3000" : "#1A2614", border: `1px solid ${p.is_pinned ? "#F5C82A" : "#2C4820"}`, borderRadius: "6px", color: p.is_pinned ? "#F5C82A" : "#5A7A50", padding: "5px 8px", cursor: "pointer", fontSize: "13px" }}>
                      📌
                    </button>
                    <button
                      onClick={() => toggleHide(p)}
                      disabled={actionLoading === p.id + "-hide"}
                      title={p.is_hidden ? "Unhide" : "Hide"}
                      style={{ background: p.is_hidden ? "#3D0A18" : "#1A2614", border: `1px solid ${p.is_hidden ? "#F04060" : "#2C4820"}`, borderRadius: "6px", color: p.is_hidden ? "#F04060" : "#5A7A50", padding: "5px 8px", cursor: "pointer", fontSize: "13px" }}>
                      🚫
                    </button>
                    <button
                      onClick={() => deletePost(p.id)}
                      disabled={actionLoading === p.id + "-delete"}
                      title="Delete permanently"
                      style={{ background: "#1A2614", border: "1px solid #2C4820", borderRadius: "6px", color: "#F04060", padding: "5px 8px", cursor: "pointer", fontSize: "13px" }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!posts.length && <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A50" }}>NO POSTS YET</div>}
          </div>
        )}
      </div>
    </div>
  );
}
