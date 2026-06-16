import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Dashboard" };

const R = "var(--font-righteous,'Righteous',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default async function DashboardPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const supabase = createAdminClient();
  const { data: profileRaw } = await (((supabase.from("profiles") as any) as any) as any).select("*").eq("id", userId).single();
  const profile = profileRaw as any;

  const [
    { count: eventsCount },
    { count: ordersCount },
    { count: badgesCount },
    { count: notifCount },
  ] = await Promise.all([
    (((supabase.from("event_registrations") as any) as any) as any).select("*", { count:"exact", head:true }).eq("user_id", userId),
    (((supabase.from("orders") as any) as any) as any).select("*", { count:"exact", head:true }).eq("user_id", userId),
    (((supabase.from("user_badges") as any) as any) as any).select("*", { count:"exact", head:true }).eq("user_id", userId),
    (((supabase.from("notifications") as any) as any) as any).select("*", { count:"exact", head:true }).eq("user_id", userId).eq("is_read", false),
  ]);

  const stats = [
    { label:"MY EVENTS",     value: eventsCount ?? 0, color:"#3CCE2A", bg:"#FFFFFF", border:"#DDE8DD", href:"/members/events" },
    { label:"MY ORDERS",     value: ordersCount ?? 0, color:"#F07228", bg:"#FFFFFF", border:"#DDE8DD", href:"/members/orders" },
    { label:"BADGES EARNED", value: badgesCount ?? 0, color:"#F5C82A", bg:"#FFFFFF", border:"#DDE8DD", href:"/members/badges" },
    { label:"UNREAD NOTIFS", value: notifCount ?? 0,  color:"#F04060", bg:"#FFFFFF", border:"#DDE8DD", href:"/members/notifications" },
  ];

  const quickLinks = [
    { label:"BROWSE SHOP",     href:"/shop",               color:"#F07228" },
    { label:"UPCOMING EVENTS", href:"/events",             color:"#3CCE2A" },
    { label:"COMMUNITY FEED",  href:"/members/community",  color:"#F5C82A" },
    { label:"DONATE",          href:"/donate",             color:"#F04060" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"28px" }}>
      <div style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"24px 28px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(60,206,42,0.08) 1.5px,transparent 1.5px)", backgroundSize:"18px 18px" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontFamily:R, fontSize:"0.75rem", color:"#3CCE2A", letterSpacing:"3px", marginBottom:"6px" }}>WELCOME BACK</div>
          <h1 style={{ fontFamily:R, fontSize:"1.8rem", color:"#1B3A2D", letterSpacing:"2px", marginBottom:"6px" }}>
            {profile?.display_name ?? "Member"} ✦
          </h1>
          <p style={{ fontFamily:S, fontStyle:"italic", fontSize:"14px", color:"#4A7C59" }}>
            Member since {new Date(profile?.created_at ?? Date.now()).toLocaleDateString("en-PH", { month:"long", year:"numeric" })}
          </p>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:"10px" }}>
        {stats.map(({ label, value, color, bg, border, href }) => (
          <Link key={label} href={href} style={{ textDecoration:"none" }}>
            <div style={{ background:bg, border:`2px solid ${border}`, borderRadius:"12px", padding:"20px 16px" }}>
              <div style={{ fontFamily:R, fontSize:"2rem", color, letterSpacing:"1px", marginBottom:"4px" }}>{value}</div>
              <div style={{ fontFamily:B, fontSize:"11px", color:"#5A7A60", letterSpacing:"1px" }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <h2 style={{ fontFamily:R, fontSize:"1rem", color:"#1B3A2D", letterSpacing:"2px", marginBottom:"14px" }}>QUICK ACTIONS</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"10px" }}>
          {quickLinks.map(({ label, href, color }) => (
            <Link key={label} href={href} style={{ textDecoration:"none" }}>
              <div style={{ background:"#FFFFFF", border:`2px solid ${color}40`, borderRadius:"10px", padding:"14px", textAlign:"center" }}>
                <span style={{ fontFamily:R, fontSize:"12px", color, letterSpacing:"1.5px" }}>{label} →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}