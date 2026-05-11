import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Home" };

const R = "var(--font-righteous,'Righteous',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

/* ─── Global CSS injected once at the top of the page ─── */
const PAGE_STYLES = `
  /* ── Animations ── */
  @keyframes cfs-scroll    { to { transform: translateX(-50%) } }
  @keyframes cfs-float-a   { 0%,100%{transform:translateY(0)    rotate(6deg)}  50%{transform:translateY(-13px) rotate(8.5deg)}  }
  @keyframes cfs-float-b   { 0%,100%{transform:translateY(0)    rotate(12deg)} 50%{transform:translateY(-10px) rotate(14.5deg)} }
  @keyframes cfs-float-c   { 0%,100%{transform:translateY(0)    rotate(-10deg)}55%{transform:translateY(-15px) rotate(-12deg)}  }
  @keyframes cfs-float-d   { 0%,100%{transform:translateY(0)    rotate(-4deg)} 60%{transform:translateY(-9px)  rotate(-6deg)}   }
  @keyframes cfs-glow      { 0%,100%{text-shadow:0 0 40px rgba(60,206,42,.25),0 4px 20px rgba(0,0,0,.8)} 50%{text-shadow:0 0 90px rgba(60,206,42,.65),0 0 40px rgba(60,206,42,.3),0 4px 20px rgba(0,0,0,.8)} }
  @keyframes cfs-blink     { 0%,100%{opacity:1} 50%{opacity:.25} }
  @keyframes cfs-fade-up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cfs-twinkle   { 0%,100%{opacity:1;transform:scale(1)}   50%{opacity:.45;transform:scale(.75)} }
  @keyframes cfs-music     { 0%,100%{transform:translateY(0) rotate(-15deg)} 50%{transform:translateY(-8px) rotate(-12deg)} }
  @keyframes cfs-arc-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  /* ── RetroBtn ── */
  .cfs-retro-btn { text-decoration:none; position:relative; display:inline-block; }
  .cfs-btn-shadow { position:absolute; top:3px; left:3px; width:100%; height:100%; background:#080F06; border-radius:6px; transition:top .12s ease, left .12s ease; }
  .cfs-btn-face   { position:relative; display:block; border-radius:6px; transition:transform .12s ease; }
  .cfs-retro-btn:hover .cfs-btn-shadow { top:5px; left:5px; }
  .cfs-retro-btn:hover .cfs-btn-face   { transform:translate(-2px,-2px); }
  .cfs-retro-btn:active .cfs-btn-shadow { top:1px; left:1px; }
  .cfs-retro-btn:active .cfs-btn-face  { transform:translate(0,0); }

  /* ── Feature cards ── */
  .cfs-feat-wrap  { position:relative; padding:4px 4px 6px 0; transition:transform .18s ease; }
  .cfs-feat-wrap:hover { transform:translateY(-5px); }
  .cfs-feat-inner { position:relative; border-radius:10px; padding:22px 14px 20px; text-align:center; z-index:1; border:2px solid #3A5C2C; transition:border-color .18s ease; }
  .cfs-feat-wrap:hover .cfs-feat-inner { border-color:rgba(255,255,255,.22); }

  /* ── Tag pills ── */
  .cfs-tag { transition:background .15s ease, color .15s ease; cursor:default; }
  .cfs-tag:hover { background:rgba(60,206,42,.12) !important; color:#8EE440 !important; }

  /* ── Section ornament line ── */
  .cfs-orn { display:flex; align-items:center; gap:10px; justify-content:center; margin-bottom:10px; }
  .cfs-orn-line { flex:1; max-width:60px; height:1px; background:linear-gradient(90deg,transparent,#2C4820); }
  .cfs-orn-line.r  { background:linear-gradient(90deg,#2C4820,transparent); }
`;

const CARD_BG = "#1C2E14";

