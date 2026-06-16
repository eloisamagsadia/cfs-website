import type { Metadata } from "next";
import Link from "next/link";
import UnreleasedSongs from "@/components/home/UnreleasedSongs";
import LettersPreview from "@/components/home/LettersPreview";
export const metadata: Metadata = { title: "Home" };
export const viewport = { themeColor: "#FAFDF9" };

const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";

const C = {
  paper:  "#FAFDF9",
  cream:  "#F2F7F2",
  warm:   "#EEF4EE",
  mist:   "#E4F0E4",
  forest: "#1B3A2D",
  sage:   "#4A7C59",
  lime:   "#3CCE2A",
  mint:   "#8FBF9F",
  border: "#DDE8DD",
  muted:  "#7A8E7A",
  ink:    "#1A1A18",
};

const features = [
  { title:"Events",    desc:"Fan meets & exclusive shows", icon:"ti-calendar",     href:"/events"            },
  { title:"Shop",      desc:"Official CFS merch & drops",  icon:"ti-shopping-bag", href:"/shop"              },
  { title:"Community", desc:"Connect with the fam",        icon:"ti-users",        href:"/members/community" },
  { title:"Projects",  desc:"Fan initiatives & campaigns", icon:"ti-photo",        href:"/projects"          },
  { title:"Donate",    desc:"Support CFS fan projects",    icon:"ti-heart",        href:"/donate"            },
  { title:"Reports",   desc:"Full financial transparency", icon:"ti-chart-bar",    href:"/reports"           },
];

const ticker = [
  "COLET FAN SUPORTA","BINI","P-POP FOREVER",
  "SAKAY NA","MUSIC IS LOVE","OFFICIAL FANSUPPORT PH","KUMANTA TAYO",
];

