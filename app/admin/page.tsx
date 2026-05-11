import { createClient as createAdminClient } from "@supabase/supabase-js";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title:"Admin Dashboard" };
const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";
const S="var(--font-dm-serif,'DM Serif Display',serif)";

export default async function AdminDashboard() {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const [
    { count: members },
    { count: orders },
    { count: events },
    { count: reports },
    { data: recentOrders },
    { data: recentMembers },
  ] = await Promise.all([
    supabase.from("profiles").select("*",{count:"exact",head:true}),
    supabase.from("orders").select("*",{count:"exact",head:true}).eq("payment_status","paid"),
    supabase.from("events").select("*",{count:"exact",head:true}).eq("status","upcoming"),
    supabase.from("transparency_reports").select("*",{count:"exact",head:true}),
    supabase.from("orders").select("id,total,payment_status,order_status,created_at").order("created_at",{ascending:false}).limit(5),
    supabase.from("profiles").select("id,display_name,created_at").order("created_at",{ascending:false}).limit(5),
  ]);

  const { data: revenue } = await supabase.from("orders").select("total").eq("payment_status","paid");
  const totalRevenue = (revenue ?? []).reduce((s:number,o:any)=>s+Number(o.total),0);

  const stats = [
    { label:"TOTAL MEMBERS",   value: members ?? 0,                       color:"#3CCE2A", bg:"#1A3D14", href:"/admin/members" },
    { label:"PAID ORDERS",     value: orders ?? 0,                        color:"#F07228", bg:"#3D1A0A", href:"/admin/orders" },
    { label:"UPCOMING EVENTS", value: events ?? 0,                        color:"#F5C82A", bg:"#3D3000", href:"/admin/events" },
    { label:"TOTAL REVENUE",   value:`₱${totalRevenue.toLocaleString()}`, color:"#8EE440", bg:"#1E3010", href:"/admin/orders" },
  ];

  const quickActions = [
    { label:"CREATE EVENT",    href:"/admin/events/create",  bg:"#3CCE2A", color:"#080F06" },
    { label:"ADD PRODUCT",     href:"/admin/shop/create",    bg:"#F07228", color:"#F0EAD6" },
    { label:"GENERATE CODE",   href:"/admin/codes",          bg:"#F5C82A", color:"#080F06" },
    { label:"UPLOAD REPORT",   href:"/admin/reports",        bg:"#8EE440", color:"#080F06" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
      <div>
        <div style={{ display:"inline-block", background:"#F07228", border:"2px solid #080F06", borderRadius:"6px", padding:"3px 12px", marginBottom:"8px" }}>
          <span style={{ fontFamily:R, fontSize:"10px", color:"#080F06", letterSpacing:"2px" }}>⚠ ADMIN ONLY</span>
        </div>
        <h1 style={{ fontFamily:R, fontSize:"1.8rem", color:"#F0EAD6", letterSpacing:"3px", marginBottom:"4px" }}>ADMIN DASHBOARD</h1>
        <p style={{ fontFamily:S, fontStyle:"italic", fontSize:"14px", color:"#8AAA78" }}>Overview of all CFS operations</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"10px" }}>
        {stats.map(({ label, value, color, bg, href }) => (
          <Link key={label} href={href} style={{ textDecoration:"none" }}>
            <div style={{ position:"relative", padding:"4px 4px 6px 0" }}>
              <div style={{ position:"absolute", bottom:0, right:0, width:"calc(100% - 4px)", height:"calc(100% - 4px)", borderRadius:"10px", background:"#080F06" }}/>
              <div style={{ position:"relative", background:bg, border:"2px solid #2C4820", borderRadius:"10px", padding:"18px 16px", zIndex:1 }}>
                <div style={{ fontFamily:R, fontSize:"1.8rem", color, letterSpacing:"1px", marginBottom:"4px" }}>{value}</div>
                <div style={{ fontFamily:B, fontSize:"11px", color:"#8AAA78", letterSpacing:"1px" }}>{label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 style={{ fontFamily:R, fontSize:"13px", color:"#F0EAD6", letterSpacing:"2px", marginBottom:"12px" }}>QUICK ACTIONS</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"10px" }}>
          {quickActions.map(({ label, href, bg, color }) => (
            <Link key={label} href={href} style={{ textDecoration:"none" }}>
              <div style={{ position:"relative", padding:"4px 4px 6px 0" }}>
                <div style={{ position:"absolute", bottom:0, right:0, width:"calc(100% - 4px)", height:"calc(100% - 4px)", borderRadius:"8px", background:"#080F06" }}/>
                <div style={{ position:"relative", background:bg, border:"2px solid #080F06", borderRadius:"8px", padding:"14px", textAlign:"center", zIndex:1 }}>
                  <span style={{ fontFamily:R, fontSize:"12px", color, letterSpacing:"1.5px" }}>{label} →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
        {/* Recent orders */}
        <div style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"18px" }}>
          <div style={{ fontFamily:R, fontSize:"13px", color:"#F07228", letterSpacing:"2px", marginBottom:"14px" }}>RECENT ORDERS</div>
          {(recentOrders ?? []).length === 0
            ? <p style={{ fontFamily:B, fontSize:"13px", color:"#5A7A50" }}>No orders yet</p>
            : (recentOrders ?? []).map((o:any) => (
              <div key={o.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #2C4820" }}>
                <span style={{ fontFamily:B, fontSize:"12px", color:"#8AAA78" }}>#{o.id.slice(0,8).toUpperCase()}</span>
                <span style={{ fontFamily:R, fontSize:"12px", color:"#F07228" }}>₱{Number(o.total).toLocaleString()}</span>
              </div>
            ))
          }
          <Link href="/admin/orders" style={{ fontFamily:R, fontSize:"11px", color:"#F07228", textDecoration:"none", letterSpacing:"1px", display:"block", marginTop:"12px" }}>VIEW ALL →</Link>
        </div>

        {/* Recent members */}
        <div style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"18px" }}>
          <div style={{ fontFamily:R, fontSize:"13px", color:"#3CCE2A", letterSpacing:"2px", marginBottom:"14px" }}>NEW MEMBERS</div>
          {(recentMembers ?? []).length === 0
            ? <p style={{ fontFamily:B, fontSize:"13px", color:"#5A7A50" }}>No members yet</p>
            : (recentMembers ?? []).map((m:any) => (
              <div key={m.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #2C4820" }}>
                <span style={{ fontFamily:B, fontSize:"12px", color:"#8AAA78" }}>{m.display_name ?? "Member"}</span>
                <span style={{ fontFamily:B, fontSize:"11px", color:"#5A7A50" }}>{new Date(m.created_at).toLocaleDateString("en-PH",{month:"short",day:"numeric"})}</span>
              </div>
            ))
          }
          <Link href="/admin/members" style={{ fontFamily:R, fontSize:"11px", color:"#3CCE2A", textDecoration:"none", letterSpacing:"1px", display:"block", marginTop:"12px" }}>VIEW ALL →</Link>
        </div>
      </div>
    </div>
  );
}
