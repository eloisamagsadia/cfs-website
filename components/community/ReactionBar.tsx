"use client";
import { useState } from "react";

const B = "var(--font-barlow,'Barlow',sans-serif)";

interface ReactionBarProps {
  postId: string;
  reactions: any[];
  currentUserId: string;
  commentCount?: number;
  repostCount?: number;
  isReposted?: boolean;
  onCommentClick?: () => void;
  onRepostClick?: () => void;
}

export default function ReactionBar({
  postId, reactions: initialReactions, currentUserId,
  commentCount = 0, repostCount = 0, isReposted = false,
  onCommentClick, onRepostClick,
}: ReactionBarProps) {
  const [reactions, setReactions] = useState(initialReactions ?? []);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const isLiked = reactions.some(r => r.user_id === currentUserId);
  const likeCount = reactions.length;

  async function handleLike() {
    if (loading) return;
    setLoading(true);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    // Optimistic
    if (isLiked) {
      setReactions(prev => prev.filter(r => r.user_id !== currentUserId));
    } else {
      setReactions(prev => [...prev, { user_id: currentUserId, reaction_type: "heart", post_id: postId }]);
    }

    await fetch(`/api/community/posts/${postId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction_type: "heart" }),
    });
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", paddingTop: "8px", borderTop: "1px solid #DDE8DD", marginTop: "8px" }}>

      {/* ── LIKE ── */}
      <button onClick={handleLike} style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
        <svg
          width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? "#3CCE2A" : "none"}
          style={{ transition: "all 0.2s", transform: animating ? "scale(1.3)" : "scale(1)" }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            stroke={isLiked ? "#3CCE2A" : "#5A7A60"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {likeCount > 0 && (
          <span style={{ fontFamily: B, fontSize: "13px", color: isLiked ? "#3CCE2A" : "#5A7A60", transition: "color 0.2s" }}>{likeCount}</span>
        )}
      </button>

      {/* ── COMMENT ── */}
      <button onClick={onCommentClick} style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
            stroke="#5A7A60" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {commentCount > 0 && <span style={{ fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>{commentCount}</span>}
      </button>

      {/* ── REPOST ── */}
      <button onClick={onRepostClick} style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
          <polyline points="17 1 21 5 17 9" stroke={isReposted ? "#3CCE2A" : "#5A7A60"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 11V9a4 4 0 014-4h14" stroke={isReposted ? "#3CCE2A" : "#5A7A60"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="7 23 3 19 7 15" stroke={isReposted ? "#3CCE2A" : "#5A7A60"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 13v2a4 4 0 01-4 4H3" stroke={isReposted ? "#3CCE2A" : "#5A7A60"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {repostCount > 0 && <span style={{ fontFamily: B, fontSize: "13px", color: isReposted ? "#3CCE2A" : "#5A7A60" }}>{repostCount}</span>}
      </button>

    </div>
  );
}
