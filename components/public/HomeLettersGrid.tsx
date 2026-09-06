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

/** Medium repeats the thumbnail as the first <img> inside the content
 *  body. When we already render it as a hero above the title, remove
 *  the duplicate from the content so readers don't see the same image
 *  twice back-to-back. */
function stripLeadingImage(html: string, thumbnailUrl: string | null): string {
  if (!thumbnailUrl) return html;
  // Match the first <img> tag (possibly wrapped in <figure> or <p>)
  // whose src equals the thumbnail. Only strips ONE occurrence.
  const escUrl = thumbnailUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Strip <figure>...<img src="thumb">...</figure> or a bare leading <img src="thumb">
  return html
    .replace(new RegExp(`^\\s*<figure[^>]*>[\\s\\S]*?<img[^>]+src="${escUrl}"[\\s\\S]*?<\\/figure>`, "i"), "")
    .replace(new RegExp(`^\\s*<p[^>]*>\\s*<img[^>]+src="${escUrl}"[^>]*>\\s*<\\/p>`, "i"), "")
    .replace(new RegExp(`^\\s*<img[^>]+src="${escUrl}"[^>]*>`, "i"), "");
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
        /* Medium-style reading typography — serif body, large size, generous line-height,
           near-black text on white. Scoped to .letter-body so it never leaks into the
           rest of the site's sans-serif layout. */
        .letter-body {
          font-family: 'Charter', 'Iowan Old Style', 'Georgia', 'Times New Roman', serif;
          font-size: 20px; line-height: 1.58; color: #242424;
          letter-spacing: -0.003em;
          word-wrap: break-word; overflow-wrap: anywhere;
        }
        .letter-body > *:first-child { margin-top: 0; }
        .letter-body p, .letter-body ul, .letter-body ol { margin: 0 0 28px; }
        .letter-body p { -webkit-font-smoothing: antialiased; }
        .letter-body h1, .letter-body h2, .letter-body h3, .letter-body h4 {
          font-family: 'sohne', 'Helvetica Neue', Arial, sans-serif;
          color: #242424; font-weight: 700; letter-spacing: -0.02em;
          margin: 40px 0 12px; line-height: 1.2;
        }
        .letter-body h1 { font-size: 34px; }
        .letter-body h2 { font-size: 26px; }
        .letter-body h3 { font-size: 22px; margin-top: 32px; }
        .letter-body h4 { font-size: 18px; }
        .letter-body a { color: #242424; text-decoration: underline; text-decoration-color: rgba(0,0,0,0.3); text-underline-offset: 3px; }
        .letter-body a:hover { text-decoration-color: #242424; }
        .letter-body strong { font-weight: 700; color: #242424; }
        .letter-body em { font-style: italic; }
        .letter-body img { display: block; max-width: 100%; height: auto; margin: 32px auto; }
        .letter-body figure { margin: 32px 0; }
        .letter-body figure img { margin: 0 auto; }
        .letter-body figcaption {
          font-family: 'sohne', 'Helvetica Neue', Arial, sans-serif;
          font-size: 14px; color: #6B6B6B; text-align: center;
          margin-top: 10px; line-height: 1.4;
        }
        .letter-body blockquote {
          margin: 28px 0; padding: 0 0 0 22px;
          border-left: 3px solid #242424; font-style: italic;
          font-size: 22px; line-height: 1.5; color: #242424;
        }
        .letter-body blockquote p:last-child { margin-bottom: 0; }
        .letter-body ul, .letter-body ol { padding-left: 28px; }
        .letter-body li { margin-bottom: 8px; }
        .letter-body li p { margin-bottom: 8px; }
        .letter-body hr {
          border: none; text-align: center; margin: 40px 0;
          height: 24px; letter-spacing: 8px; color: #6B6B6B;
        }
        .letter-body hr::before { content: "· · ·"; font-size: 24px; }
        .letter-body pre {
          background: #F2F2F2; padding: 16px 20px; border-radius: 4px;
          overflow-x: auto; font-size: 15px;
          font-family: 'Menlo', 'Monaco', monospace;
          margin: 0 0 28px;
        }
        .letter-body code {
          background: #F2F2F2; padding: 2px 4px; border-radius: 2px;
          font-size: 0.9em;
          font-family: 'Menlo', 'Monaco', monospace;
        }
        .letter-body pre code { background: transparent; padding: 0; }
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
            className="letter-modal"
            style={{
              position: "fixed",
              zIndex: 61,
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "calc(100vw - 16px)",
              maxWidth: "760px",
              maxHeight: "calc(100dvh - 16px)",
              background: "#FFFFFF",
              borderRadius: 12,
              boxShadow: "0 20px 60px rgba(15,42,30,0.35)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "letterSlideIn 0.24s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {/* Sticky top bar with source label + close button — matches
                Medium's post-open state where the origin is always visible */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px 10px 20px", borderBottom: "1px solid #F2F2F2", background: "#FFFFFF", flexShrink: 0 }}>
              <span style={{ fontFamily: "'sohne', 'Helvetica Neue', Arial, sans-serif", fontSize: 12, color: "#6B6B6B", letterSpacing: "0.02em" }}>
                letters from colet · Medium
              </span>
              <button onClick={close} aria-label="Close"
                style={{ background: "transparent", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B6B6B" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#F2F2F2"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <IconX size={18} color="currentColor" />
              </button>
            </div>

            {/* Scrollable content — reading column is narrower than the
                modal, mirrors Medium's ~680px article width */}
            <div style={{ overflowY: "auto", overscrollBehavior: "contain", flex: 1 }}>
              <article className="letter-article">

                {/* Title block */}
                <header style={{ marginBottom: 24 }}>
                  <h1 id="letter-modal-title" style={{ fontFamily: "'sohne', 'Helvetica Neue', Arial, sans-serif", fontSize: "clamp(1.9rem, 4.4vw, 2.6rem)", fontWeight: 700, color: "#242424", lineHeight: 1.15, margin: "0 0 12px", letterSpacing: "-0.024em" }}>
                    {open.title}
                  </h1>

                  {/* Author byline row — matches how Colet's Medium
                      profile presents her (name is lowercase). */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg, #A8D3B4, #4A7C59)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontFamily: "'sohne', 'Helvetica Neue', Arial, sans-serif", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>c</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontFamily: "'sohne', 'Helvetica Neue', Arial, sans-serif", fontSize: 14, color: "#242424", fontWeight: 500 }}>
                        letters from colet
                      </span>
                      {open.pubDate && (
                        <span style={{ fontFamily: "'sohne', 'Helvetica Neue', Arial, sans-serif", fontSize: 13, color: "#6B6B6B" }}>
                          {new Date(open.pubDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                    </div>
                  </div>
                </header>

                {/* Hero image — full-bleed to reading column, Medium style */}
                {open.thumbnail && (
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden", marginBottom: 28, background: "#F2F2F2" }}>
                    <Image src={open.thumbnail} alt="" fill sizes="(max-width: 800px) 100vw, 680px" priority style={{ objectFit: "cover" }} />
                  </div>
                )}

                {/* Body */}
                <div className="letter-body" dangerouslySetInnerHTML={{ __html: sanitize(stripLeadingImage(open.content, open.thumbnail)) }} />

                {/* Footer — Medium-style author card with real bio */}
                <footer style={{ marginTop: 48, paddingTop: 28, borderTop: "1px solid #E6E6E6", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg, #A8D3B4, #4A7C59)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontFamily: "'sohne', 'Helvetica Neue', Arial, sans-serif", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>c</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'sohne', 'Helvetica Neue', Arial, sans-serif", fontSize: 11, color: "#6B6B6B", letterSpacing: "0.05em", textTransform: "uppercase" }}>Written by</div>
                      <div style={{ fontFamily: "'sohne', 'Helvetica Neue', Arial, sans-serif", fontSize: 16, color: "#242424", fontWeight: 700, lineHeight: 1.2 }}>letters from colet</div>
                      <p style={{ fontFamily: "'sohne', 'Helvetica Neue', Arial, sans-serif", fontSize: 14, color: "#6B6B6B", lineHeight: 1.5, margin: "4px 0 0" }}>
                        wala akong ipong pera, eyebags lang at unsaid thoughts madami.
                      </p>
                    </div>
                  </div>
                  <a href={open.link} target="_blank" rel="noopener noreferrer"
                    style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'sohne', 'Helvetica Neue', Arial, sans-serif", fontSize: 13, fontWeight: 500, color: "#FFFFFF", background: "#1A8917", border: "none", borderRadius: 999, padding: "8px 18px", textDecoration: "none" }}>
                    Read on Medium ↗
                  </a>
                </footer>
              </article>
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
            /* Reading column — Medium keeps this narrower than the modal
               so lines stay a comfortable measure (~65ch) */
            .letter-article {
              max-width: 680px;
              margin: 0 auto;
              padding: 28px 24px 48px;
            }
            @media (min-width: 720px) {
              .letter-article { padding: 32px 40px 56px; }
            }
            @media (max-width: 480px) {
              .letter-article { padding: 20px 18px 40px; }
            }
            /* Full-viewport modal on small phones so nothing scrolls under
               the notch and everything's readable */
            @media (max-width: 480px) {
              .letter-modal {
                width: 100vw !important;
                max-width: 100vw !important;
                max-height: 100dvh !important;
                border-radius: 0 !important;
                top: 0 !important; left: 0 !important;
                transform: none !important;
              }
            }
          `}</style>
        </>,
        document.body,
      )}
    </>
  );
}
