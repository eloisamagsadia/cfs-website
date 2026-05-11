"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

interface CommunityFeedProps {
  initialPosts: any[];
  categories: any[];
  currentUser: any;
}

export default function CommunityFeed({ initialPosts, categories, currentUser }: CommunityFeedProps) {
  const [posts, setPosts] = useState(initialPosts ?? []);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPostAlert, setNewPostAlert] = useState(0);
  const supabase = createClient();
  const postsRef = useRef(posts);
  postsRef.current = posts;
  const searchTimeout = useRef<any>(null);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("community_feed_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_posts" }, async (payload) => {
        if (payload.new.is_hidden) return;
        const { data } = await supabase
          .from("community_posts")
          .select("*, profiles:user_id(id,display_name,avatar_url), community_reactions(id,user_id,reaction_type), community_comments(id)")
          .eq("id", payload.new.id).single();
        if (!data) return;
        if (data.user_id === currentUser.id) return;
        setNewPostAlert(n => n + 1);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "community_posts" }, (payload) => {
        const updated = payload.new;
        if (updated.is_hidden) {
          setPosts(prev => prev.filter(p => p.id !== updated.id));
        } else {
          setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "community_posts" }, (payload) => {
        setPosts(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_reactions" }, (payload) => {
        const r = payload.new;
        setPosts(prev => prev.map(p => {
          if (p.id !== r.post_id) return p;
          const existing = (p.community_reactions ?? []).find((x: any) => x.id === r.id);
          if (existing) return p;
          return { ...p, community_reactions: [...(p.community_reactions ?? []), r] };
        }));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "community_reactions" }, (payload) => {
        const r = payload.new;
        setPosts(prev => prev.map(p => {
          if (p.id !== r.post_id) return p;
          return { ...p, community_reactions: (p.community_reactions ?? []).map((x: any) => x.id === r.id ? r : x) };
        }));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "community_reactions" }, (payload) => {
        const r = payload.old;
        setPosts(prev => prev.map(p => {
          if (p.id !== r.post_id) return p;
          return { ...p, community_reactions: (p.community_reactions ?? []).filter((x: any) => x.id !== r.id) };
        }));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_comments" }, (payload) => {
        const c = payload.new;
        setPosts(prev => prev.map(p => {
          if (p.id !== c.post_id) return p;
          const existing = (p.community_comments ?? []).find((x: any) => x.id === c.id);
          if (existing) return p;
          return { ...p, community_comments: [...(p.community_comments ?? []), { id: c.id }] };
        }));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "community_comments" }, (payload) => {
        const c = payload.old;
        setPosts(prev => prev.map(p => {
          if (p.id !== c.post_id) return p;
          return { ...p, community_comments: (p.community_comments ?? []).filter((x: any) => x.id !== c.id) };
        }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser.id]);

  // ── Fetch posts ───────────────────────────────────────────────────────────
  async function fetchPosts(catId: string, q: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (catId) params.set("category", catId);
    if (q)     params.set("q", q);
    const res = await fetch(`/api/community/posts?${params.toString()}`);
    const { posts: fresh } = await res.json();
    setPosts(fresh ?? []);
    setLoading(false);
  }

  async function loadNewPosts() {
    setNewPostAlert(0);
    fetchPosts(activeCategory, search);
  }

  async function filterByCategory(catId: string) {
    setActiveCategory(catId);
    setNewPostAlert(0);
    fetchPosts(catId, search);
  }

  function handleSearchInput(val: string) {
    setSearchInput(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      fetchPosts(activeCategory, val);
    }, 400);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    fetchPosts(activeCategory, "");
  }

  function handlePostCreated(newPost: any) {
    setPosts(prev => [newPost, ...prev]);
  }

  function handlePostDeleted(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  return (
    <div>
      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: "12px" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="8" stroke="#5A7A50" strokeWidth="2"/>
          <path d="M21 21l-4.35-4.35" stroke="#5A7A50" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          value={searchInput}
          onChange={e => handleSearchInput(e.target.value)}
          placeholder="Search posts..."
          style={{ width: "100%", background: "#1A2614", border: "1.5px solid #2C4820", borderRadius: "10px", padding: "10px 40px 10px 38px", color: "#F0EAD6", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }}
        />
        {searchInput && (
          <button onClick={clearSearch} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#5A7A50", cursor: "pointer", fontSize: "16px", padding: 0 }}>✕</button>
        )}
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          onClick={() => filterByCategory("")}
          style={{ fontFamily: R, fontSize: "11px", background: !activeCategory ? "#1A3D14" : "transparent", border: `1.5px solid ${!activeCategory ? "#3CCE2A" : "#2C4820"}`, color: !activeCategory ? "#3CCE2A" : "#5A7A50", borderRadius: "20px", padding: "5px 14px", cursor: "pointer", letterSpacing: "1px" }}
        >
          ALL POSTS
        </button>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => filterByCategory(cat.id)}
            style={{ fontFamily: R, fontSize: "11px", background: activeCategory === cat.id ? "#1A3D14" : "transparent", border: `1.5px solid ${activeCategory === cat.id ? "#3CCE2A" : "#2C4820"}`, color: activeCategory === cat.id ? "#3CCE2A" : "#5A7A50", borderRadius: "20px", padding: "5px 14px", cursor: "pointer", letterSpacing: "1px" }}>
            {cat.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* New posts alert */}
      {newPostAlert > 0 && (
        <button
          onClick={loadNewPosts}
          style={{ width: "100%", background: "#1A3D14", border: "1.5px solid #3CCE2A", borderRadius: "10px", padding: "10px", marginBottom: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          <span style={{ fontSize: "16px" }}>🔄</span>
          <span style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "1px" }}>
            {newPostAlert} new post{newPostAlert > 1 ? "s" : ""} — tap to load
          </span>
        </button>
      )}

      {/* Create post */}
      <CreatePost categories={categories} currentUser={currentUser} onPostCreated={handlePostCreated} />

      {/* Search results label */}
      {search && (
        <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", marginBottom: "10px" }}>
          {loading ? "Searching..." : `${posts.length} result${posts.length !== 1 ? "s" : ""} for "${search}"`}
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "32px", fontFamily: R, color: "#5A7A50", letterSpacing: "2px" }}>LOADING...</div>
      ) : posts.length === 0 ? (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
          <div style={{ fontFamily: R, fontSize: "14px", color: "#5A7A50", letterSpacing: "2px" }}>
            {search ? "NO POSTS FOUND" : "NO POSTS YET"}
          </div>
          <div style={{ fontFamily: B, fontSize: "13px", color: "#5A7A50", marginTop: "8px" }}>
            {search ? `No posts matching "${search}"` : "Be the first to post something!"}
          </div>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={currentUser.id} onDelete={handlePostDeleted} />
        ))
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
      `}</style>
    </div>
  );
}
