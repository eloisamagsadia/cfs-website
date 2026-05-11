import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { BADGE_ICONS, BADGE_COLORS } from "@/lib/badges";
import type { Metadata } from "next";
export const metadata: Metadata = { title:"Badges" };
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";

export default async function BadgesPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const supabase = createAdminClient();
  const [{ data: allBadges }, { data: earned }] = await Promise.all([
    ((supabase.from("badges") as any) as any).select("*").order("threshold_value", { ascending: true }),
    (((supabase.from("user_badges") as any) as any) as any).select("*, badges(*)").eq("user_id", userId),
  ]);

  const earnedIds = new Set((earned ?? []).map((e:any) => e.badge_id));
  const earnedMap = (earned ?? []).reduce((acc:any, e:any) => { acc[e.badge_id] = e; return acc; }, {});

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
      <div>
        <h1 style={{ fontFamily:R, fontSize:"1.6rem", color:"#F0EAD6", letterSpacing:"3px", marginBottom:"4px" }}>BADGES</h1>
        <p style={{ fontFamily:B, fontSize:"13px", color:"#8AAA78" }}>{earnedIds.size} of {allBadges?.length ?? 0} badges earned</p>
      </div>

      <div style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
          <span style={{ fontFamily:R, fontSize:"12px", color:"#3CCE2A", letterSpacing:"2px" }}>COLLECTION PROGRESS</span>
          <span style={{ fontFamily:R, fontSize:"12px", color:"#F5C82A" }}>{earnedIds.size}/{allBadges?.length ?? 0}</span>
        </div>
        <div style={{ background:"#243520", border:"1.5px solid #2C4820", borderRadius:"20px", height:"12px", overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${((earnedIds.size / (allBadges?.length || 1)) * 100).toFixed(0)}%`, background:"#3CCE2A", borderRadius:"20px", transition:"width 0.5s ease" }}/>
        </div>
      </div>

      {earnedIds.size > 0 && (
        <div>
          <h2 style={{ fontFamily:R, fontSize:"13px", color:"#3CCE2A", letterSpacing:"2px", marginBottom:"12px" }}>EARNED ✦</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"10px" }}>
            {(allBadges ?? []).filter((b:any) => earnedIds.has(b.id)).map((badge:any) => {
              const color = BADGE_COLORS[badge.name] ?? "#3CCE2A";
              const icon = BADGE_ICONS[badge.name] ?? "⭐";
              const earnedData = earnedMap[badge.id];
              return (
                <div key={badge.id} style={{ position:"relative", padding:"4px 4px 6px 0" }}>
                  <div style={{ position:"absolute", bottom:0, right:0, width:"calc(100% - 4px)", height:"calc(100% - 4px)", borderRadius:"12px", background:color+"40" }}/>
                  <div style={{ position:"relative", background:`${color}20`, border:`2px solid ${color}`, borderRadius:"12px", padding:"18px 14px", textAlign:"center", zIndex:1 }}>
                    <div style={{ fontSize:"32px", marginBottom:"8px" }}>{icon}</div>
                    <div style={{ fontFamily:R, fontSize:"12px", color, letterSpacing:"1.5px", marginBottom:"4px" }}>{badge.name}</div>
                    <div style={{ fontFamily:B, fontSize:"11px", color:"#8AAA78", lineHeight:1.5, marginBottom:"8px" }}>{badge.description}</div>
                    <div style={{ fontFamily:B, fontSize:"10px", color:"#5A7A50" }}>
                      {new Date(earnedData?.earned_at).toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 style={{ fontFamily:R, fontSize:"13px", color:"#5A7A50", letterSpacing:"2px", marginBottom:"12px" }}>LOCKED 🔒</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"10px" }}>
          {(allBadges ?? []).filter((b:any) => !earnedIds.has(b.id)).map((badge:any) => {
            const icon = BADGE_ICONS[badge.name] ?? "⭐";
            return (
              <div key={badge.id} style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"18px 14px", textAlign:"center", opacity:0.6 }}>
                <div style={{ fontSize:"32px", marginBottom:"8px", filter:"grayscale(1)" }}>{icon}</div>
                <div style={{ fontFamily:R, fontSize:"12px", color:"#5A7A50", letterSpacing:"1.5px", marginBottom:"4px" }}>{badge.name}</div>
                <div style={{ fontFamily:B, fontSize:"11px", color:"#3A5030", lineHeight:1.5, marginBottom:"8px" }}>{badge.description}</div>
                {badge.threshold_value && (
                  <div style={{ fontFamily:R, fontSize:"10px", color:"#3A5030", letterSpacing:"1px" }}>
                    {badge.trigger_type === "donation_total" ? `₱${Number(badge.threshold_value).toLocaleString()} needed` : `${badge.threshold_value} needed`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}