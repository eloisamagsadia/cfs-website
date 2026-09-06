"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { IconMail, IconX } from "@/components/shared/Icons";
import type { Letter } from "@/lib/letters";

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  paper: "#FAFDF9", cream: "#F2F7F2", mist: "#E8F0E4",
  forest: "#1B3A2D", sage: "#4A7C59", border: "#DDE8DD",
  muted: "#7A8E7A", green: "#1A8040",
};

/** Strip <script>, <iframe>, on*= handlers, and javascript: URLs from
 *  the RSS HTML before injecting via dangerouslySetInnerHTML. */
function sanitize(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
    .replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'");
}

export default function HomeLettersGrid({ letters }: { letters: Letter[] }) {
  const [open, setOpen] = useState<Letter | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const close = useCallback(() => setOpen(null), []);

  // ESC to close + body scroll lock while open
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {letters.map((letter) => (
          <button key={letter.link}
            onClick={() => setOpen(letter)}
            className="letter-card btn-fx"
            style={{ appearance: "none", textAlign: "left", cursor: "pointer", background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(15,42,30,0.05)", transition: "transform 0.15s, border-color 0.15s", display: "flex", flexDirection: "column", padding: 0, font: "inherit" }}>
            {letter.thumbnail ? (
              <div style={{ position: "relative", aspectRatio: "16/9", background: C.mist }}>
                <Image src={letter.thumbnail} alt="" fill sizes="(max-width: 720px) 100vw, 360px" style={{ objectFit: "cover" }} />
              </div>
            ) : (
              <div style={{ aspectRatio: "16/9", background: "linear-gradient(135deg, #E8F0E4 0%, #C7E1CE 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconMail size={30} color="#4A7C59" />
              </div>
            )}
            <div style={{ padding: "16px 20px 18px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <div className="scrap-note" style={{ fontSize: "16px", color: "#4A7C59", lineHeight: 1 }}>Dear Cocacolets ✦</div>
              <div style={{ fontFamily: S, fontSize: "17px", color: C.forest, lineHeight: 1.25 }}>{letter.title}</div>
              <p style={{ fontFamily: B, fontSize: "12.5px", color: C.muted, lineHeight: 1.65, margin: 0 }}>{letter.excerpt}</p>
              <div style={{ marginTop: "auto", paddingTop: "10px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px" }}>
                <span style={{ color: C.muted }}>
                  {letter.pubDate ? new Date(letter.pubDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : ""}
                </span>
                <span style={{ color: C.green }}>READ →</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .letter-card:hover { transform: translateY(-2px); border-color: #1A8040 !important; }
        /* Letter body typography — scoped so we only style the letter content */
        .letter-body { font-family: ${B}; font-size: 15.5px; line-height: 1.85; color: #1B3A2D; word-wrap: break-word; overflow-wrap: anywhere; }
        .letter-body > *:first-child { margin-top: 0; }
        .letter-body h1, .letter-body h2, .letter-body h3, .letter-body h4 {
          font-family: ${S}; color: #1B3A2D; margin: 26px 0 10px; line-height: 1.25; letter-spacing: -0.3px;
        }
        .letter-body h1 { font-size: 1.9rem; }
        .letter-body h2 { font-size: 1.5rem; }
        .letter-body h3 { font-size: 1.2rem; }
        .letter-body h4 { font-size: 1.05rem; }
        .letter-body p { margin: 0 0 16px; }
        .letter-body a { color: #1A8040; text-decoration: underline; }
        .letter-body strong { color: #0F2A1E; font-weight: 700; }
        .letter-body em { font-style: italic; }
        .letter-body img { display: block; max-width: 100%; height: auto; border-radius: 12px; margin: 20px auto; }
        .letter-body figure { margin: 22px 0; text-align: center; }
        .letter-body figure img { margin: 0 auto; }
        .letter-body figcaption { font-family: ${B}; font-size: 12px; color: #7A8E7A; text-align: center; margin-top: 8px; font-style: italic; }
        .letter-body blockquote {
          margin: 22px 0; padding: 12px 20px;
          border-left: 3px solid #1A8040; background: #F5F7EC;
          border-radius: 0 10px 10px 0; font-style: italic;
        }
        .letter-body blockquote p:last-child { margin-bottom: 0; }
        .letter-body ul, .letter-body ol { padding-left: 22px; margin: 0 0 16px; }
        .letter-body li { margin-bottom: 6px; }
        .letter-body hr { border: none; border-top: 1px dashed #DDE8DD; margin: 28px 0; }
        .letter-body pre { background: #F5F7EC; padding: 14px 16px; border-radius: 10px; overflow-x: auto; font-size: 13px; }
        .letter-body code { background: #F5F7EC; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
      `}</style>

      {open && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={close}
            style={{ position: "fixed", inset: 0, background: "rgba(15,42,30,0.55)", zIndex: 60, animation: "letterFadeIn 0.18s ease-out" }}
          />
          {/* Modal */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="letter-modal-title"
            style={{
              position: "fixed",
              zIndex: 61,
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100vw - 24px)",
              maxWidth: "760px",
              maxHeight: "calc(100vh - 24px)",
              background: "#F5F7EC",
              borderRadius: 20,
              boxShadow: "0 20px 60px rgba(15,42,30,0.35)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "letterSlideIn 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Close */}
            <button onClick={close} aria-label="Close"
              style={{ position: "absolute", top: 14, right: 14, zIndex: 3, background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(15,42,30,0.15)" }}>
              <IconX size={14} color="#1B3A2D" />
            </button>

            {/* Scrollable content */}
            <div style={{ overflowY: "auto", overscrollBehavior: "contain", flex: 1 }}>
              <div style={{ padding: "28px 28px 40px" }}>

                {open.thumbnail && (
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 14, overflow: "hidden", marginBottom: 22, background: "#E8F0E4" }}>
                    <Image src={open.thumbnail} alt="" fill sizes="(max-width: 800px) 100vw, 760px" priority style={{ objectFit: "cover" }} />
                  </div>
                )}

                <div style={{ marginBottom: 20, paddingRight: 40 }}>
                  <div className="scrap-note" style={{ fontSize: 20, color: "#4A7C59", marginBottom: 4, lineHeight: 1 }}>
                    Dear Cocacolets ✦
                  </div>
                  <h2 id="letter-modal-title" style={{ fontFamily: S, fontSize: "clamp(1.6rem, 3.6vw, 2.2rem)", color: "#1B3A2D", lineHeight: 1.15, margin: "0 0 8px", letterSpacing: "-0.3px" }}>
                    {open.title}
                  </h2>
                  {open.pubDate && (
                    <div style={{ fontFamily: B, fontSize: 12, color: "#7A8E7A" }}>
                      Written {new Date(open.pubDate).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                    </div>
                  )}
                </div>

                <div className="letter-body" dangerouslySetInnerHTML={{ __html: sanitize(open.content) }} />

                <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px dashed #DDE8DD", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                  <span className="scrap-note" style={{ fontSize: 20, color: "#4A7C59", lineHeight: 1 }}>salamat ✦</span>
                  <a href={open.link} target="_blank" rel="noopener noreferrer" className="btn-fx"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#5A7A60", background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 10, padding: "9px 16px", textDecoration: "none", letterSpacing: "1.2px" }}>
                    READ ON MEDIUM ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes letterFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes letterSlideIn {
              from { opacity: 0; transform: translate(-50%, -46%) scale(0.96); }
              to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            @media (prefers-reduced-motion: reduce) {
              [style*="letterFadeIn"], [style*="letterSlideIn"] { animation: none !important; }
            }
          `}</style>
        </>,
        document.body,
      )}
    </>
  );
}
