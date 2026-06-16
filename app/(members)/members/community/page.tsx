import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import CommunityFeed from "@/components/community/CommunityFeed";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Community" };

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default async function CommunityPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const supabase = createAdminClient();

  const [
    { data: profile },
    { data: posts },
    { data: categories },
    { count: statsCount },
    { data: recentLetters },
  ] = await Promise.all([
    supabase.from("profiles" as any).select("*").eq("id", userId).single(),
    supabase
      .from("community_posts" as any)
      .select("*, profiles:user_id(id,display_name,avatar_url,role), community_reactions(id,user_id,reaction_type), community_comments(id), community_reposts(id,user_id)")
      .eq("is_hidden", false)
      .order("is_pinned", { ascending: false }).order("created_at", { ascending: false })
      .limit(20),
    createAdminClient().from("community_categories" as any).select("*"),
    createAdminClient().from("community_posts" as any).select("*", { count: "exact", head: true }).eq("is_hidden", false),
    createAdminClient().from("fan_letters" as any).select("id,title,content,created_at,profiles:user_id(display_name,avatar_url)").eq("is_approved", true).order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="community-layout">
      <div className="community-main">
        <div className="community-header">
          <div>
            <h1 style={{ fontFamily: R, fontSize: "2rem", color: "#1B3A2D", letterSpacing: "4px", marginBottom: "4px", lineHeight: 1 }}>COMMUNITY</h1>
            <p style={{ fontFamily: B, fontSize: "13px", color: "#5A7A60", marginTop: "6px" }}>Share, connect, and celebrate with the fam</p>
          </div>
          <Link href="/members/community/members" className="community-members-btn">
            <span style={{ fontSize: "16px" }}>👥</span>
            <span>MEMBERS</span>
            <span style={{ fontSize: "12px", opacity: 0.7 }}>→</span>
          </Link>
        </div>
        <CommunityFeed initialPosts={posts ?? []} categories={categories ?? []} currentUser={{ id: userId, ...profile }} />
      </div>

      <div className="community-sidebar">
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "14px", padding: "18px" }}>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#1A8040", letterSpacing: "2px", marginBottom: "14px" }}>COMMUNITY STATS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[{ label: "Total Posts", value: statsCount ?? 0 }, { label: "Categories", value: categories?.length ?? 0 }].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>{label}</span>
                <span style={{ fontFamily: R, fontSize: "16px", color: "#1B3A2D" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "14px", padding: "18px" }}>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#1A8040", letterSpacing: "2px", marginBottom: "14px" }}>CATEGORIES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(categories ?? []).map((cat: any) => (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: cat.color ?? "#1A8040", flexShrink: 0 }} />
                <span style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59" }}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Letters for Colet bulletin */}
        <div style={{ background: "linear-gradient(160deg, #F2F7F2, #FFFFFF)", border: "2px solid #DDE8DD", borderRadius: "14px", padding: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontFamily: R, fontSize: "11px", color: "#1A8040", letterSpacing: "2px" }}>💌 LETTERS FOR COLET</div>
            <Link href="/members/letters" style={{ fontFamily: R, fontSize: "9px", color: "#5A7A60", textDecoration: "none", letterSpacing: "1px" }}>SEE ALL →</Link>
          </div>
          {(recentLetters ?? []).length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginBottom: "10px" }}>No letters yet — be the first!</div>
              <Link href="/members/letters" style={{ fontFamily: R, fontSize: "10px", color: "#1A8040", textDecoration: "none", letterSpacing: "1px", background: "#E8F4EC", borderRadius: "6px", padding: "6px 12px" }}>WRITE A LETTER →</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(recentLetters as any[]).map((letter: any) => (
                <Link key={letter.id} href="/members/letters" style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px", borderRadius: "10px", background: "#FFFFFF", border: "1.5px solid #DDE8DD", transition: "border-color 0.15s", cursor: "pointer" }}
                    onMouseEnter={(e: any) => (e.currentTarget.style.borderColor = "#1A8040")}
                    onMouseLeave={(e: any) => (e.currentTarget.style.borderColor = "#DDE8DD")}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#E8F0E4", border: "1.5px solid #DDE8DD", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {letter.profiles?.avatar_url
                        ? <img src={letter.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontFamily: R, fontSize: "11px", color: "#1A8040" }}>{(letter.profiles?.display_name ?? "M")[0].toUpperCase()}</span>}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: R, fontSize: "11px", color: "#1B3A2D", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{letter.title}</div>
                      <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{letter.content}</div>
                    </div>
                  </div>
                </Link>
              ))}
              <Link href="/members/letters" style={{ fontFamily: R, fontSize: "10px", color: "#1A8040", textDecoration: "none", letterSpacing: "1px", textAlign: "center", display: "block", paddingTop: "4px" }}>✍️ WRITE YOUR LETTER</Link>
            </div>
          )}
        </div>

        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "14px", padding: "18px" }}>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#1A8040", letterSpacing: "2px", marginBottom: "10px" }}>TIPS</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", lineHeight: 1.8 }}>
            Use <span style={{ color: "#1A8040" }}>@username</span> to mention a member.<br />
            React with 👍 ❤️ 🙌 on posts you love.<br />
            Be kind to fellow CFS members! ♥
          </div>
        </div>
      </div>
    </div>
  );
}
