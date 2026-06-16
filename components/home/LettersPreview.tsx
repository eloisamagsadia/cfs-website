"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const C = { forest:"#1A2E1A", sage:"#4A7C59", border:"#DDE8DD", muted:"#4A7C59", paper:"#FAFDF9" };

function timeAgo(d) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return days + "d ago";
  if (days < 365) return Math.floor(days/30) + "mo ago";
  return Math.floor(days/365) + "y ago";
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-PH", { month:"long", day:"numeric", year:"numeric" });
}

export default function LettersPreview() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (active) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  useEffect(() => {
    fetch("/api/letters")
      .then(r => r.json())
      .then(({ letters }) => { setLetters((letters || []).slice(0, 3)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const modal = active ? (
    <div onClick={() => setActive(null)} style={{ position:"fixed", top:0, left:0, width:"100vw", height:"100vh", background:"rgba(0,0,0,0.6)", zIndex:99999, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px", backdropFilter:"blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:"20px", maxWidth:"860px", width:"100%", maxHeight:"88vh", overflow:"hidden", display:"flex", flexDirection:"column", marginTop:"auto", marginBottom:"auto" }}>
        <div style={{ padding:"28px 32px", overflowY:"auto", flex:1 }}>
          {active.tags && active.tags.length > 0 && (
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"12px" }}>
              {active.tags.slice(0,3).map(tag => <span key={tag} style={{ fontFamily:B, fontSize:"10px", color:C.sage, background:"#EEF4EE", borderRadius:"20px", padding:"2px 10px" }}>{tag}</span>)}
            </div>
          )}
          <h2 style={{ fontFamily:S, fontSize:"24px", color:C.forest, lineHeight:1.3, marginBottom:"16px" }}>{active.title}</h2>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", paddingBottom:"20px", borderBottom:"1px solid #DDE8DD", marginBottom:"24px" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"50%", overflow:"hidden", border:"1.5px solid #DDE8DD" }}>
              <img src="https://cdn-images-1.medium.com/fit/c/150/150/1*OKtnsFxtdnvoBrTZ_8o1Nw@2x.jpeg" alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </div>
            <div>
              <div style={{ fontFamily:SG, fontSize:"11px", fontWeight:700, color:C.forest }}>letters from colet</div>
              <div style={{ fontFamily:B, fontSize:"11px", color:C.muted }}>{formatDate(active.pubDate)}</div>
            </div>
            <a href={active.link} target="_blank" rel="noopener noreferrer" style={{ marginLeft:"auto", fontFamily:SG, fontSize:"10px", fontWeight:700, color:C.sage, textDecoration:"none", border:"1.5px solid #DDE8DD", borderRadius:"20px", padding:"5px 14px" }}>READ ON MEDIUM</a>
          </div>
          <div dangerouslySetInnerHTML={{ __html: active.content }} className="lfc-content" style={{ fontFamily:B, fontSize:"15px", color:"#333", lineHeight:2 }} />
        </div>
        <div style={{ padding:"16px 32px", borderTop:"1px solid #DDE8DD", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <button onClick={() => setActive(null)} style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:C.muted, background:"none", border:"none", cursor:"pointer", letterSpacing:"1px" }}>CLOSE</button>
          <a href={active.link} target="_blank" rel="noopener noreferrer" style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:C.sage, textDecoration:"none", letterSpacing:"1px" }}>CLAP ON MEDIUM</a>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <section style={{ padding:"16px 48px 100px", background:C.paper }}>
      <style>{`
        .lfc-content p { margin: 0 0 16px; }
        .lfc-content img { max-width: 100%; border-radius: 8px; margin: 16px 0; display: block; }
        .lfc-content figure { margin: 16px 0; }
        .lfc-content strong { font-weight: 700; color: #1A2E1A; }
        .lfc-content em { font-style: italic; }
        .lfc-content blockquote { border-left: 3px solid #4A7C59; margin: 20px 0; padding: 10px 16px; background: #F2F7F2; border-radius: 0 8px 8px 0; color: #4A7C59; font-style: italic; }
        .lfc-content h1, .lfc-content h2, .lfc-content h3 { color: #1A2E1A; margin: 24px 0 8px; font-weight: 700; }
        .lfc-content a { color: #4A7C59; }
      `}</style>
      {typeof window !== "undefined" && modal && createPortal(modal, document.body)}
      <div style={{ maxWidth:"1200px", margin:"0 auto" }}>
        <div className="home-letters-header" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"40px" }}>
          <h2 style={{ fontFamily:S, fontSize:"36px", color:C.forest, lineHeight:1.1 }}>Letters from Colet</h2>
          <a href="https://medium.com/@lettersfromcolet" target="_blank" rel="noopener noreferrer" style={{ fontFamily:SG, fontSize:"9px", fontWeight:700, color:C.forest, letterSpacing:"1px", textDecoration:"none", borderBottom:"1px solid " + C.border, paddingBottom:"2px" }}>VIEW ALL ON MEDIUM</a>
        </div>
        {loading ? (
          <div className="home-letters-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"20px" }}>
            {[0,1,2].map(i => <div key={i} style={{ background:"#fff", borderRadius:"16px", border:"1px solid " + C.border, height:"220px", opacity:0.4 }} />)}
          </div>
        ) : (
          <div className="home-letters-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"20px" }}>
            {letters.map((letter, i) => (
              <div key={i} onClick={() => setActive(letter)}
                style={{ background:"#ffffff", borderRadius:"16px", border:"1px solid " + C.border, overflow:"hidden", cursor:"pointer", transition:"transform 0.2s, box-shadow 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
              >
                {letter.thumbnail && <div style={{ width:"100%", height:"160px", overflow:"hidden" }}><img src={letter.thumbnail} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /></div>}
                <div style={{ padding:"20px" }}>
                  <div style={{ fontFamily:S, fontSize:"17px", color:C.forest, lineHeight:1.4, marginBottom:"10px" }}>{letter.title}</div>
                  <div style={{ fontFamily:B, fontSize:"12px", color:C.muted, lineHeight:1.7, marginBottom:"16px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical" }}>{letter.excerpt}</div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontFamily:B, fontSize:"11px", color:C.muted }}>{timeAgo(letter.pubDate)}</span>
                    <span style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:C.sage }}>READ</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
