import Link from "next/link";
const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

export default function Footer() {
  return (
    <footer style={{ background:"#080F06", borderTop:"2px solid #2C4820" }}>
      <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"44px 28px 28px", display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:"36px" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"14px" }}>
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z" fill="#F5C82A"/></svg>
            <span style={{ fontFamily:R, fontSize:"22px", color:"#3CCE2A", letterSpacing:"3px" }}>CFS</span>
          </div>
          <p style={{ fontFamily:S, fontStyle:"italic", fontSize:"13px", color:"#5A7A50", lineHeight:1.9, marginBottom:"16px" }}>
            Colet Fan Suporta — the official home of the Bini Colet fansupport community.
          </p>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {["Twitter","Facebook","Instagram","TikTok"].map(s => (
              <a key={s} href="#" style={{ fontFamily:R, fontSize:"10px", color:"#3CCE2A", border:"1.5px solid #2C4820", borderRadius:"4px", padding:"4px 10px", textDecoration:"none", letterSpacing:"1px" }}>{s}</a>
            ))}
          </div>
        </div>
        {[
          { title:"EXPLORE", links:[{l:"Events",h:"/events"},{l:"Shop",h:"/shop"},{l:"Projects",h:"/projects"},{l:"Donate",h:"/donate"}] },
          { title:"MEMBERS", links:[{l:"Dashboard",h:"/members"},{l:"Community",h:"/members/community"},{l:"Badges",h:"/members/badges"},{l:"Register",h:"/register"}] },
          { title:"INFO",    links:[{l:"Reports",h:"/reports"},{l:"About CFS",h:"/#about"},{l:"Contact",h:"/#contact"},{l:"Privacy",h:"/privacy"}] },
        ].map(({ title, links }) => (
          <div key={title}>
            <h4 style={{ fontFamily:R, fontSize:"13px", color:"#3CCE2A", letterSpacing:"2px", marginBottom:"14px" }}>{title}</h4>
            <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:"10px" }}>
              {links.map(({ l, h }) => (
                <li key={l}><Link href={h} style={{ fontFamily:B, fontSize:"13px", color:"#5A7A50", textDecoration:"none" }}>{l}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop:"1px solid #1A2614", padding:"16px 28px", textAlign:"center" }}>
        <span style={{ fontFamily:R, fontSize:"11px", color:"#2C4820", letterSpacing:"2px" }}>
          © {new Date().getFullYear()} CFS BINI COLET ✦ MADE WITH ♥ BY VOLUNTEERS ✦ PHILIPPINES
        </span>
      </div>
    </footer>
  );
}