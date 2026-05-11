"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const R="var(--font-righteous,'Righteous',sans-serif)";
const adminNav=[
  { label:"DASHBOARD",    href:"/admin",                    icon:"⚡" },
  { label:"EVENTS",       href:"/admin/events",             icon:"🎫" },
  { label:"SHOP",         href:"/admin/shop",               icon:"🛍" },
  { label:"ORDERS",       href:"/admin/orders",             icon:"📦" },
  { label:"MEMBERS",      href:"/admin/members",            icon:"👥" },
  { label:"COMMUNITY",    href:"/admin/community",          icon:"💬" },
  { label:"NOTIFICATIONS",href:"/admin/notifications",      icon:"📣" },
  { label:"PROJECTS",     href:"/admin/projects",           icon:"📁" },
  { label:"REPORTS",      href:"/admin/reports",            icon:"📋" },
  { label:"PROMO CODES",  href:"/admin/codes",              icon:"🎟" },
  { label:"MEDIA",        href:"/admin/media",              icon:"🖼" },
];
export default function AdminSidebar() {
  const pathname=usePathname();
  return(
    <aside style={{width:"220px",flexShrink:0}}>
      <div style={{background:"#F07228",border:"2px solid #080F06",borderRadius:"8px",padding:"8px 14px",marginBottom:"16px",textAlign:"center"}}>
        <span style={{fontFamily:R,fontSize:"11px",color:"#080F06",letterSpacing:"2px"}}>⚠ ADMIN PANEL</span>
      </div>
      <nav style={{position:"sticky",top:"90px",display:"flex",flexDirection:"column",gap:"4px"}}>
        {adminNav.map(({label,href,icon})=>{
          const isActive=pathname===href||(href!=="/admin"&&pathname.startsWith(href));
          return(
            <Link key={href} href={href} style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",borderRadius:"8px",textDecoration:"none",background:isActive?"#3D1A0A":"transparent",border:isActive?"2px solid #F07228":"2px solid transparent"}}>
              <span style={{fontSize:"14px"}}>{icon}</span>
              <span style={{fontFamily:R,fontSize:"11px",letterSpacing:"1.5px",color:isActive?"#F07228":"#5A7A50"}}>{label}</span>
            </Link>
          );
        })}
        <div style={{borderTop:"1px solid #2C4820",marginTop:"8px",paddingTop:"8px"}}>
          <Link href="/members" style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",borderRadius:"8px",textDecoration:"none"}}>
            <span style={{fontSize:"14px"}}>🚪</span>
            <span style={{fontFamily:R,fontSize:"11px",letterSpacing:"1.5px",color:"#5A7A50"}}>EXIT ADMIN</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
