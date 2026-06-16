"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";

const R = "var(--font-righteous,'Righteous',sans-serif)";

function sortPosts(posts: any[]) {
  return [...posts].sort((a, b) => {
    if (b.is_pinned && !a.is_pinned) return 1;
    if (a.is_pinned && !b.is_pinned) return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
const B = "var(--font-barlow,'Barlow',sans-serif)";

interface CommunityFeedProps {
  initialPosts: any[];
  categories: any[];
  currentUser: any;
}

export default function CommunityFeed({ initialPosts, categories, currentUser }: CommunityFeedProps) {
  const [posts, setPosts] = useState(sortPosts(initialPosts ?? []));
  const [imagePostCount, setImagePostCount] = useState(currentUser?.image_post_count ?? 0);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPostAlert, setNewPostAlert] = useState(0);
  const supabase = createClient();
  const postsRef = useRef(posts);
  postsRef.current = posts;
  const searchTimeout = useRef<any>(null);

  useEffect(() => {
    const channel = supabase
      .channel("community_feed_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_posts" }, async (payload) => {
        if (payload.new.is_hidden) return;
        const { data } = await supabase
          .from("community_posts")
          .select("*, profiles:user_id(id,display_name,avatar_url,role), community_reactions(id,user_id,reaction_type), community_comments(id)")
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
          setPosts(prev => sortPosts(prev.map(p => p.id === updated.id ? { ...p, ...updated } : p)));
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

  async function fetchPosts(catId: string, q: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (catId) params.set("category", catId);
    if (q) params.set("q", q);
    const res = await fetch(`/api/community/posts?${params.toString()}`);
    const { posts: fresh } = await res.json();
    setPosts(sortPosts(fresh ?? []));
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

  function handlePostCreated(newPost: any, newCount?: number) {
    setPosts(prev => sortPosts([newPost, ...prev]));
    if (newCount !== undefined) setImagePostCount(newCount);
  }

  function handlePostDeleted(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  return (
    <div>
      <div style={{ position: "relative", marginBottom: "14px" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="8" stroke="#5A7A60" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="#5A7A60" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          className="cf-search-input"
          value={searchInput}
          onChange={e => handleSearchInput(e.target.value)}
          placeholder="Search posts..."
          style={{ width: "100%", background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "12px", padding: "11px 40px 11px 38px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
        />
        {searchInput && (
          <button onClick={clearSearch} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#5A7A60", cursor: "pointer", fontSize: "16px", padding: 0 }}>✕</button>
        )}
      </div>

      <div style={{ position: "relative", marginBottom: "16px" }}>
        <div className="cf-chips">
        <button className={`cf-chip${!activeCategory ? " active" : ""}`} onClick={() => filterByCategory("")}>ALL POSTS</button>
        {categories.map((cat) => (
          <button key={cat.id} className={`cf-chip${activeCategory === cat.id ? " active" : ""}`} onClick={() => filterByCategory(cat.id)}>
            {cat.name.toUpperCase()}
          </button>
        ))}
        </div>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 4, width: "48px", background: "linear-gradient(to right, transparent, #F7FAF5)", pointerEvents: "none", borderRadius: "0 20px 20px 0" }} />
      </div>

      {newPostAlert > 0 && (
        <button className="cf-new-alert" onClick={loadNewPosts}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="#3CCE2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "1px" }}>
            {newPostAlert} new post{newPostAlert > 1 ? "s" : ""} — tap to refresh
          </span>
        </button>
      )}

      <CreatePost categories={categories} currentUser={currentUser} onPostCreated={handlePostCreated} imagePostCount={imagePostCount} />

      {search && (
        <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginBottom: "10px" }}>
          {loading ? "Searching..." : `${posts.length} result${posts.length !== 1 ? "s" : ""} for "${search}"`}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 24px", fontFamily: R, color: "#5A7A60", letterSpacing: "2px", fontSize: "12px" }}>LOADING...</div>
      ) : posts.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "16px", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>💬</div>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#5A7A60", letterSpacing: "2px", marginBottom: "6px" }}>
            {search ? "NO POSTS FOUND" : "NO POSTS YET"}
          </div>
          <div style={{ fontFamily: B, fontSize: "13px", color: "#3A5A30" }}>
            {search ? `No posts matching "${search}"` : "Be the first to post something!"}
          </div>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={currentUser.id} onDelete={handlePostDeleted} />
        ))
      )}
    </div>
  );
}
