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