function Eyebrow({ label, center }: { label: string; center?: boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px", justifyContent: center ? "center" : "flex-start" }}>
      <span style={{ fontFamily:SG, fontSize:"9px", fontWeight:700, color:C.sage, letterSpacing:"3px" }}>{label}</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <div style={{ background:C.paper, color:C.ink }}>

      {/* ── HERO ── */}
      <section className="home-hero" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:"520px", overflow:"hidden", maxWidth:"1400px", margin:"0 auto", width:"100%" }}>

        {/* Left */}
        <div className="home-hero-left" style={{ padding:"64px 64px 64px 64px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <h1 style={{ fontFamily:S, fontSize:"clamp(36px,4vw,52px)", fontWeight:700, color:C.forest, lineHeight:1.05, marginBottom:"14px", letterSpacing:"-1px" }}>
            The Ace Is Here.<br />
            <em style={{ fontStyle:"italic", color:C.sage }}>And So Are We.</em>
          </h1>
          <p style={{ fontFamily:B, fontSize:"14px", color:C.muted, lineHeight:1.9, marginBottom:"32px", maxWidth:"380px" }}>
            We stream, we vote, we attend, we support. If you love Colet, you already belong here.
          </p>
          <div style={{ display:"flex", gap:"10px", marginBottom:"36px", flexWrap:"wrap" }}>
            <Link href="/register" style={{ display:"inline-block", background:C.forest, color:"#fff", fontFamily:SG, fontSize:"10px", fontWeight:700, letterSpacing:"1.5px", padding:"12px 28px", borderRadius:"6px", textDecoration:"none" }}>
              JOIN THE FAM
            </Link>
            <Link href="/events" style={{ display:"inline-block", background:"transparent", color:C.forest, fontFamily:SG, fontSize:"10px", fontWeight:600, letterSpacing:".8px", padding:"12px 22px", borderRadius:"6px", border:`1.5px solid ${C.border}`, textDecoration:"none" }}>
              EXPLORE EVENTS
            </Link>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            {["ti-brand-facebook","ti-brand-instagram","ti-brand-x","ti-brand-tiktok"].map(ic => (
              <div key={ic} style={{ width:"32px", height:"32px", borderRadius:"50%", background:C.mist, border:`1.5px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <i className={`ti ${ic}`} style={{ fontSize:"13px", color:C.sage }} aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="home-hero-right" style={{ background:C.cream, position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-end", justifyContent:"center", minWidth:0, maxWidth:"100%" }}>
          <div style={{ position:"absolute", inset:0, opacity:.06, backgroundImage:`linear-gradient(${C.forest} 1px,transparent 1px),linear-gradient(90deg,${C.forest} 1px,transparent 1px)`, backgroundSize:"32px 32px" }} />
          {[320,220,140].map((size,i) => (
            <div key={i} style={{ position:"absolute", width:`${size}px`, height:`${size}px`, top:`${-size/2.5}px`, right:`${-size/2.5}px`, borderRadius:"50%", border:`1px solid ${C.border}` }} />
          ))}
          <img src="https://media.coletfs.com/assets/hero/home/cfs-home-hero.png" alt="Colet" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top", position:"absolute", inset:0, zIndex:2, width:"100%", height:"100%" }} />
        </div>
      </section>


      {/* ── ABOUT ── */}

      {/* ── ABOUT COLET ── */}
      <section style={{ background:C.paper, borderBottom:`1px solid ${C.border}`, padding:"80px 48px" }}>
        <div className="home-about-grid" style={{ maxWidth:"1400px", margin:"0 auto", display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:"64px", alignItems:"start" }}>
          <div className="home-about-photos" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div style={{ background:C.forest, borderRadius:"16px", height:"280px", position:"relative" }}>
              <div style={{ position:"absolute", bottom:"16px", left:"16px" }}>
                <div style={{ fontFamily:SG, fontSize:"9px", color:"rgba(255,255,255,0.5)", letterSpacing:"1px", marginBottom:"2px" }}>BOHOL</div>
                <div style={{ fontFamily:SG, fontSize:"12px", fontWeight:500, color:"#fff" }}>Hometown</div>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              <div style={{ background:C.sage, borderRadius:"16px", height:"130px", position:"relative" }}>
                <div style={{ position:"absolute", bottom:"12px", left:"12px" }}>
                  <div style={{ fontFamily:S, fontSize:"22px", color:"#fff" }}>2021</div>
                  <div style={{ fontFamily:SG, fontSize:"9px", color:"rgba(255,255,255,0.6)", letterSpacing:"1px" }}>DEBUT YEAR</div>
                </div>
              </div>
              <div style={{ background:C.mint, borderRadius:"16px", flex:1, minHeight:"130px" }} />
            </div>
            <div style={{ background:C.border, borderRadius:"16px", height:"120px" }} />
            <div style={{ background:C.mist, borderRadius:"16px", height:"120px", border:`1px solid ${C.border}`, position:"relative" }}>
              <div style={{ position:"absolute", bottom:"12px", left:"12px" }}>
                <div style={{ fontFamily:SG, fontSize:"11px", fontWeight:700, color:C.sage }}>BINI</div>
                <div style={{ fontFamily:B, fontSize:"9px", color:C.muted }}>Group</div>
              </div>
            </div>
          </div>
          <div style={{ paddingTop:"8px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"16px" }}>
            </div>
            <div style={{ fontFamily:SG, fontSize:"9px", color:C.muted, letterSpacing:"1.5px", marginBottom:"8px" }}>MA. NICOLETTE FLORENOSOS VERGARA</div>
            <h2 style={{ fontFamily:S, fontSize:"36px", color:C.forest, lineHeight:1.05, marginBottom:"16px" }}>
              Every Chord <em style={{ fontStyle:"italic", color:C.sage }}>Tells Her Story.</em>
            </h2>
            <p style={{ fontFamily:B, fontSize:"14px", color:C.muted, lineHeight:1.9, marginBottom:"24px" }}>
              Main vocalist, lead dancer, and lead rapper of BINI. Born in Tagbilaran, Bohol, writing songs since 8th grade. CFS is built by fans who feel every note she plays.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginBottom:"28px" }}>
              {[
                { icon:"M9 18V5l12-2v13 M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M18 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6", label:"Composer & Songwriter" },
                { icon:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3", label:"Main Vocalist" },
                { icon:"M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4 M12 7v8 M8 21l4-6 4 6 M7 11l5 3 5-3", label:"Lead Dancer & Lead Rapper" },
                { icon:"M6 3h12l4 6-10 13L2 9z", label:"Guitarist" },
                { icon:"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", label:"BINI Member" },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.sage} strokeWidth="2">
                    {icon.split(" M").map((d, i) => <path key={i} d={i === 0 ? d : "M" + d} />)}
                  </svg>
                  <span style={{ fontFamily:B, fontSize:"13px", color:C.forest }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:"20px", paddingTop:"20px", borderTop:`1px solid ${C.border}` }}>
              {[["Sep 14","Birthday"],["P-Pop","Genre"],["Star Magic","Label"]].map(([val, label]) => (
                <div key={label} style={{ flex:1 }}>
                  <div style={{ fontFamily:S, fontSize:"18px", color:C.forest }}>{val}</div>
                  <div style={{ fontFamily:B, fontSize:"10px", color:C.muted, marginTop:"2px" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* ── HER STORY ── */}
      <section className="home-story-section" style={{ background:"#ffffff", position:"relative", overflow:"hidden", borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, padding:"80px 48px" }}>
        {[500,360,220].map((size,i) => (
          <div key={i} style={{ position:"absolute", right:`${-size/4}px`, top:"50%", transform:"translateY(-50%)", width:`${size}px`, height:`${size}px`, borderRadius:"50%", border:`1px solid ${C.border}`, pointerEvents:"none", zIndex:0 }} />
        ))}
        {[400,260].map((size,i) => (
          <div key={i} style={{ position:"absolute", left:`${-size/4}px`, top:"50%", transform:"translateY(-50%)", width:`${size}px`, height:`${size}px`, borderRadius:"50%", border:`1px solid ${C.border}`, pointerEvents:"none", zIndex:0 }} />
        ))}
        <style>{`
          .story-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .story-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(74,124,89,0.2);
          }
          .story-item {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s ease, transform 0.5s ease;
          }
          .story-item.visible {
            opacity: 1;
            transform: translateY(0);
          }
        `}</style>
        <div style={{ textAlign:"center", marginBottom:"56px" }}>
          <h2 style={{ fontFamily:S, fontSize:"48px", fontWeight:700, color:C.forest, lineHeight:1.1 }}>Her Story</h2>
          <p style={{ fontFamily:B, fontSize:"15px", color:C.muted, marginTop:"12px", lineHeight:1.8 }}>She never stopped showing up. Here's proof.</p>
        </div>
        <div style={{ maxWidth:"720px", margin:"0 auto", position:"relative" }}>
          <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:"2px", background:C.border, transform:"translateX(-50%)", zIndex:0 }} />
          {[
            { side:"left",  yr:"2018",      label:"Star Hunt Audition",   desc:"Auditions for ABS-CBN Star Hunt Academy in Bohol and is selected as a trainee." },
            { side:"right", yr:"2019-2020", label:"Training",             desc:"Intensive vocal, dance, and rap training at SHA." },
            { side:"left",  yr:"Nov 2020",  label:"Pre-Debut",            desc:"Introduced as 3rd BINI member. Releases Da Coconut Nut." },
            { side:"right", yr:"June 2021", label:"BINI Debut",           desc:"Debuts with Born To Win. Colet performs as main vocalist, lead dancer, and rapper." },
            { side:"left",  yr:"July 2022", label:"Be You Concert",       desc:"Performs at Be You: The World Will Adjust benefit concert." },
            { side:"right", yr:"2023",      label:"Pantropiko",           desc:"Rap verse goes viral. 170M Spotify streams and counting." },
            { side:"left",  yr:"June 2024", label:"Biniverse Concert",    desc:"First solo concert at New Frontier Theater. Sells out 3 nights. Extended to Canada." },
            { side:"right", yr:"July 2024", label:"KCON LA",              desc:"First Filipino pop act at KCON, Crypto.com Arena, Los Angeles." },
            { side:"left",  yr:"Nov 2024",  label:"Grand Biniverse",      desc:"3-night sold-out concert at Araneta Coliseum." },
            { side:"right", yr:"Feb 2025",  label:"Philippine Arena",     desc:"First Filipino act to sell out the Philippine Arena with 55,000 capacity." },
            { side:"left",  yr:"2025",      label:"Biniverse World Tour", desc:"Singapore, Dubai, London, US. Homecoming at SM Mall of Asia Arena." },
            { side:"right", yr:"Apr 2026",  label:"Coachella",            desc:"BINI performs at the Coachella Valley Music and Arts Festival. Historic for OPM." },
          ].map(({ side, yr, label, desc }, i) => (
            <div key={i} className="story-item" style={{ display:"grid", gridTemplateColumns:"1fr 32px 1fr", alignItems:"center", marginBottom:"20px", position:"relative", zIndex:1 }}>
              {side === "left" ? (
                <div className="story-card" style={{ background:"#4A7C59", borderRadius:"14px", padding:"16px 20px", textAlign:"right", cursor:"default" }}>
                  <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.6)", letterSpacing:"1px", marginBottom:"4px" }}>{yr}</div>
                  <div style={{ fontFamily:SG, fontSize:"13px", fontWeight:700, color:"#ffffff", marginBottom:"6px" }}>{label}</div>
                  <div style={{ fontFamily:B, fontSize:"12px", color:"rgba(255,255,255,0.8)", lineHeight:1.6 }}>{desc}</div>
                </div>
              ) : <div />}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", zIndex:2 }}>
                <div style={{ width:"12px", height:"12px", borderRadius:"50%", background:C.forest, border:"3px solid #ffffff", boxShadow:`0 0 0 2px ${C.sage}` }} />
              </div>
              {side === "right" ? (
                <div className="story-card" style={{ background:"#4A7C59", borderRadius:"14px", padding:"16px 20px", cursor:"default" }}>
                  <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.6)", letterSpacing:"1px", marginBottom:"4px" }}>{yr}</div>
                  <div style={{ fontFamily:SG, fontSize:"13px", fontWeight:700, color:"#ffffff", marginBottom:"6px" }}>{label}</div>
                  <div style={{ fontFamily:B, fontSize:"12px", color:"rgba(255,255,255,0.8)", lineHeight:1.6 }}>{desc}</div>
                </div>
              ) : <div />}
            </div>
          ))}
        </div>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            function init() {
              var items = document.querySelectorAll('.story-item');
              if (!items.length) return;
              var obs = new IntersectionObserver(function(entries) {
                entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('visible'); });
              }, { threshold: 0.15 });
              items.forEach(function(el) { obs.observe(el); });
            }
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
            else init();
          })();
        ` }} />
      </section>

      {/* ── HIGHLIGHT REEL ── */}
      <section className="home-section-pad" style={{ padding:"72px 48px", background:C.paper }}>
        <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
          <div style={{ marginBottom:"32px" }}>
            <Eyebrow label="CURATED BY THE FAM" />
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
              <h2 style={{ fontFamily:S, fontSize:"32px", color:C.forest, lineHeight:1.1 }}>Highlight Reel</h2>
              <span style={{ fontFamily:SG, fontSize:"9px", fontWeight:700, color:C.muted, letterSpacing:"1px" }}>Photos & Videos from the fam</span>
            </div>
          </div>
          <div className="home-reel-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gridTemplateRows:"200px 200px", gap:"12px" }}>
            {/* Main large card */}
            <div style={{ gridRow:"span 2", background:C.forest, borderRadius:"16px", padding:"24px", display:"flex", flexDirection:"column", justifyContent:"flex-end", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:"-40px", right:"-40px", width:"180px", height:"180px", borderRadius:"50%", border:`1px solid rgba(255,255,255,.06)` }} />
              <div style={{ display:"inline-block", background:"rgba(60,206,42,.15)", color:C.lime, fontFamily:SG, fontSize:"8px", fontWeight:700, letterSpacing:"1px", padding:"4px 10px", borderRadius:"20px", marginBottom:"10px" }}>HIGHLIGHT</div>
              <div style={{ fontFamily:S, fontSize:"22px", color:"#fff", marginBottom:"4px" }}>4 Minutes</div>
              <div style={{ fontFamily:B, fontSize:"12px", color:C.mint }}>BINIfied Solo Prod</div>
            </div>
            {/* Top right cards */}
            <div style={{ background:C.sage, borderRadius:"16px", position:"relative", overflow:"hidden", display:"flex", alignItems:"flex-end", padding:"16px" }}>
              <div>
                <div style={{ fontFamily:SG, fontSize:"12px", fontWeight:700, color:"#fff", marginBottom:"2px" }}>HMTU</div>
                <div style={{ fontFamily:B, fontSize:"11px", color:"rgba(255,255,255,.7)" }}>Electric Guitar Solo</div>
              </div>
            </div>
            <div style={{ background:C.mist, borderRadius:"16px" }} />
            {/* Bottom right cards */}
            <div style={{ background:C.cream, borderRadius:"16px" }} />
            <div style={{ background:C.mist, borderRadius:"16px" }} />
          </div>
        </div>
      </section>

      {/* ── UNRELEASED SONGS ── */}
      <UnreleasedSongs />
      <section className="home-section-pad" style={{ padding:"72px 48px", background:C.paper }}>
      <LettersPreview />
        <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
          <Eyebrow label="WHAT WE OFFER" />
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:"40px" }}>
            <h2 style={{ fontFamily:S, fontSize:"32px", color:C.forest, lineHeight:1.1 }}>Everything in One Place</h2>
            <Link href="/register" style={{ fontFamily:SG, fontSize:"9px", fontWeight:700, color:C.forest, letterSpacing:"1px", textDecoration:"none", borderBottom:`1px solid ${C.border}`, paddingBottom:"2px" }}>
              JOIN NOW →
            </Link>
          </div>
          <div className="home-features-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"12px" }}>
            {features.map(({ title, desc, icon, href }) => (
              <Link key={title} href={href} style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:"12px", padding:"28px 20px", textAlign:"center", textDecoration:"none", display:"block" }}>
                <i className={`ti ${icon}`} style={{ fontSize:"28px", color:C.sage, display:"block", marginBottom:"12px" }} aria-hidden="true" />
                <div style={{ fontFamily:SG, fontSize:"12px", fontWeight:700, color:C.forest, marginBottom:"6px", letterSpacing:".5px" }}>{title}</div>
                <div style={{ fontFamily:B,  fontSize:"11px", color:C.muted, lineHeight:1.6 }}>{desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* ── CTA ── */}
      <section className="home-cta-section" style={{ background:C.mist, borderBottom:`1px solid ${C.border}`, padding:"80px 48px", position:"relative", overflow:"hidden", textAlign:"center" }}>
        {[480,340,220].map((size,i) => (
          <div key={i} style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:`${size}px`, height:`${size}px`, borderRadius:"50%", border:`1px solid ${C.border}`, pointerEvents:"none" }} />
        ))}
        <div style={{ position:"relative", zIndex:1, maxWidth:"560px", margin:"0 auto" }}>
          <Eyebrow label="BECOME A MEMBER" center />
          <h2 style={{ fontFamily:S, fontSize:"40px", color:C.forest, lineHeight:1.1, marginBottom:"12px" }}>
            We See You, Palangga.<br /><em style={{ fontStyle:"italic", color:C.sage }}>This fam was made for you.</em>
          </h2>
          <p style={{ fontFamily:B, fontSize:"14px", color:C.muted, lineHeight:1.9, marginBottom:"36px" }}>
            Become an official CFS member and get access to exclusive events, the community feed, badges, merch drops, and more.
          </p>
          <div style={{ display:"flex", gap:"12px", justifyContent:"center", marginBottom:"32px", flexWrap:"wrap" }}>
            <Link href="/register" style={{ background:C.forest, color:"#fff", fontFamily:SG, fontSize:"11px", fontWeight:800, letterSpacing:"1.5px", padding:"15px 36px", borderRadius:"6px", textDecoration:"none", display:"inline-block" }}>
              JOIN NOW — IT&apos;S FREE
            </Link>

          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:"24px", flexWrap:"wrap" }}>
            {["Early event access","Exclusive content","Fan community","Members-only shop"].map(perk => (
              <div key={perk} style={{ display:"flex", alignItems:"center", gap:"6px", fontFamily:SG, fontSize:"10px", fontWeight:600, color:C.sage }}>
                <i className="ti ti-check" style={{ fontSize:"12px", color:C.lime }} aria-hidden="true" />
                {perk}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
