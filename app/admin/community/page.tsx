"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useState, useEffect, useMemo } from "react";
import { IconPin, IconMessage, IconHeart, IconPhoto, IconVideo, IconX } from "@/components/shared/Icons";
import StatBar from "@/components/shared/StatBar";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type FilterKey = "all" | "pinned" | "hidden" | "images" | "video" | "commented";

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p: any) => {
      if (filter === "pinned"    && !p.is_pinned) return false;
      if (filter === "hidden"    && !p.is_hidden) return false;
      if (filter === "images"    && !(p.images?.length > 0)) return false;
      if (filter === "video"     && !p.video_url) return false;
      if (filter === "commented" && !(p.community_comments?.length > 0)) return false;
      if (!q) return true;
      const author = (p.profiles?.display_name ?? "").toLowerCase();
      const content = (p.content ?? "").toLowerCase();
      const id = (p.id ?? "").toLowerCase();
      return author.includes(q) || content.includes(q) || id.includes(q);
    });
  }, [posts, search, filter]);

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: "all",       label: "ALL",       count: posts.length },
    { key: "pinned",    label: "PINNED",    count: pinnedPosts },
    { key: "hidden",    label: "HIDDEN",    count: hiddenPosts },
    { key: "images",    label: "WITH IMAGES",  count: posts.filter(p => p.images?.length > 0).length },
    { key: "video",     label: "WITH VIDEO",   count: posts.filter(p => p.video_url).length },
    { key: "commented", label: "COMMENTED",    count: posts.filter(p => p.community_comments?.length > 0).length },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>COMMUNITY</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>{totalPosts} posts · {pinnedPosts} pinned · {hiddenPosts} hidden</p>
      </div>

      {/* Stats row */}
      <StatBar items={[
        { label: "TOTAL POSTS", value: totalPosts,  color: "#1A8040", active: filter === "all",    onClick: () => setFilter("all") },
        { label: "PINNED",      value: pinnedPosts, color: "#156530", active: filter === "pinned", onClick: () => setFilter("pinned") },
        { label: "HIDDEN",      value: hiddenPosts, color: "#CC3344", active: filter === "hidden", onClick: () => setFilter("hidden") },
      ]} />


      {/* Posts list */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
          <h2 style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "2px", margin: 0 }}>ALL POSTS</h2>
          <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>{filtered.length} of {posts.length}</span>
        </div>

        {/* Search + filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          <div style={{ position: "relative" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A8E7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search posts by author, content, or ID…"
              style={{ width: "100%", background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "11px 40px 11px 40px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            {search && (
              <button type="button" onClick={() => setSearch("")}
                aria-label="Clear search"
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <IconX size={10} color="#5A7A60" />
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {FILTERS.map(f => {
              const active = filter === f.key;
              const accent = f.key === "hidden" ? "#CC3344" : f.key === "pinned" ? "#156530" : "#1A8040";
              return (
                <button key={f.key} type="button" onClick={() => setFilter(f.key)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "1.2px", color: active ? "#ffffff" : "#1B3A2D", background: active ? accent : "#F2F7F2", border: `1.5px solid ${active ? accent : "transparent"}`, borderRadius: "10px", padding: "8px 14px", cursor: "pointer", outline: "none", transition: "background 0.15s, color 0.15s", boxShadow: active ? `0 2px 8px ${accent}30` : "none" }}>
                  {f.label}
                  <span style={{ fontSize: "9px", opacity: 0.85, background: active ? "rgba(255,255,255,0.2)" : "rgba(26,128,64,0.12)", borderRadius: "999px", padding: "1px 6px", color: active ? "#ffffff" : "#4A7C59" }}>{f.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
            <SkeletonPage />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.map((p: any) => (
              <div key={p.id} style={{ background: p.is_hidden ? "#FFF5F6" : "#FFFFFF", border: `2px solid ${p.is_pinned ? "#156530" : p.is_hidden ? "#CC3344" : "#DDE8DD"}`, borderRadius: "10px", overflow: "hidden" }}>
                <div onClick={() => setExpanded(expanded === p.id ? null : p.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", padding: "12px 16px", cursor: "pointer" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: R, fontSize: "12px", color: "#1A8040", letterSpacing: "1px" }}>{p.profiles?.display_name ?? "Member"}</span>
                      {p.is_pinned && <span style={{ fontFamily: R, fontSize: "9px", color: "#156530", background: "#E8F4EC", border: "1px solid #1A804040", borderRadius: "4px", padding: "1px 6px", letterSpacing: "1px", display: "inline-flex", alignItems: "center", gap: "3px" }}><IconPin size={9} color="#156530" /> PINNED</span>}
                      {p.is_hidden && <span style={{ fontFamily: R, fontSize: "9px", color: "#CC3344", background: "#FFE8EC", border: "1px solid #CC334440", borderRadius: "4px", padding: "1px 6px", letterSpacing: "1px", display: "inline-flex", alignItems: "center", gap: "3px" }}><IconX size={9} color="#CC3344" /> HIDDEN</span>}
                      <span style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60" }}>{new Date(p.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</span>
                    </div>
                    {p.content && <p style={{ fontFamily: B, fontSize: "13px", color: p.is_hidden ? "#5A4040" : "#5A7A60", margin: "0 0 6px" }}>{p.content.slice(0, 120)}{p.content.length > 120 ? "..." : ""}</p>}
                    {!p.content && p.images?.length > 0 && <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "0 0 6px", display: "flex", alignItems: "center", gap: "4px" }}><IconPhoto size={12} color="#5A7A60" /> {p.images.length} image{p.images.length > 1 ? "s" : ""}</p>}
                    {!p.content && p.video_url && <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "0 0 6px", display: "flex", alignItems: "center", gap: "4px" }}><IconVideo size={12} color="#5A7A60" /> Video post</p>}
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "flex", alignItems: "center", gap: "3px" }}><IconMessage size={11} color="#5A7A60" /> {p.community_comments?.length ?? 0}</span>
                      <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "flex", alignItems: "center", gap: "3px" }}><IconHeart size={11} color="#5A7A60" /> {p.community_reactions?.length ?? 0}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0, alignItems: "center" }}>
                    <button onClick={(e) => { e.stopPropagation(); togglePin(p); }} disabled={actionLoading === p.id + "-pin"} title={p.is_pinned ? "Unpin" : "Pin"} style={{ background: p.is_pinned ? "#E8F4EC" : "#FFFFFF", border: `1px solid ${p.is_pinned ? "#156530" : "#DDE8DD"}`, borderRadius: "6px", color: p.is_pinned ? "#156530" : "#5A7A60", padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); toggleHide(p); }} disabled={actionLoading === p.id + "-hide"} title={p.is_hidden ? "Unhide" : "Hide"} style={{ background: p.is_hidden ? "#FFE8EC" : "#FFFFFF", border: `1px solid ${p.is_hidden ? "#CC3344" : "#DDE8DD"}`, borderRadius: "6px", color: p.is_hidden ? "#CC3344" : "#5A7A60", padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); deletePost(p.id); }} disabled={actionLoading === p.id + "-delete"} title="Delete permanently" style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "6px", color: "#CC3344", padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
                    <span style={{ color: "#5A7A60", fontSize: "11px", marginLeft: "2px" }}>{expanded === p.id ? "▲" : "▼"}</span>
                  </div>
                </div>
                {expanded === p.id && (
                  <div style={{ borderTop: "1px solid #DDE8DD", padding: "16px", background: "#F2F7F2", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {p.content && (
                      <div>
                        <div style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "6px" }}>FULL CONTENT</div>
                        <p style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{p.content}</p>
                      </div>
                    )}
                    {p.images?.length > 0 && (
                      <div>
                        <div style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "8px" }}>IMAGES ({p.images.length})</div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {p.images.map((url: string, i: number) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img src={url} alt="" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1.5px solid #DDE8DD" }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {p.video_url && (
                      <div>
                        <div style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "6px" }}>VIDEO</div>
                        <a href={p.video_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: B, fontSize: "12px", color: "#1A8040" }}>{p.video_url}</a>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "20px", paddingTop: "4px", borderTop: "1px solid #DDE8DD" }}>
                      <span style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", display: "flex", alignItems: "center", gap: "4px" }}><IconMessage size={12} color="#4A7C59" /> {p.community_comments?.length ?? 0} comments</span>
                      <span style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", display: "flex", alignItems: "center", gap: "4px" }}><IconHeart size={12} color="#4A7C59" /> {p.community_reactions?.length ?? 0} reactions</span>
                      <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>ID: {p.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!filtered.length && (
              <div style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
                <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#4A7C59", letterSpacing: "2px", marginBottom: "6px" }}>{posts.length ? "NO POSTS MATCH THIS FILTER" : "NO POSTS YET"}</div>
                {posts.length > 0 && (
                  <button type="button" onClick={() => { setSearch(""); setFilter("all"); }}
                    style={{ marginTop: "8px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "10px", padding: "9px 16px", cursor: "pointer", letterSpacing: "1.2px", boxShadow: "0 2px 8px rgba(26,128,64,0.25)" }}>
                    CLEAR FILTERS
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
