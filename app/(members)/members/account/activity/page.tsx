"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const REACTION_EMOJI: Record<string, string> = {
  heart: "❤️", fire: "🔥", love_eyes: "😍", sad: "🥺",
  haha: "😂", clap: "👏", party: "🎉", sparkles: "✨",
};

export default function MyActivityPage() {
  const { user, isLoaded } = useUser();
  const [comments, setComments] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"comments" | "reactions">("comments");

  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      fetch("/api/community/my-activity?type=comments").then(r => r.json()),
      fetch("/api/community/my-activity?type=reactions").then(r => r.json()),
    ]).then(([c, r]) => {
      setComments(c.comments ?? []);
      setReactions(r.reactions ?? []);
      setLoading(false);
    });
  }, [isLoaded, user]);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage /></div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <a href="/members/account" style={{ fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "12px", color: "#5A7A50", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>← Account</a>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>MY ACTIVITY</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Your comments and reactions across the community.</p>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {(["comments", "reactions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ fontFamily: R, fontSize: "11px", padding: "6px 16px", borderRadius: "20px", border: `1.5px solid ${tab === t ? "#3CCE2A" : "#2C4820"}`, background: tab === t ? "#1A3D14" : "transparent", color: tab === t ? "#3CCE2A" : "#5A7A50", cursor: "pointer", letterSpacing: "1px" }}>
            {t.toUpperCase()} ({t === "comments" ? comments.length : reactions.length})
          </button>
        ))}
      </div>

      {tab === "comments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {comments.length === 0 && <div style={{ fontFamily: B, fontSize: "13px", color: "#3A5A30", padding: "20px", textAlign: "center" }}>No comments yet.</div>}
          {comments.map((c: any) => (
            <Link key={c.id} href={`/members/community/${c.post_id}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "#1A2614", border: "1.5px solid #2C4820", borderRadius: "10px", padding: "14px 16px" }} className="card-hover">
                <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", marginBottom: "6px", letterSpacing: "0.5px" }}>
                  {new Date(c.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })}
                </div>
                <div style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6", lineHeight: 1.6 }}>{c.content}</div>
                <div style={{ fontFamily: R, fontSize: "10px", color: "#3CCE2A", marginTop: "8px", letterSpacing: "1px" }}>VIEW POST →</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === "reactions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {reactions.length === 0 && <div style={{ fontFamily: B, fontSize: "13px", color: "#3A5A30", padding: "20px", textAlign: "center" }}>No reactions yet.</div>}
          {reactions.map((r: any) => (
            <Link key={r.id} href={`/members/community/${r.post_id}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "#1A2614", border: "1.5px solid #2C4820", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }} className="card-hover">
                <span style={{ fontSize: "24px" }}>{REACTION_EMOJI[r.reaction_type] ?? "❤️"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6" }}>Reacted to a post</div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", marginTop: "2px" }}>
                    {new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })}
                  </div>
                </div>
                <div style={{ fontFamily: R, fontSize: "10px", color: "#3CCE2A", letterSpacing: "1px" }}>VIEW →</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