const features = [
  { title:"EVENTS",    desc:"Fan meets & exclusive shows",  shadow:"rgba(60,206,42,.3)",   accent:"#3CCE2A", href:"/events"           },
  { title:"SHOP",      desc:"Official CFS merch",           shadow:"rgba(240,114,40,.3)",  accent:"#F07228", href:"/shop"             },
  { title:"COMMUNITY", desc:"Connect with the fam",         shadow:"rgba(245,200,42,.3)",  accent:"#F5C82A", href:"/members/community"},
  { title:"PROJECTS",  desc:"What we're building",          shadow:"rgba(142,228,64,.3)",  accent:"#8EE440", href:"/projects"         },
  { title:"DONATE",    desc:"Support CFS projects",         shadow:"rgba(240,64,96,.3)",   accent:"#F04060", href:"/donate"           },
  { title:"REPORTS",   desc:"Full transparency",            shadow:"rgba(60,206,42,.3)",   accent:"#3CCE2A", href:"/reports"          },
];

const ticker = ["✦ COLET FAN SUPORTA","♪ MUSIC IS LOVE","🚌 SAKAY NA!","★ P-POP FOREVER","♫ KUMANTA TAYO","✦ FANSUPPORT PH"];

/* ─── Components ─── */

function FeatIcon({ title, color }: { title: string; color: string }) {
  const s = { stroke:color, fill:"none", strokeWidth:"1.5", strokeLinecap:"round" as const, strokeLinejoin:"round" as const };
  const icons: Record<string, React.ReactNode> = {
    EVENTS: <>
      <rect x="2" y="3" width="16" height="15" rx="2" {...s}/>
      <path d="M2 8h16M7 1v4M13 1v4" {...s}/>
      <circle cx="6.5"  cy="12.5" r=".8" fill={color}/>
      <circle cx="10"   cy="12.5" r=".8" fill={color}/>
      <circle cx="13.5" cy="12.5" r=".8" fill={color}/>
    </>,
    SHOP: <>
      <path d="M3.5 5h13l-1.5 11H5L3.5 5z" {...s}/>
      <path d="M7.5 5V3.5a2.5 2.5 0 015 0V5" {...s}/>
    </>,
    COMMUNITY: <>
      <circle cx="8" cy="6" r="3" {...s}/>
      <path d="M1.5 18c0-3.5 2.8-5.5 6.5-5.5s6.5 2 6.5 5.5" {...s}/>
      <path d="M14 7a2.5 2.5 0 010 5M16.5 18c0-2.8-1.5-4.5-3.5-5" {...s}/>
    </>,
    PROJECTS: <>
      <circle cx="10" cy="10" r="3" {...s}/>
      <path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3M4.4 4.4l2.1 2.1M13.5 13.5l2.1 2.1M4.4 15.6l2.1-2.1M13.5 6.5l2.1-2.1" {...s}/>
    </>,
    DONATE: <>
      <path d="M10 17S1.5 11.5 1.5 6a4.5 4.5 0 019-1 4.5 4.5 0 019 1c0 5.5-8.5 11-8.5 11z" {...s}/>
    </>,
    REPORTS: <>
      <path d="M2 18h16" {...s}/>
      <rect x="2.5"  y="11" width="4" height="7" rx="1" {...s}/>
      <rect x="8"    y="6"  width="4" height="12" rx="1" {...s}/>
      <rect x="13.5" y="2"  width="4" height="16" rx="1" {...s}/>
    </>,
  };
  return (
    <svg width="32" height="32" viewBox="0 0 20 20" style={{ display:"block", margin:"0 auto 10px", filter:`drop-shadow(0 0 5px ${color}55)` }}>
      {icons[title] ?? null}
    </svg>
  );
}

function RetroBtn({ href, bg, color, children }: { href:string; bg:string; color:string; children:React.ReactNode }) {
  return (
    <Link href={href} className="cfs-retro-btn">
      <span className="cfs-btn-shadow"/>
      <span className="cfs-btn-face" style={{ fontFamily:R, fontSize:"13px", background:bg, color, padding:"9px 24px", border:"2px solid #080F06", letterSpacing:"2px" }}>
        {children}
      </span>
    </Link>
  );
}

