import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveUserId } from "@/lib/effective-user";
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
  const realId = auth().userId;
  if (!realId) redirect("/sign-in");
  const userId = getEffectiveUserId() ?? realId;

  const supabase = createAdminClient();
  const { data: profileRaw } = await (((supabase.from("profiles") as any) as any) as any).select("*").eq("id", userId).single();
  const profile = profileRaw as any;

  const [
    { count: eventsCount },
    { count: ordersCount },
    { count: badgesCount },
    { count: notifCount },
    { data: pendingTickets },
  ] = await Promise.all([
    (((supabase.from("event_registrations") as any) as any) as any).select("*", { count:"exact", head:true }).eq("user_id", userId),
    (((supabase.from("orders") as any) as any) as any).select("*", { count:"exact", head:true }).eq("user_id", userId),
    (((supabase.from("user_badges") as any) as any) as any).select("*", { count:"exact", head:true }).eq("user_id", userId),
    (((supabase.from("notifications") as any) as any) as any).select("*", { count:"exact", head:true }).eq("user_id", userId).eq("is_read", false),
    (((supabase.from("event_tickets") as any) as any) as any)
      .select("id, bundle_id, events:event_id(title)")
      .eq("user_id", userId)
      .eq("status", "pending_payment")
      .order("created_at", { ascending: false }),
  ]);

  // Group pending tickets by bundle so a Bundle of Four shows as one
  // payment obligation, not four. Pick the first ticket id to link to.
  const pendingByBundle = new Map<string, { ticket_id: string; event_title: string; size: number }>();
  for (const t of (pendingTickets ?? []) as any[]) {
    const key = t.bundle_id ?? t.id;
    if (pendingByBundle.has(key)) {
      pendingByBundle.get(key)!.size += 1;
    } else {
      pendingByBundle.set(key, {
        ticket_id: t.id,
        event_title: (t.events as any)?.title ?? "your event",
        size: 1,
      });
    }
  }
  const pendingList = Array.from(pendingByBundle.values());

  const stats = [
    { label:"MY EVENTS",     value: eventsCount ?? 0, color:"#1A8040", bg:"#FFFFFF", border:"#DDE8DD", href:"/members/events" },
    { label:"MY ORDERS",     value: ordersCount ?? 0, color:"#1A8040", bg:"#FFFFFF", border:"#DDE8DD", href:"/members/orders" },
    { label:"BADGES EARNED", value: badgesCount ?? 0, color:"#156530", bg:"#FFFFFF", border:"#DDE8DD", href:"/members/badges" },
    { label:"UNREAD NOTIFS", value: notifCount ?? 0,  color:"#CC3344", bg:"#FFFFFF", border:"#DDE8DD", href:"/members/notifications" },
  ];

  const quickLinks = [
    { label:"BROWSE SHOP",     href:"/shop",               color:"#1A8040" },
    { label:"UPCOMING EVENTS", href:"/events",             color:"#1A8040" },
    { label:"COMMUNITY FEED",  href:"/members/community",  color:"#156530" },
    { label:"DONATE",          href:"/donate",             color:"#CC3344" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"28px" }}>
      {pendingList.length > 0 && (
        <div style={{ background:"#FFF3D6", border:"1.5px solid #E5B547", borderLeft:"6px solid #B0731A", borderRadius:"10px", padding:"14px 18px", display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontFamily:R, fontSize:"11px", color:"#8A6212", letterSpacing:"2px", marginBottom:2 }}>⚠ AWAITING PAYMENT</div>
              <div style={{ fontFamily:B, fontSize:"13px", color:"#7A5A0F" }}>
                You have {pendingList.length === 1 ? "a ticket" : `${pendingList.length} tickets`} on hold. Complete payment to activate.
              </div>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {pendingList.slice(0, 3).map(p => (
              <Link key={p.ticket_id} href={`/members/tickets/${p.ticket_id}`}
                style={{ background:"#FFFFFF", border:"1px solid #F0D889", borderRadius:8, padding:"10px 12px", fontFamily:B, fontSize:12, color:"#1B3A2D", textDecoration:"none", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                <span>{p.event_title}{p.size > 1 ? ` — ${p.size} tickets` : ""}</span>
                <span style={{ fontFamily:R, fontSize:10, color:"#B0731A", letterSpacing:1.5 }}>COMPLETE →</span>
              </Link>
            ))}
            {pendingList.length > 3 && (
              <Link href="/members/tickets" style={{ fontFamily:B, fontSize:11, color:"#8A6212", textAlign:"center", textDecoration:"none" }}>
                + {pendingList.length - 3} more pending
              </Link>
            )}
          </div>
        </div>
      )}
      <div style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"24px 28px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(60,206,42,0.08) 1.5px,transparent 1.5px)", backgroundSize:"18px 18px" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontFamily:R, fontSize:"0.75rem", color:"#1A8040", letterSpacing:"3px", marginBottom:"6px" }}>WELCOME BACK</div>
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