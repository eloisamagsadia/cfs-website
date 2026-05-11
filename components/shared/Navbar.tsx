import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import NotificationBell from "./NotificationBell";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const R = "var(--font-righteous,'Righteous',sans-serif)";

const navLinks = [
  { label:"EVENTS",   href:"/events" },
  { label:"SHOP",     href:"/shop" },
  { label:"PROJECTS", href:"/projects" },
  { label:"REPORTS",  href:"/reports" },
  { label:"DONATE",   href:"/donate" },
];

async function BellWithCount({ userId }: { userId: string }) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { count } = await supabase
    .from("notifications")
    .select("*", { count:"exact", head:true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return <NotificationBell initialCount={count ?? 0} userId={userId}/>;
}

export default async function Navbar() {
  const { userId } = auth();

  return (
    <header style={{ position:"sticky", top:0, zIndex:50, background:"#0F1A0B", borderBottom:"2px solid #2C4820" }}>
      <nav style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 28px", maxWidth:"1280px", margin:"0 auto" }}>
        <Link href="/" style={{ textDecoration:"none", position:"relative", display:"inline-block" }}>
          <span style={{ position:"absolute", top:"3px", left:"3px", width:"100%", height:"100%", background:"#080F06", borderRadius:"8px" }}/>
          <span style={{ position:"relative", display:"flex", alignItems:"center", gap:"6px", background:"#1A3D14", border:"2px solid #2C4820", borderRadius:"8px", padding:"5px 14px" }}>
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z" fill="#F5C82A"/></svg>
            <span style={{ fontFamily:R, fontSize:"18px", color:"#3CCE2A", letterSpacing:"3px" }}>CFS</span>
          </span>
        </Link>

        <div style={{ display:"flex", gap:"22px", alignItems:"center" }}>
          {navLinks.map(({ label, href }) => (
            <Link key={href} href={href} style={{ fontFamily:R, fontSize:"12px", color:"#8AAA78", letterSpacing:"2px", textDecoration:"none" }}>{label}</Link>
          ))}
        </div>

        <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
          {userId ? (
            <>
              <Suspense fallback={
                <div style={{ width:"34px", height:"34px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2C10 2 6 3.5 6 9V14L4 16H16L14 14V9C14 3.5 10 2 10 2Z" stroke="#5A7A50" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
                    <path d="M8 16C8 17.1 8.9 18 10 18C11.1 18 12 17.1 12 16" stroke="#5A7A50" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
              }>
                <BellWithCount userId={userId}/>
              </Suspense>
              <Link href="/members" style={{ textDecoration:"none", position:"relative", display:"inline-block" }}>
                <span style={{ position:"absolute", top:"3px", left:"3px", width:"100%", height:"100%", background:"#080F06", borderRadius:"6px" }}/>
                <span style={{ position:"relative", display:"block", fontFamily:R, fontSize:"11px", background:"#3CCE2A", color:"#080F06", padding:"6px 16px", border:"2px solid #080F06", borderRadius:"6px", letterSpacing:"2px" }}>DASHBOARD</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/sign-in" style={{ fontFamily:R, fontSize:"11px", color:"#8AAA78", letterSpacing:"2px", textDecoration:"none" }}>SIGN IN</Link>
              <Link href="/sign-up" style={{ textDecoration:"none", position:"relative", display:"inline-block" }}>
                <span style={{ position:"absolute", top:"3px", left:"3px", width:"100%", height:"100%", background:"#080F06", borderRadius:"6px" }}/>
                <span style={{ position:"relative", display:"block", fontFamily:R, fontSize:"11px", background:"#F5C82A", color:"#080F06", padding:"6px 16px", border:"2px solid #080F06", borderRadius:"6px", letterSpacing:"2px" }}>JOIN ✦</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}