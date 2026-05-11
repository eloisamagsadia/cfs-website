"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import ReactionBar from "./ReactionBar";
import { createClient } from "@/lib/supabase/client";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function formatCount(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function renderContent(content: string) {
  const clean = content.replace(/<[^>]*>/g, "");
  return clean
    .replace(/@(\w+)/g,`<a href="#" onclick="event.preventDefault();fetch('/api/community/member-by-name?name=$1').then(r=>r.json()).then(d=>{if(d.userId)window.location.href='/members/community/members/'+d.userId})" style="color:#3CCE2A;font-weight:600;text-decoration:none;cursor:pointer;">@$1</a>`)
    .replace(/#(?![0-9A-Fa-f]{3,6}\b)(\w+)/g, `<span style="color:#F5C82A;font-weight:600;">#$1</span>`);
}

const COMMENT_REACTIONS = ["❤️","👍","😂","😮","🔥","🥺"];

interface PostCardProps {
  post: any;
  currentUserId: string;
  onDelete?: (postId: string) => void;
}

export default function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
  const [deleted, setDeleted] = useState(false);
  const [previewComments, setPreviewComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isReposted, setIsReposted] = useState((post.community_reposts ?? []).some((r: any) => r.user_id === currentUserId));
  const [repostCount, setRepostCount] = useState((post.community_reposts ?? []).length);
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [commentReactions, setCommentReactions] = useState<Record<string, string>>({});
  const [showCommentReactions, setShowCommentReactions] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewCount] = useState(post.view_count ?? 0);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const isOwner = post.user_id === currentUserId;
  const profile = post.profiles ?? {};
  const reactions = post.community_reactions ?? [];
  const commentCount = post.community_comments?.length ?? 0;
  const content = post.content ?? "";
  const isLong = content.length > 200;
  const isVideo = (url: string) => url.includes(".mp4") || url.includes(".webm") || url.includes("video");
  const isRepost = !!post.repost_of;

  useEffect(() => {
    if (!showComments || previewComments.length > 0) return;
    setLoadingComments(true);
    supabase.from("community_comments")
      .select("*, profiles:user_id(id, display_name, avatar_url)")
      .eq("post_id", post.id).is("parent_comment_id", null)
      .order("created_at", { ascending: true }).limit(2)
      .then(({ data }) => { setPreviewComments(data ?? []); setLoadingComments(false); });
  }, [showComments]);

  useEffect(() => {
    if (showComments) setTimeout(() => commentInputRef.current?.focus(), 100);
  }, [showComments]);

  async function handleDelete() {
    await fetch(`/api/community/posts?id=${post.id}`, { method: "DELETE" });
    setDeleted(true); onDelete?.(post.id);
  }

  async function handleCopyPostLink() {
    setShowMenu(false);
    navigator.clipboard?.writeText(`${window.location.origin}/members/community/${post.id}`);
  }

  async function handleSubmitComment() {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/community/posts/${post.id}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment.trim() }),
    });
    const data = await res.json();
    if (data.comment) { setPreviewComments(prev => [...prev, data.comment]); setNewComment(""); }
    setSubmitting(false);
    commentInputRef.current?.focus();
  }

  async function handleRepost() {
    setShowRepostMenu(false);
    const res = await fetch(`/api/community/posts/${post.id}/repost`, { method: "POST" });
    const data = await res.json();
    setIsReposted(data.reposted);
    setRepostCount((prev: number) => data.reposted ? prev + 1 : Math.max(0, prev - 1));
  }

  function handleCopyLink() {
    setShowRepostMenu(false);
    navigator.clipboard?.writeText(`${window.location.origin}/members/community/${post.id}`);
  }

  function toggleCommentReaction(commentId: string, emoji: string) {
    setCommentReactions(prev => ({ ...prev, [commentId]: prev[commentId] === emoji ? "" : emoji }));
    setShowCommentReactions(null);
  }

  if (deleted) return null;

  return (
    <div
      onMouseDown={(e) => { (e.currentTarget as any)._mouseDownTarget = e.target; }}
      onMouseUp={(e) => {
        const el = e.target as HTMLElement;
        if (el.closest("button,a,input,textarea,video") || (e.currentTarget as any)._mouseDownTarget !== e.target) return;
        if (window.getSelection()?.toString()) return;
        router.push(`/members/community/${post.id}`);
      }}
      style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "16px", marginBottom: "12px", cursor: "pointer", position: "relative" }}
    >

      {/* Repost header */}
      {isRepost && post.reposted_by?.id !== post.user_id && (
        <div style={{ padding: "8px 16px 0", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <polyline points="17 1 21 5 17 9" stroke="#5A7A50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 11V9a4 4 0 014-4h14" stroke="#5A7A50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="7 23 3 19 7 15" stroke="#5A7A50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 13v2a4 4 0 01-4 4H3" stroke="#5A7A50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{post.reposted_by?.display_name ?? profile.display_name} reposted</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#3CCE2A,#F07228)", padding: "2px", flexShrink: 0 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#1A2614", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontFamily: R, fontSize: "15px", color: "#3CCE2A" }}>{(profile.display_name ?? "M")[0].toUpperCase()}</span>
            }
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", letterSpacing: "0.5px" }}>{profile.display_name ?? "Member"}</div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{timeAgo(post.created_at)}</span>
            {post.is_pinned && <span style={{ fontFamily: R, fontSize: "9px", color: "#F5C82A", background: "#3D3000", borderRadius: "4px", padding: "1px 5px" }}>📌</span>}
          </div>
        </div>
        <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(p => !p); }}
            style={{ background: "none", border: "none", color: "#5A7A50", cursor: "pointer", fontSize: "20px", padding: "4px", lineHeight: 1 }}
          >···</button>
          {showMenu && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "6px", zIndex: 40, minWidth: "170px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
              {isOwner ? (<>
                <a href={`/members/community/${post.id}`} onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", textDecoration: "none", fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "13px", color: "#F0EAD6" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#243520")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#F0EAD6" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="#F0EAD6" strokeWidth="2" strokeLinecap="round"/></svg>
                  View post
                </a>
                <button onClick={(e) => { e.stopPropagation(); handleCopyPostLink(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "13px", color: "#F0EAD6", textAlign: "left" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#243520")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#F0EAD6" strokeWidth="2" strokeLinecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#F0EAD6" strokeWidth="2" strokeLinecap="round"/></svg>
                  Copy link
                </button>
                <div style={{ borderTop: "1px solid #2C4820", margin: "4px 0" }}/>
                <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowDeleteConfirm(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "13px", color: "#F04060", textAlign: "left" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#3D0A14")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4h6v2" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/></svg>
                  Delete post
                </button>
              </>) : (
                <button onClick={(e) => { e.stopPropagation(); handleCopyPostLink(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "13px", color: "#F0EAD6", textAlign: "left" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#243520")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#F0EAD6" strokeWidth="2" strokeLinecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#F0EAD6" strokeWidth="2" strokeLinecap="round"/></svg>
                  Copy link
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      {content && (
        <div style={{ padding: "0 16px 10px" }}>
          <div style={{ fontFamily: B, fontSize: "14px", color: "#C8C0A8", lineHeight: 1.75, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            dangerouslySetInnerHTML={{ __html: renderContent(expanded || !isLong ? content : content.slice(0, 200) + "...") }}
          />
          {isLong && <button onClick={() => setExpanded(e => !e)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: B, fontSize: "12px", color: "#5A7A50", padding: "2px 0 0" }}>{expanded ? " see less" : " see more"}</button>}
        </div>
      )}

      {/* ── MEDIA ── */}
      {post.images?.length > 0 && (
        <div style={{ overflow: "hidden", borderRadius: "0 0 14px 14px" }}>
          {post.images.length === 1 ? (
            isVideo(post.images[0])
              ? <video src={post.images[0]} controls style={{ width: "100%", maxHeight: "400px", display: "block", background: "#000" }} />
              : <img src={post.images[0]} alt="" style={{ width: "100%", maxHeight: "400px", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
              {post.images.slice(0, 4).map((url: string, i: number) => (
                <div key={i} style={{ position: "relative" }}>
                  {isVideo(url)
                    ? <video src={url} controls style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }} />
                    : <img src={url} alt="" style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }} />
                  }
                  {i === 3 && post.images.length > 4 && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: R, fontSize: "20px", color: "#fff" }}>+{post.images.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REACTION BAR + REPOST MENU ── */}
      <div style={{ padding: "0 16px", position: "relative" }}>
        <ReactionBar
          postId={post.id}
          reactions={reactions}
          currentUserId={currentUserId}
          commentCount={commentCount}
          repostCount={repostCount}
          isReposted={isReposted}
          onCommentClick={() => setShowComments(s => !s)}
          onRepostClick={() => setShowRepostMenu(s => !s)}
        />

        {showRepostMenu && (
          <div style={{ position: "absolute", bottom: "calc(100% - 8px)", left: "80px", background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "6px", zIndex: 30, minWidth: "180px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            <button onClick={handleRepost}
              style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: B, fontSize: "13px", color: isReposted ? "#3CCE2A" : "#F0EAD6", padding: "9px 12px", textAlign: "left", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#243520")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <polyline points="17 1 21 5 17 9" stroke={isReposted ? "#3CCE2A" : "#F0EAD6"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 11V9a4 4 0 014-4h14" stroke={isReposted ? "#3CCE2A" : "#F0EAD6"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7 23 3 19 7 15" stroke={isReposted ? "#3CCE2A" : "#F0EAD6"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 13v2a4 4 0 01-4 4H3" stroke={isReposted ? "#3CCE2A" : "#F0EAD6"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {isReposted ? "Undo Repost" : "Repost"}
            </button>
            <button onClick={handleCopyLink}
              style={{ width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: B, fontSize: "13px", color: "#F0EAD6", padding: "9px 12px", textAlign: "left", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#243520")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#F0EAD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#F0EAD6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copy link
            </button>
          </div>
        )}
      </div>

      {/* ── ANALYTICS ── */}
      <div style={{ padding: "6px 16px 10px", display: "flex", gap: "14px", alignItems: "center" }}>
        {viewCount > 0 && (
          <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30", display: "flex", alignItems: "center", gap: "3px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M1 12C1 12 5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="#3A5A30" strokeWidth="1.8" fill="none"/><circle cx="12" cy="12" r="3" stroke="#3A5A30" strokeWidth="1.8" fill="none"/></svg>
            {formatCount(viewCount)} views
          </span>
        )}
        {reactions.length > 0 && (
          <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30" }}>
            {formatCount(reactions.length)} like{reactions.length !== 1 ? "s" : ""}
          </span>
        )}
        {repostCount > 0 && (
          <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30" }}>
            {formatCount(repostCount)} repost{repostCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── COMMENT PREVIEW ── */}
      {showComments && (
        <div style={{ borderTop: "1px solid #2C4820", padding: "10px 16px 12px" }}>
          {loadingComments ? (
            <div style={{ fontFamily: B, fontSize: "12px", color: "#3A5A30" }}>Loading...</div>
          ) : (
            <>
              {previewComments.map((comment: any) => (
                <div key={comment.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "14px" }}>
                  {/* Avatar — no bubble box */}
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1A3D14", border: "1.5px solid #2C4820", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {comment.profiles?.avatar_url
                      ? <img src={comment.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A" }}>{(comment.profiles?.display_name ?? "M")[0].toUpperCase()}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + content inline, no bubble */}
                    <div style={{ paddingBottom: "5px" }}>
                      <span style={{ fontFamily: R, fontSize: "12px", color: "#F0EAD6", letterSpacing: "0.5px", marginRight: "7px" }}>
                        {comment.profiles?.display_name ?? "Member"}
                      </span>
                      <span style={{ fontFamily: B, fontSize: "13px", color: "#C8C0A8", lineHeight: 1.65, wordBreak: "break-word" }}
                        dangerouslySetInnerHTML={{ __html: renderContent((comment.content || "").replace(/<[^>]*>/g, "")) }}
                      />
                    </div>
                    {/* Heart + timestamp row */}
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", position: "relative" }}>
                      <button
                        onClick={() => setShowCommentReactions(showCommentReactions === comment.id ? null : comment.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
                      >
                        {commentReactions[comment.id]
                          ? <span style={{ fontSize: "15px" }}>{commentReactions[comment.id]}</span>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="#5A7A50" strokeWidth="1.8" fill="none"/></svg>
                        }
                      </button>
                      <span style={{ fontFamily: B, fontSize: "10px", color: "#3A5A30" }}>{timeAgo(comment.created_at)}</span>
                      <button onClick={() => router.push(`/members/community/${post.id}`)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: B, fontSize: "11px", color: "#5A7A50", padding: 0 }}>Reply</button>
                      {showCommentReactions === comment.id && (
                        <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, background: "#1A2614", border: "2px solid #2C4820", borderRadius: "10px", padding: "6px 8px", display: "flex", gap: "4px", zIndex: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                          {COMMENT_REACTIONS.map(emoji => (
                            <button key={emoji} onClick={() => toggleCommentReaction(comment.id, emoji)}
                              style={{ background: commentReactions[comment.id] === emoji ? "#1A3D14" : "none", border: commentReactions[comment.id] === emoji ? "1.5px solid #3CCE2A" : "1.5px solid transparent", borderRadius: "6px", padding: "4px 6px", cursor: "pointer", fontSize: "16px" }}
                              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.2)")}
                              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {commentCount > 2 && (
                <Link href={`/members/community/${post.id}`} style={{ display: "block", fontFamily: B, fontSize: "12px", color: "#5A7A50", textDecoration: "none", marginBottom: "8px" }}>
                  View all {commentCount} comments →
                </Link>
              )}

              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px" }}>
                <div style={{ flex: 1, background: "#243520", border: "1.5px solid #2C4820", borderRadius: "20px", padding: "7px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    ref={commentInputRef}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSubmitComment(); } }}
                    placeholder="Add a comment..."
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#F0EAD6", fontFamily: B, fontSize: "12px", minWidth: 0 }}
                  />
                  {newComment.trim() && (
                    <button onClick={handleSubmitComment} disabled={submitting}
                      style={{ background: "none", border: "none", cursor: "pointer", fontFamily: R, fontSize: "11px", color: "#3CCE2A", letterSpacing: "1px", padding: 0, flexShrink: 0 }}>
                      POST
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {showDeleteConfirm && createPortal(
        <div onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "16px", padding: "28px 28px 22px", maxWidth: "320px", width: "90%", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}>
            {/* Icon */}
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#3D0A14", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/><path d="M19 6l-1 14H6L5 6" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/><path d="M10 11v6M14 11v6" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4h6v2" stroke="#F04060" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div style={{ fontFamily: R, fontSize: "16px", color: "#F0EAD6", marginBottom: "8px", letterSpacing: "0.5px" }}>Delete post?</div>
            <div style={{ fontFamily: B, fontSize: "13px", color: "#5A7A50", lineHeight: 1.6, marginBottom: "24px" }}>This action can't be undone. The post will be permanently removed.</div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowDeleteConfirm(false)}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "none", border: "2px solid #2C4820", cursor: "pointer", fontFamily: R, fontSize: "13px", color: "#5A7A50", letterSpacing: "0.5px" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#3CCE2A")} onMouseLeave={e => (e.currentTarget.style.borderColor = "#2C4820")}>
                Cancel
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "#F04060", border: "none", cursor: "pointer", fontFamily: R, fontSize: "13px", color: "#fff", letterSpacing: "0.5px" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#C0304A")} onMouseLeave={e => (e.currentTarget.style.background = "#F04060")}>
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── BACKDROPS — stopPropagation prevents bubble up to card onMouseUp ── */}
      {showRepostMenu && <div onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setShowRepostMenu(false); }} style={{ position: "fixed", inset: 0, zIndex: 10 }} />}
      {showMenu && <div onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} style={{ position: "fixed", inset: 0, zIndex: 30 }} />}
      {showCommentReactions && <div onMouseDown={e => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setShowCommentReactions(null); }} style={{ position: "fixed", inset: 0, zIndex: 15 }} />}
    </div>
  );
}