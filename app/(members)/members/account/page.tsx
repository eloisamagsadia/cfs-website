import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Account" };
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";
const S="var(--font-dm-serif,'DM Serif Display',serif)";

export default async function AccountPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const [{ data: profile }, clerkUser] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    currentUser(),
  ]);

  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? "—";

  const sections = [
    { title:"PROFILE",   desc:"Avatar, display name, bio, social links", href:"/members/account/profile", color:"#3CCE2A", bg:"#1A3D14" },
    { title:"SETTINGS",  desc:"Notifications, privacy, 2FA",             href:"/members/account/settings", color:"#F5C82A", bg:"#3D3000" },
    { title:"MY EVENTS", desc:"Registered events & tickets",             href:"/members/events",           color:"#F07228", bg:"#3D1A0A" },
    { title:"MY ORDERS", desc:"Order history & tracking",                href:"/members/orders",           color:"#8EE440", bg:"#1E3010" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
      <div>
        <h1 style={{ fontFamily:R, fontSize:"1.6rem", color:"#F0EAD6", letterSpacing:"3px", marginBottom:"4px" }}>ACCOUNT</h1>
        <p style={{ fontFamily:S, fontStyle:"italic", fontSize:"14px", color:"#8AAA78" }}>Manage your CFS membership</p>
      </div>

      <div style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"24px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"20px" }}>
          <div style={{ width:"60px", height:"60px", borderRadius:"50%", background:profile?.avatar_url?"transparent":"#1A3D14", border:"2px solid #3CCE2A", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <span style={{ fontFamily:R, fontSize:"22px", color:"#3CCE2A" }}>{(profile?.display_name ?? "M")[0].toUpperCase()}</span>
            }
          </div>
          <div>
            <div style={{ fontFamily:R, fontSize:"1.1rem", color:"#F0EAD6", letterSpacing:"2px", marginBottom:"4px" }}>{profile?.display_name ?? "Member"}</div>
            <div style={{ fontFamily:B, fontSize:"13px", color:"#8AAA78" }}>{email}</div>
            <div style={{ display:"inline-block", background:"#1A3D14", border:"1px solid #2C4820", borderRadius:"20px", padding:"2px 10px", marginTop:"6px" }}>
              <span style={{ fontFamily:R, fontSize:"10px", color:"#3CCE2A", letterSpacing:"1.5px" }}>{(profile?.role ?? "member").toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop:"1px solid #2C4820", paddingTop:"16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {[
            { label:"Email", value: email },
            { label:"Member Since", value: new Date(profile?.created_at ?? Date.now()).toLocaleDateString("en-PH",{month:"long",day:"numeric",year:"numeric"}) },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily:B, fontSize:"11px", color:"#5A7A50", letterSpacing:"1px", marginBottom:"3px", textTransform:"uppercase" }}>{label}</div>
              <div style={{ fontFamily:B, fontSize:"13px", color:"#F0EAD6" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"10px" }}>
        {sections.map(({ title, desc, href, color, bg }) => (
          <Link key={title} href={href} style={{ textDecoration:"none" }}>
            <div style={{ position:"relative", padding:"4px 4px 6px 0" }}>
              <div style={{ position:"absolute", bottom:0, right:0, width:"calc(100% - 4px)", height:"calc(100% - 4px)", borderRadius:"10px", background:"#080F06" }}/>
              <div style={{ position:"relative", background:bg, border:"2px solid #2C4820", borderRadius:"10px", padding:"18px 16px", zIndex:1 }}>
                <div style={{ fontFamily:R, fontSize:"14px", color, letterSpacing:"2px", marginBottom:"6px" }}>{title}</div>
                <div style={{ fontFamily:B, fontSize:"12px", color:"#8AAA78", lineHeight:1.5 }}>{desc}</div>
                <div style={{ fontFamily:R, fontSize:"11px", color, marginTop:"10px", letterSpacing:"1px" }}>MANAGE →</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}