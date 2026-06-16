"use client";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

// Note paper colors — soft pastels that feel handmade
const NOTE_COLORS = [
  { bg: "#FDFBF0", border: "#E8D88A", tape: "#F5ECA0" },
  { bg: "#F0F7F0", border: "#B8D8B8", tape: "#C8E8C8" },
  { bg: "#FDF5F0", border: "#E8C8B0", tape: "#F5D8C0" },
  { bg: "#F0F4FB", border: "#B8C8E8", tape: "#C8D8F5" },
  { bg: "#FBF0F5", border: "#E8B8C8", tape: "#F5C8D8" },
];

// Slight rotations for the pinned look
const ROTATIONS = [-2.5, 1.8, -1.2, 2.8, -2.0];

interface Letter {
  id: string;
  title: string;
  content: string;
  created_at: string;
  profiles?: { display_name?: string; avatar_url?: string };
}

export default function FanLettersBulletin({ letters }: { letters: Letter[] }) {
  return (
    <div style={{
      background: "linear-gradient(145deg, #C4924A 0%, #B8844A 50%, #C89A58 100%)",
      borderRadius: "14px",
      padding: "14px",
      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)",
      backgroundImage: `
        linear-gradient(145deg, #C4924A 0%, #B8844A 50%, #C89A58 100%),
        radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)
      `,
      backgroundSize: "100% 100%, 16px 16px",
      position: "relative",
    }}>
      {/* Cork texture overlay */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "14px",
        backgroundImage: "radial-gradient(ellipse at 2px 2px, rgba(0,0,0,0.07) 1.5px, transparent 0)",
        backgroundSize: "14px 14px",
        pointerEvents: "none",
      }} />

      {/* Board header */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontFamily: R, fontSize: "10px", color: "#FFFFFF", letterSpacing: "2px", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>💌 LETTERS FOR COLET</div>
        <Link href="/members/letters" style={{ fontFamily: R, fontSize: "9px", color: "rgba(255,255,255,0.8)", textDecoration: "none", letterSpacing: "1px", background: "rgba(0,0,0,0.15)", borderRadius: "4px", padding: "3px 8px" }}>SEE ALL</Link>
      </div>

      {/* Notes */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        {letters.length === 0 ? (
          <Link href="/members/letters" style={{ textDecoration: "none" }}>
            <div style={{
              background: "#FDFBF0", border: "1.5px dashed #C8A868",
              borderRadius: "6px", padding: "14px", textAlign: "center",
              transform: "rotate(-0.5deg)",
              boxShadow: "2px 3px 8px rgba(0,0,0,0.15)",
            }}>
              <div style={{ fontFamily: S, fontSize: "13px", color: "#8A7040", fontStyle: "italic", marginBottom: "6px" }}>Be the first to write...</div>
              <div style={{ fontFamily: R, fontSize: "10px", color: "#1A8040", letterSpacing: "1px" }}>✍️ WRITE A LETTER</div>
            </div>
          </Link>
        ) : (
          letters.slice(0, 4).map((letter, i) => {
            const note = NOTE_COLORS[i % NOTE_COLORS.length];
            const rot = ROTATIONS[i % ROTATIONS.length];
            return (
              <Link key={letter.id} href="/members/letters" style={{ textDecoration: "none" }}>
                <div style={{
                  background: note.bg,
                  border: `1.5px solid ${note.border}`,
                  borderRadius: "6px",
                  padding: "10px 10px 10px",
                  transform: `rotate(${rot}deg)`,
                  boxShadow: "2px 4px 10px rgba(0,0,0,0.18)",
                  position: "relative",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "rotate(0deg) scale(1.02)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "4px 8px 20px rgba(0,0,0,0.25)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = `rotate(${rot}deg)`; (e.currentTarget as HTMLDivElement).style.boxShadow = "2px 4px 10px rgba(0,0,0,0.18)"; }}>
                  {/* Tape strip at top */}
                  <div style={{
                    position: "absolute", top: "-6px", left: "50%", transform: "translateX(-50%)",
                    width: "32px", height: "12px", background: note.tape,
                    borderRadius: "2px", opacity: 0.85,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }} />
                  {/* Author */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#DDE8DD", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {letter.profiles?.avatar_url
                        ? <img src={letter.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontFamily: R, fontSize: "9px", color: "#4A7C59" }}>{(letter.profiles?.display_name ?? "M")[0].toUpperCase()}</span>}
                    </div>
                    <span style={{ fontFamily: B, fontSize: "10px", color: "#5A5040" }}>{letter.profiles?.display_name ?? "Member"}</span>
                  </div>
                  {/* Title */}
                  <div style={{ fontFamily: S, fontSize: "12px", color: "#2A2010", lineHeight: 1.3, marginBottom: "4px", fontStyle: "italic" }}>{letter.title}</div>
                  {/* Preview */}
                  <div style={{ fontFamily: B, fontSize: "10px", color: "#6A6050", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{letter.content}</div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Write CTA at bottom */}
      {letters.length > 0 && (
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", marginTop: "10px" }}>
          <Link href="/members/letters" style={{ fontFamily: R, fontSize: "10px", color: "rgba(255,255,255,0.9)", textDecoration: "none", letterSpacing: "1px", background: "rgba(0,0,0,0.2)", borderRadius: "6px", padding: "5px 12px", display: "inline-block", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
            ✍️ WRITE YOUR LETTER
          </Link>
        </div>
      )}
    </div>
  );
}
