"use client";
import { useState } from "react";
import Image from "next/image";
import { Drawer } from "vaul";
import { IconMail, IconX } from "@/components/shared/Icons";
import type { Letter } from "@/lib/letters";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  paper: "#FAFDF9", cream: "#F2F7F2", mist: "#E8F0E4",
  forest: "#1B3A2D", sage: "#4A7C59", border: "#DDE8DD",
  muted: "#7A8E7A", green: "#1A8040",
};

/** Strip <script>, <iframe>, on*= handlers, and javascript: URLs from
 *  the RSS HTML before injecting via dangerouslySetInnerHTML. Medium's
 *  own output is safe but we don't trust remote HTML by default. */
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
        .letter-body { font-family: ${B}; font-size: 15.5px; line-height: 1.85; color: #1B3A2D; }
        .letter-body h1, .letter-body h2, .letter-body h3, .letter-body h4 {
          font-family: ${S}; color: #1B3A2D; margin: 24px 0 10px; line-height: 1.25;
        }
        .letter-body h1 { font-size: 1.8rem; }
        .letter-body h2 { font-size: 1.4rem; }
        .letter-body h3 { font-size: 1.15rem; }
        .letter-body p { margin: 0 0 16px; }
        .letter-body a { color: #1A8040; text-decoration: underline; }
        .letter-body img { max-width: 100%; height: auto; border-radius: 10px; margin: 16px 0; }
        .letter-body blockquote {
          margin: 20px 0; padding: 12px 20px;
          border-left: 3px solid #1A8040; background: #F5F7EC;
          border-radius: 0 10px 10px 0; font-style: italic;
        }
        .letter-body figure { margin: 20px 0; }
        .letter-body figcaption { font-size: 12px; color: #7A8E7A; text-align: center; margin-top: 6px; }
        .letter-body ul, .letter-body ol { padding-left: 22px; margin: 0 0 16px; }
        .letter-body li { margin-bottom: 6px; }
        .letter-body hr { border: none; border-top: 1px dashed #DDE8DD; margin: 28px 0; }
      `}</style>

      <Drawer.Root open={!!open} onOpenChange={(v) => !v && setOpen(null)} shouldScaleBackground>
        <Drawer.Portal>
          <Drawer.Overlay style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(15, 42, 30, 0.55)" }} />
          <Drawer.Content
            aria-describedby={undefined}
            className="letter-modal"
            style={{
              position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 61,
              background: "#F5F7EC",
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              boxShadow: "0 -20px 60px rgba(15,42,30,0.25)",
              maxHeight: "92vh",
              display: "flex", flexDirection: "column",
              outline: "none",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px", flexShrink: 0 }}>
              <div style={{ width: 48, height: 4, background: "#DDE8DD", borderRadius: 999 }} />
            </div>

            {/* Close button */}
            <button
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="btn-fx"
              style={{ position: "absolute", top: 18, right: 18, zIndex: 2, background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(15,42,30,0.08)" }}>
              <IconX size={14} color="#1B3A2D" />
            </button>

            {open && (
              <div style={{ overflowY: "auto", flex: 1 }}>
                <div style={{ maxWidth: "720px", margin: "0 auto", padding: "12px 28px 40px" }}>

                  {/* Optional hero image */}
                  {open.thumbnail && (
                    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 14, overflow: "hidden", marginBottom: 24, background: "#E8F0E4" }}>
                      <Image src={open.thumbnail} alt="" fill sizes="720px" priority style={{ objectFit: "cover" }} />
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ marginBottom: 18 }}>
                    <div className="scrap-note" style={{ fontSize: 20, color: "#4A7C59", marginBottom: 4, lineHeight: 1 }}>
                      Dear Cocacolets ✦
                    </div>
                    <Drawer.Title asChild>
                      <h2 style={{ fontFamily: S, fontSize: "clamp(1.8rem, 4vw, 2.4rem)", color: "#1B3A2D", lineHeight: 1.15, margin: "0 0 8px", letterSpacing: "-0.3px" }}>
                        {open.title}
                      </h2>
                    </Drawer.Title>
                    {open.pubDate && (
                      <div style={{ fontFamily: B, fontSize: 12, color: "#7A8E7A" }}>
                        Written {new Date(open.pubDate).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="letter-body" dangerouslySetInnerHTML={{ __html: sanitize(open.content) }} />

                  {/* Footer — Read on Medium fallback */}
                  <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px dashed #DDE8DD", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                    <span className="scrap-note" style={{ fontSize: 20, color: "#4A7C59", lineHeight: 1 }}>salamat ✦</span>
                    <a href={open.link} target="_blank" rel="noopener noreferrer" className="btn-fx"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#5A7A60", background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 10, padding: "9px 16px", textDecoration: "none", letterSpacing: "1.2px" }}>
                      READ ON MEDIUM ↗
                    </a>
                  </div>
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>

        <style>{`
          @media (min-width: 900px) {
            .letter-modal {
              top: 50% !important;
              bottom: auto !important;
              left: 50% !important;
              right: auto !important;
              transform: translate(-50%, -50%);
              width: 760px;
              max-width: calc(100vw - 32px);
              max-height: 88vh !important;
              border-radius: 20px !important;
            }
          }
        `}</style>
      </Drawer.Root>
    </>
  );
}
