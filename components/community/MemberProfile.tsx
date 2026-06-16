"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PostCard from "./PostCard";
import { IconStar, IconPen, IconSend } from "@/components/shared/Icons";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

interface MemberProfileProps {
  profile: any;
  timeline: any[];
  currentUserId: string;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  badges: any[];
  isOwnProfile: boolean;
}

export default function MemberProfile({
  profile, timeline, currentUserId, isFollowing: initialFollowing,
  followersCount: initFollowers, followingCount, badges, isOwnProfile,
}: MemberProfileProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const router = useRouter();
  const [followersCount, setFollowersCount] = useState(initFollowers);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"posts" | "reposts">("posts");

  const posts = timeline.filter(p => !p.repost_of);
  const reposts = timeline.filter(p => !!p.repost_of);
  const display = tab === "posts" ? posts : reposts;

  async function toggleFollow() {
    if (loading) return;
    setLoading(true);
    const method = isFollowing ? "DELETE" : "POST";
    await fetch(`/api/community/follow/${profile.id}`, { method });
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", maxWidth: "680px", margin: "0 auto" }}>
      <Link href={isOwnProfile ? "/members/account" : "/members/community/members"} style={{ fontFamily: R, fontSize: "11px", color: "#5A7A60", textDecoration: "none", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
        <svg width="6" height="10" viewBox="0 0 6 10"><path d="M5 1L1 5L5 9" stroke="#5A7A60" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
        {isOwnProfile ? "BACK TO ACCOUNT" : "BACK TO MEMBERS"}
      </Link>

      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "16px", marginBottom: "12px" }}>
        {/* Cover with avatar inside */}
        <div style={{ background: "linear-gradient(135deg,#1A8040 0%,#4A7C59 50%,#1A8040 100%)", borderRadius: "14px 14px 0 0", padding: "16px 20px 0", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(60,206,42,0.12) 1.5px,transparent 1.5px)", backgroundSize: "18px 18px" }} />
          <div style={{ height: "48px" }} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ width: "76px", height: "76px", borderRadius: "50%", background: "linear-gradient(135deg,#1A8040,#1A8040)", padding: "3px", border: "4px solid #FFFFFF" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontFamily: R, fontSize: "28px", color: "#1A8040" }}>{(profile.display_name ?? "M")[0].toUpperCase()}</span>
                }
              </div>
            </div>
            <div style={{ paddingBottom: "10px" }}>
              {!isOwnProfile ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={toggleFollow} disabled={loading} style={{ fontFamily: R, fontSize: "12px", letterSpacing: "1px", padding: "7px 20px", borderRadius: "20px", border: "2px solid rgba(255,255,255,0.5)", background: isFollowing ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.9)", color: isFollowing ? "#FFFFFF" : "#1A8040", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "..." : isFollowing ? "Following ✓" : "Follow +"}
                  </button>
                  <button onClick={async () => {
                    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_group: false, member_ids: [profile.id] }) });
                    const d = await res.json();
                    if (d.room?.id) router.push(`/members/messages/${d.room.id}`);
                  }} style={{ fontFamily: R, fontSize: "12px", letterSpacing: "1px", padding: "7px 20px", borderRadius: "20px", border: "2px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.15)", color: "#FFFFFF", cursor: "pointer" }}>
                    MESSAGE
                  </button>
                </div>
              ) : (
                <Link href="/members/account" style={{ fontFamily: R, fontSize: "12px", letterSpacing: "1px", padding: "7px 20px", borderRadius: "20px", border: "2px solid rgba(255,255,255,0.5)", color: "#FFFFFF", textDecoration: "none", display: "block", background: "rgba(255,255,255,0.15)" }}>
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: "14px 20px 20px" }}>
          <div style={{ fontFamily: R, fontSize: "20px", color: "#1B3A2D", letterSpacing: "1px", marginBottom: "4px" }}>{profile.display_name ?? "Member"}</div>
          {profile.bio && <div style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59", lineHeight: 1.6, marginBottom: "12px" }}>{profile.bio}</div>}
          <div style={{ display: "flex", gap: "24px", marginBottom: "12px" }}>
            {[{ label:"Posts", value:posts.length },{ label:"Reposts", value:reposts.length },{ label:"Followers", value:followersCount },{ label:"Following", value:followingCount }].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: R, fontSize: "17px", color: "#1B3A2D" }}>{s.value}</div>
                <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{s.label}</div>
              </div>
            ))}
          </div>
          {badges.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {badges.map((ub: any) => (
                <div key={ub.id} title={ub.badges?.description ?? ""} style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "3px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconStar size={12} color="#4A7C59" />
                  <span style={{ fontFamily: B, fontSize: "10px", color: "#4A7C59" }}>{ub.badges?.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderTop: "1px solid #DDE8DD" }}>
          {(["posts","reposts"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "12px", background: "none", border: "none", borderBottom: tab === t ? "2px solid #1A8040" : "2px solid transparent", cursor: "pointer", fontFamily: R, fontSize: "12px", color: tab === t ? "#1A8040" : "#5A7A60", letterSpacing: "1.5px" }}>
              {t.toUpperCase()} ({t === "posts" ? posts.length : reposts.length})
            </button>
          ))}
        </div>
      </div>

      {/* Posts/Reposts */}
      {display.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "16px", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ marginBottom: "10px" }}>{tab === "posts" ? <IconPen size={32} color="#DDE8DD" /> : <IconSend size={32} color="#DDE8DD" />}</div>
          <div style={{ fontFamily: R, fontSize: "13px", color: "#5A7A60", letterSpacing: "2px" }}>NO {tab.toUpperCase()} YET</div>
        </div>
      ) : (
        display.map((post: any) => (
          <PostCard key={`${post.id}-${post.repost_of ?? "post"}`} post={post} currentUserId={currentUserId} />
        ))
      )}
    </div>
  );
}
