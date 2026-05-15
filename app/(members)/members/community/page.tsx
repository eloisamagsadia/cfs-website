import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import CommunityFeed from "@/components/community/CommunityFeed";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title:"Community" };

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
    (((supabase.from("profiles") as any) as any) as any).select("*").eq("id", userId).single(),
    (((supabase.from("community_posts") as any) as any) as any)
      .select("*, profiles:user_id(id,display_name,avatar_url,role), community_reactions(id,user_id,reaction_type), community_comments(id), community_reposts(id,user_id)")
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(20),
    createAdminClient().from("community_categories").select("*"),
    createAdminClient().from("community_posts").select("*", { count:"exact", head:true }).eq("is_hidden", false),
  ]);

  return (
    <div className="community-layout" style={{ display:"flex", gap:"24px" }}>

      {/* Main feed */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"20px" }}>
          <div>
            <h1 style={{ fontFamily:R, fontSize:"1.6rem", color:"#F0EAD6", letterSpacing:"3px", marginBottom:"4px" }}>COMMUNITY</h1>
            <p style={{ fontFamily:B, fontSize:"13px", color:"#8AAA78" }}>Share, connect, and celebrate with the fam</p>
          </div>
          <Link href="/members/community/members" style={{ fontFamily:R, fontSize:"11px", color:"#3CCE2A", textDecoration:"none", border:"1.5px solid #2C4820", borderRadius:"20px", padding:"6px 14px", letterSpacing:"1px" }}>
            👥 MEMBERS →
          </Link>
        </div>

        <CommunityFeed
          initialPosts={posts ?? []}
          categories={categories ?? []}
          currentUser={{ id: userId, ...profile }}
        />
      </div>

      {/* Right sidebar */}
      <div className="community-sidebar" style={{ width:"240px", flexShrink:0, display:"flex", flexDirection:"column", gap:"14px" }}>

        {/* Community stats */}
        <div style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"16px" }}>
          <div style={{ fontFamily:R, fontSize:"12px", color:"#3CCE2A", letterSpacing:"2px", marginBottom:"12px" }}>COMMUNITY STATS</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {[
              { label:"Total Posts", value: statsCount ?? 0 },
              { label:"Categories", value: categories?.length ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontFamily:B, fontSize:"12px", color:"#5A7A50" }}>{label}</span>
                <span style={{ fontFamily:R, fontSize:"14px", color:"#F0EAD6" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"16px" }}>
          <div style={{ fontFamily:R, fontSize:"12px", color:"#3CCE2A", letterSpacing:"2px", marginBottom:"12px" }}>CATEGORIES</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {(categories ?? []).map((cat: any) => (
              <div key={cat.id} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <div style={{ width:"8px", height:"8px", borderRadius:"50%", background: cat.color ?? "#3CCE2A" }}/>
                <span style={{ fontFamily:B, fontSize:"12px", color:"#8AAA78" }}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div style={{ background:"#1A3D14", border:"2px solid #2C4820", borderRadius:"12px", padding:"16px" }}>
          <div style={{ fontFamily:R, fontSize:"12px", color:"#3CCE2A", letterSpacing:"2px", marginBottom:"8px" }}>TIPS</div>
          <div style={{ fontFamily:B, fontSize:"12px", color:"#5A7A50", lineHeight:1.7 }}>
            Use <span style={{ color:"#3CCE2A" }}>@username</span> to mention a member.<br/>
            React with 👍 ❤️ 🙌 on posts you love.<br/>
            Be kind to fellow CFS members! ♥
          </div>
        </div>

      </div>
    </div>
  );
}