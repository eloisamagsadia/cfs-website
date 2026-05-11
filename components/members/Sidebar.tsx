"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";

const navItems=[
  {label:"DASHBOARD",     href:"/members",                icon:"⚡"},
  {label:"COMMUNITY",     href:"/members/community",      icon:"💬"},
  {label:"MY EVENTS",     href:"/members/events",         icon:"🎫"},
  {label:"MY ORDERS",     href:"/members/orders",         icon:"🛍"},
  {label:"CART",          href:"/members/cart",           icon:"🛒"},
  {label:"NOTIFICATIONS", href:"/members/notifications",  icon:"🔔"},
  {label:"BADGES",        href:"/members/badges",         icon:"⭐"},
  {label:"CODES",         href:"/members/codes",          icon:"🎟"},
  {label:"ACCOUNT",       href:"/members/account",        icon:"👤"},
];

export default function MembersSidebar({isAdmin=false}:{isAdmin?:boolean}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return(
    <aside style={{width:"220px",flexShrink:0}}>
      <nav style={{position:"sticky",top:"90px",display:"flex",flexDirection:"column",gap:"4px"}}>
        {navItems.map(({label,href,icon})=>{
          const isActive=pathname===href||(href!=="/members"&&pathname.startsWith(href));
          return(
            <Link key={href} href={href} style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",borderRadius:"8px",textDecoration:"none",background:isActive?"#1A3D14":"transparent",border:isActive?"2px solid #3CCE2A":"2px solid transparent"}}>
              <span style={{fontSize:"14px"}}>{icon}</span>
              <span style={{fontFamily:R,fontSize:"11px",letterSpacing:"1.5px",color:isActive?"#3CCE2A":"#5A7A50"}}>{label}</span>
            </Link>
          );
        })}
        <div style={{borderTop:"1px solid #2C4820",marginTop:"8px",paddingTop:"8px",display:"flex",flexDirection:"column",gap:"4px"}}>
          {isAdmin&&(
            <Link href="/admin" style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",borderRadius:"8px",textDecoration:"none",background:"#3D1A0A",border:"2px solid #F07228"}}>
              <span style={{fontSize:"14px"}}>⚡</span>
              <span style={{fontFamily:R,fontSize:"11px",letterSpacing:"1.5px",color:"#F07228"}}>ADMIN PANEL</span>
            </Link>
          )}
          <button
            onClick={handleSignOut}
            style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",borderRadius:"8px",textDecoration:"none",background:"transparent",border:"none",cursor:"pointer",width:"100%"}}
          >
            <span style={{fontSize:"14px"}}>🚪</span>
            <span style={{fontFamily:R,fontSize:"11px",letterSpacing:"1.5px",color:"#5A7A50"}}>SIGN OUT</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}