function SectionOrnament({ label }: { label:string }) {
  return (
    <div className="cfs-orn">
      <div className="cfs-orn-line"/>
      <span style={{ fontFamily:B, fontSize:"9px", color:"#3CCE2A", letterSpacing:"3px", textTransform:"uppercase" }}>{label}</span>
      <div className="cfs-orn-line r"/>
    </div>
  );
}

/* ─── Page ─── */

export default function HomePage() {
  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"#0F1A0B" }}>
      <style>{PAGE_STYLES}</style>

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section style={{ position:"relative", overflow:"hidden", minHeight:"540px", display:"flex", flexDirection:"column", justifyContent:"center", borderBottom:"2px solid #2C4820", background:"#050D04" }}>

        {/* Deep radial background */}
        <div style={{ position:"absolute", inset:0, zIndex:0, background:"radial-gradient(ellipse 80% 60% at 20% 40%,rgba(0,80,20,.55) 0%,transparent 70%),radial-gradient(ellipse 60% 50% at 75% 30%,rgba(0,120,40,.4) 0%,transparent 65%),linear-gradient(180deg,#020A02 0%,#061206 30%,#0A1A08 60%,#061006 100%)" }}/>

        {/* Layered wave blobs */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:0, opacity:.18, pointerEvents:"none" }} viewBox="0 0 1200 540" preserveAspectRatio="xMidYMid slice">
          <defs><filter id="hblur"><feGaussianBlur stdDeviation="8"/></filter></defs>
          <path d="M0 180 Q200 120 400 200 Q600 280 800 160 Q1000 60  1200 140" stroke="#3CCE2A" strokeWidth="40" fill="none" filter="url(#hblur)" opacity=".6"/>
          <path d="M0 240 Q300 160 500 240 Q700 320 900 200 Q1100 100 1200 180" stroke="#8EE440" strokeWidth="24" fill="none" filter="url(#hblur)" opacity=".4"/>
          <path d="M0 360 Q250 290 480 360 Q680 420 880 310 Q1060 220 1200 280" stroke="#3CCE2A" strokeWidth="14" fill="none" filter="url(#hblur)" opacity=".22"/>
        </svg>

        {/* Dot grid */}
        <div style={{ position:"absolute", inset:0, zIndex:1, backgroundImage:"radial-gradient(circle,rgba(60,206,42,.12) 1.5px,transparent 1.5px)", backgroundSize:"22px 22px" }}/>
        {/* Scanlines */}
        <div style={{ position:"absolute", inset:0, zIndex:1, backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.07) 3px,rgba(0,0,0,.07) 4px)", pointerEvents:"none" }}/>
        {/* Bottom vignette */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"80px", background:"linear-gradient(to bottom,transparent,rgba(5,13,4,.7))", zIndex:1, pointerEvents:"none" }}/>

        {/* Twinkling star decorations */}
        <svg style={{ position:"absolute", top:"18px", left:"28px", zIndex:2, pointerEvents:"none", animation:"cfs-twinkle 2.4s ease-in-out infinite" }} width="28" height="28" viewBox="0 0 20 20">
          <path d="M10 0L12 8.5L20 10L12 11.5L10 20L8 11.5L0 10L8 8.5Z" fill="#F5C82A" stroke="#080F06" strokeWidth="1.2"/>
        </svg>
        <svg style={{ position:"absolute", top:"24px", right:"60px", zIndex:2, pointerEvents:"none", animation:"cfs-twinkle 1.8s ease-in-out infinite .6s" }} width="22" height="22" viewBox="0 0 20 20">
          <path d="M10 0L12 8.5L20 10L12 11.5L10 20L8 11.5L0 10L8 8.5Z" fill="#F07228" stroke="#080F06" strokeWidth="1.2"/>
        </svg>
        <svg style={{ position:"absolute", top:"80px", left:"52px", zIndex:2, pointerEvents:"none", animation:"cfs-twinkle 3s ease-in-out infinite 1.2s" }} width="28" height="26" viewBox="0 0 16 15">
          <path d="M8 13.5C8 13.5 1 8.5 1 4.5C1 2.3 2.8 0.5 5 0.5C6.2 0.5 7.1 1.1 8 2.2C8.9 1.1 9.8 0.5 11 0.5C13.2 0.5 15 2.3 15 4.5C15 8.5 8 13.5 8 13.5Z" fill="#F04060" stroke="#080F06" strokeWidth="1"/>
        </svg>
        <svg style={{ position:"absolute", bottom:"100px", right:"22px", zIndex:2, pointerEvents:"none", animation:"cfs-twinkle 2.8s ease-in-out infinite .9s" }} width="16" height="16" viewBox="0 0 20 20">
          <path d="M10 0L12 8.5L20 10L12 11.5L10 20L8 11.5L0 10L8 8.5Z" fill="#8EE440" stroke="#080F06" strokeWidth="1.2"/>
        </svg>
        {/* Floating music note */}
        <svg style={{ position:"absolute", top:"20px", right:"160px", zIndex:2, opacity:.9, pointerEvents:"none", animation:"cfs-music 5s ease-in-out infinite" }} width="40" height="36" viewBox="0 0 36 32" fill="#F5C82A">
          <ellipse cx="7"  cy="26" rx="6.5" ry="4.5" transform="rotate(-15 7 26)"/>
          <ellipse cx="24" cy="21" rx="6.5" ry="4.5" transform="rotate(-15 24 21)"/>
          <line x1="12.5" y1="23" x2="12.5" y2="7"  stroke="#F5C82A" strokeWidth="2"/>
          <line x1="29.5" y1="18" x2="29.5" y2="2"  stroke="#F5C82A" strokeWidth="2"/>
          <line x1="12.5" y1="7"  x2="29.5" y2="2"  stroke="#F5C82A" strokeWidth="2"/>
        </svg>

        {/* Floating stickers */}
        <img src="https://media.coletfs.com/stickers/palangga-2.png" alt="" style={{ position:"absolute", top:"10px",    left:"20px",   width:"200px", zIndex:2, animation:"cfs-float-d 6.5s ease-in-out infinite 1.5s", pointerEvents:"none", filter:"drop-shadow(0 4px 16px rgba(0,0,0,.5))" }}/>
        <img src="https://media.coletfs.com/stickers/coco6.png"      alt="" style={{ position:"absolute", bottom:"10px", right:"30px",  width:"180px", zIndex:2, animation:"cfs-float-a 5s   ease-in-out infinite",      pointerEvents:"none", filter:"drop-shadow(0 4px 12px rgba(0,0,0,.6))" }}/>
        <img src="https://media.coletfs.com/stickers/cinta.png"      alt="" style={{ position:"absolute", top:"16px",    right:"200px", width:"130px", zIndex:2, animation:"cfs-float-b 6s   ease-in-out infinite 1s",   pointerEvents:"none", filter:"drop-shadow(0 4px 12px rgba(0,0,0,.6))" }}/>
        <img src="https://media.coletfs.com/stickers/hirang.png"     alt="" style={{ position:"absolute", bottom:"20px", left:"60px",   width:"150px", zIndex:2, animation:"cfs-float-c 7s   ease-in-out infinite .5s",  pointerEvents:"none", filter:"drop-shadow(0 4px 12px rgba(0,0,0,.6))" }}/>
        {/* Content */}
        
        <div style={{ position:"relative", zIndex:3, textAlign:"center", padding:"44px 24px" }}>
          {/* Badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(26,61,20,.85)", border:"2px solid rgba(60,206,42,.25)", borderRadius:"20px", padding:"5px 16px", marginBottom:"16px", animation:"cfs-fade-up .55s ease both" }}>
            <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#3CCE2A", display:"inline-block", flexShrink:0, animation:"cfs-blink 1.8s ease-in-out infinite" }}/>
            <span style={{ fontFamily:B, fontSize:"10px", color:"#3CCE2A", letterSpacing:"3px", textTransform:"uppercase" }}>Official Fansupport · PH</span>
          </div>

          <div style={{ animation:"cfs-fade-up .6s ease .15s both", marginBottom:"16px" }}>
            <img
              src="/Colet_Fan_Suporta_Logo.png"
              alt="Colet Fan Suporta"
style={{
    width: "clamp(280px,60vw,520px)",
    display: "block",
    margin: "0 auto",
    mixBlendMode: "screen",
    filter: "drop-shadow(0 0 30px rgba(255,100,180,.35))"
  }}            />
          </div>

          <p style={{ fontFamily:S, fontStyle:"italic", fontSize:"15px", color:"#8AAA78", lineHeight:1.8, maxWidth:"380px", margin:"0 auto 28px", animation:"cfs-fade-up .6s ease .3s both" }}>
            The official home of the Colet fansupport community
          </p>

          <div style={{ display:"flex", gap:"14px", justifyContent:"center", flexWrap:"wrap", animation:"cfs-fade-up .6s ease .4s both" }}>
            <RetroBtn href="/register" bg="#3CCE2A" color="#080F06">JOIN THE FAM ✦</RetroBtn>
            <RetroBtn href="/donate"   bg="#F07228" color="#F0EAD6">DONATE ♥</RetroBtn>
          </div>

          <p style={{ fontFamily:B, fontSize:"11px", color:"#3A5A2C", letterSpacing:"2px", marginTop:"20px", animation:"cfs-fade-up .6s ease .5s both" }}>
            ♪ SAKAY NA · BINI · P-POP · COLET
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          TICKER
      ════════════════════════════════════════════ */}
      <div style={{ background:"#F5C82A", borderTop:"2px solid #080F06", borderBottom:"2px solid #080F06", padding:"9px 0", overflow:"hidden", whiteSpace:"nowrap" }}>
        <div style={{ display:"inline-block", animation:"cfs-scroll 18s linear infinite", fontFamily:R, letterSpacing:".1em" }}>
          {[...ticker,...ticker].map((t,i) => (
            <span key={i} style={{ fontSize:"12px", color:"#080F06", padding:"0 28px", letterSpacing:"2.5px" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          FEATURES GRID
      ════════════════════════════════════════════ */}
      <section style={{ background:"#0F1A0B", padding:"64px 24px" }}>
        <div style={{ maxWidth:"1280px", margin:"0 auto" }}>

          <SectionOrnament label="What we offer"/>
          <h2 style={{ fontFamily:R, fontSize:"clamp(1.6rem,3vw,2rem)", color:"#F0EAD6", textAlign:"center", letterSpacing:"3px", marginBottom:"10px" }}>
            EVERYTHING IN ONE PLACE
          </h2>
          <p style={{ fontFamily:S, fontStyle:"italic", fontSize:"14px", color:"#4A6B3A", textAlign:"center", marginBottom:"36px" }}>
            One home for all things Colet Fan Suporta
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))", gap:"14px" }}>
            {features.map(({ title, desc, shadow, accent, href }) => (
              <Link key={title} href={href} style={{ textDecoration:"none" }}>
                <div className="cfs-feat-wrap">
                  <div style={{ position:"absolute", bottom:0, right:0, width:"calc(100% - 4px)", height:"calc(100% - 4px)", borderRadius:"10px", background:shadow, filter:"blur(8px)" }}/>
                  <div className="cfs-feat-inner" style={{ background:CARD_BG }}>
                    <FeatIcon title={title} color={accent}/>
                    <div style={{ width:"24px", height:"2px", background:accent, borderRadius:"2px", margin:"0 auto 10px", opacity:.6 }}/>
                    <div style={{ fontFamily:R, fontSize:"14px", color:accent, marginBottom:"6px", letterSpacing:"2px" }}>{title}</div>
                    <div style={{ fontFamily:B, fontSize:"12px", color:"#6A8A5A", lineHeight:1.5 }}>{desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          BIO SECTION — Editorial two-column redesign
      ════════════════════════════════════════════ */}
      <section style={{ background:"#111C0D", borderTop:"2px solid #2C4820", borderBottom:"2px solid #2C4820", padding:"72px 24px", position:"relative", overflow:"hidden" }}>

        {/* Giant watermark symbol */}
        <div style={{ position:"absolute", right:"-40px", top:"50%", transform:"translateY(-50%)", fontFamily:R, fontSize:"clamp(180px,22vw,260px)", color:"rgba(60,206,42,.04)", lineHeight:1, pointerEvents:"none", userSelect:"none", letterSpacing:"-10px" }}>♪</div>

        {/* Top-left accent bar */}
        <div style={{ position:"absolute", top:0, left:0, width:"4px", height:"100%", background:"linear-gradient(to bottom,transparent,#3CCE2A 30%,#3CCE2A 70%,transparent)" }}/>

        <div style={{ maxWidth:"900px", margin:"0 auto", display:"grid", gridTemplateColumns:"1fr", gap:"40px" }}>

          {/* Header block */}
          <div>
            <SectionOrnament label="About Colet"/>
            <h2 style={{ fontFamily:R, fontSize:"clamp(1.8rem,4vw,2.4rem)", color:"#F0EAD6", letterSpacing:"3px", marginBottom:"0", textAlign:"center" }}>
              MUSIC RUNS
            </h2>
            <h2 style={{ fontFamily:R, fontSize:"clamp(1.8rem,4vw,2.4rem)", color:"#3CCE2A", letterSpacing:"3px", marginBottom:"0", textAlign:"center", textShadow:"0 0 24px rgba(60,206,42,.35)" }}>
              IN HER VEINS
            </h2>
            {/* Horizontal ornament */}
            <div style={{ display:"flex", alignItems:"center", gap:"12px", margin:"16px auto", maxWidth:"340px" }}>
              <div style={{ flex:1, height:"1px", background:"linear-gradient(90deg,transparent,#2C4820)" }}/>
              <span style={{ color:"#F5C82A", fontSize:"13px" }}>✦</span>
              <div style={{ flex:1, height:"1px", background:"linear-gradient(90deg,#2C4820,transparent)" }}/>
            </div>
          </div>

          {/* Quote block */}
          <div style={{ position:"relative", padding:"0 0 0 28px" }}>
            {/* Left quote accent */}
            <div style={{ position:"absolute", left:0, top:0, fontFamily:S, fontSize:"72px", color:"rgba(60,206,42,.2)", lineHeight:.8, fontStyle:"normal" }}>"</div>
            <p style={{ fontFamily:S, fontStyle:"italic", fontSize:"clamp(15px,2vw,17px)", color:"#9ABB88", lineHeight:2, margin:"0 0 24px" }}>
              Colet of Bini comes from a musically inclined family. She composes songs, plays guitar, and pours her heart into every P-pop performance. CFS is built by fans who feel every note she plays.
            </p>
          </div>

          {/* Tags row */}
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", justifyContent:"center" }}>
            {["🎸 Song Composer","🎵 P-Pop Artist","🎸 Guitar Player","💚 Bini Member"].map(tag => (
              <span key={tag} className="cfs-tag" style={{ fontFamily:B, fontSize:"12px", color:"#3CCE2A", border:"1.5px solid #2C4820", borderRadius:"20px", padding:"6px 16px", background:"#0A1408", letterSpacing:".5px" }}>{tag}</span>
            ))}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════
          MINI STATS BAR
      ════════════════════════════════════════════ */}
      <div style={{ background:"#0A1208", borderBottom:"2px solid #1A2C14", padding:"28px 24px" }}>
        <div style={{ maxWidth:"720px", margin:"0 auto", display:"flex", justifyContent:"center", gap:"clamp(24px,6vw,80px)", flexWrap:"wrap" }}>
          {[
            { value:"P-POP", label:"Genre" },
            { value:"BINI",  label:"Group" },
            { value:"CFS",   label:"Fansupport" },
            { value:"PH",    label:"Based in" },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:R, fontSize:"clamp(18px,3vw,24px)", color:"#F0EAD6", letterSpacing:"3px", marginBottom:"4px" }}>{value}</div>
              <div style={{ fontFamily:B, fontSize:"10px", color:"#4A6B3A", letterSpacing:"2px", textTransform:"uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          CTA SECTION
      ════════════════════════════════════════════ */}
      <section style={{ background:"#162510", borderBottom:"2px solid #2C4820", padding:"80px 24px", position:"relative", overflow:"hidden" }}>

        {/* Dot grid */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(60,206,42,.1) 1.5px,transparent 1.5px)", backgroundSize:"18px 18px" }}/>

        {/* Concentric arc decoration — centered behind content */}
        <svg style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", width:"520px", height:"520px", opacity:.06, pointerEvents:"none" }} viewBox="0 0 520 520">
          {[80,130,180,230,280].map((r,i) => (
            <circle key={i} cx="260" cy="260" r={r} fill="none" stroke="#3CCE2A" strokeWidth="1.5" strokeDasharray="6 8"/>
          ))}
        </svg>

        {/* Corner brackets */}
        {[
          { top:"20px",  left:"20px",  borderTop:"2px solid #3CCE2A", borderLeft:"2px solid #3CCE2A"  },
          { top:"20px",  right:"20px", borderTop:"2px solid #3CCE2A", borderRight:"2px solid #3CCE2A" },
          { bottom:"20px", left:"20px",  borderBottom:"2px solid #3CCE2A", borderLeft:"2px solid #3CCE2A"  },
          { bottom:"20px", right:"20px", borderBottom:"2px solid #3CCE2A", borderRight:"2px solid #3CCE2A" },
        ].map((style, i) => (
          <div key={i} style={{ position:"absolute", width:"28px", height:"28px", ...style }}/>
        ))}

        {/* Content */}
        <div style={{ position:"relative", zIndex:1, maxWidth:"600px", margin:"0 auto", textAlign:"center" }}>
          <SectionOrnament label="Become a member"/>
          <h2 style={{ fontFamily:R, fontSize:"clamp(2rem,5vw,2.8rem)", color:"#F0EAD6", letterSpacing:"4px", marginBottom:"8px" }}>
            JOIN THE FAM!
          </h2>
          <div style={{ height:"3px", background:"linear-gradient(90deg,transparent,#F5C82A 30%,#F5C82A 70%,transparent)", maxWidth:"220px", margin:"0 auto 20px", borderRadius:"2px" }}/>
          <p style={{ fontFamily:S, fontStyle:"italic", fontSize:"15px", color:"#8AAA78", lineHeight:1.9, marginBottom:"32px", maxWidth:"460px", margin:"0 auto 32px" }}>
            Become an official CFS member and get access to exclusive events, the community feed, badges, merch drops, and more. Sakay na!
          </p>
          <RetroBtn href="/register" bg="#F5C82A" color="#080F06">REGISTER NOW ✦</RetroBtn>
          <p style={{ fontFamily:B, fontSize:"11px", color:"#3A5A2C", letterSpacing:"1.5px", marginTop:"16px" }}>
            FREE TO JOIN · OPEN TO ALL COLET FANS
          </p>
        </div>
      </section>

    </div>
  );
}