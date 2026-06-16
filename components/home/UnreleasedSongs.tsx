"use client";
import { useState } from "react";

const C = {
  forest: "#1B3A2D",
  green:  "#1A8040",
  mist:   "#E8F0E4",
  sage:   "#4A7C59",
};
const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const songs = [
  { title:"Padayon",      year:"2023", note:"An original by Colet.", audio:"https://media.coletfs.com/music/Colet%20(BINI)%20-%20Padayon%20Lyrics.mp3",          cover:"https://media.coletfs.com/assets/vinyl-cover/padayon.jpeg" },
  { title:"You Did Well", year:"2023", note:"An original by Colet.", audio:"https://media.coletfs.com/music/You%20did%20well%20(LYRICS)%20BINI%20COLET.mp3",     cover:"https://media.coletfs.com/assets/vinyl-cover/youdidwell.jpeg" },
];

export default function UnreleasedSongs() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useState<HTMLAudioElement | null>(null);

  function handleSelect(i: number) {
    if (audioRef[0]) {
      audioRef[0].pause();
      audioRef[0].currentTime = 0;
    }
    const audio = new Audio(songs[i].audio);
    audioRef[1](audio);
    audio.play();
    setActive(i);
    setPlaying(true);
    audio.onended = () => setPlaying(false);
  }

  return (
    <section className="home-songs-section" style={{ padding:"72px 48px", background:"#1B3A2D", position:"relative", overflow:"hidden" }}>
      <style>{`
        @keyframes spin-vinyl {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .vinyl-disc-inner { transition: box-shadow 0.3s ease; }
        .vinyl-disc-inner.playing { animation: spin-vinyl 4s linear infinite; }
        .song-row { transition: background 0.2s ease; cursor: pointer; }
        .song-row:hover { background: rgba(255,255,255,0.08) !important; }
      `}</style>
      <div style={{ position:"absolute", top:"-60px", right:"-60px", width:"300px", height:"300px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.06)" }} />
      <div style={{ position:"absolute", top:"-20px", right:"-20px", width:"200px", height:"200px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.04)" }} />
      <div className="home-songs-grid" style={{ maxWidth:"1000px", margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"64px", alignItems:"center" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
            <span style={{ fontFamily:SG, fontSize:"9px", fontWeight:700, color:"#4A7C59", letterSpacing:"3px" }}>COLET ORIGINALS</span>
          </div>
          <h2 style={{ fontFamily:S, fontSize:"36px", color:"#ffffff", lineHeight:1.1, marginBottom:"8px", marginTop:"8px" }}>
            Songs Written<br /><em style={{ fontStyle:"italic", color:"#1A8040" }}>By Colet</em>
          </h2>
          <p style={{ fontFamily:B, fontSize:"14px", color:"rgba(255,255,255,0.6)", lineHeight:1.9, marginBottom:"28px" }}>
            Colet has written and composed songs for BINI and beyond. Here are some of her original works.
          </p>
          <div style={{ border:"1px solid rgba(255,255,255,0.1)", borderRadius:"16px", overflow:"hidden" }}>
            {songs.map((song, i) => (
              <div
                key={i}
                className="song-row"
                onClick={() => handleSelect(i)}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"16px 20px",
                  borderBottom: i < songs.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  background: active === i ? "rgba(60,206,42,0.12)" : "transparent",
                }}
              >
                <div>
                  <div style={{ fontFamily:SG, fontSize:"13px", fontWeight:700, color:"#ffffff", marginBottom:"3px" }}>{song.title}</div>
                  <div style={{ fontFamily:B, fontSize:"11px", color:"rgba(255,255,255,0.5)" }}>{song.note}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <span style={{ fontFamily:SG, fontSize:"10px", color:"rgba(255,255,255,0.4)", letterSpacing:"1px" }}>{song.year}</span>
                  <div style={{ width:"28px", height:"28px", borderRadius:"50%", border:"1px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polygon points="2,1 9,5 2,9" fill="rgba(255,255,255,0.7)"/></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center" }}>
          <div style={{ position:"relative", width:"380px", height:"380px" }}>
            <div
              className={`vinyl-disc-inner${playing ? " playing" : ""}`}
              style={{
                width:"380px", height:"380px", borderRadius:"50%",
                background:"radial-gradient(circle at 50% 50%, #1a1a1a 0%, #0a0a0a 60%, #1a1a1a 100%)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 20px 60px rgba(0,0,0,0.5)", position:"relative",
              }}
            >
              <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"repeating-radial-gradient(circle at 50%, transparent 0px, transparent 6px, rgba(255,255,255,0.02) 6px, rgba(255,255,255,0.02) 7px)" }} />
              <div style={{ width:"130px", height:"130px", borderRadius:"50%", overflow:"hidden", zIndex:1, border:"3px solid rgba(255,255,255,0.15)", boxShadow:"0 4px 20px rgba(0,0,0,0.4)" }}>
                <img src={songs[active].cover} alt={songs[active].title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
