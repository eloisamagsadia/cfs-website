import type { Metadata } from "next";
import Link from "next/link";
import { IconCalendar, IconShoppingBag, IconHeart, IconMail } from "@/components/shared/Icons";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "This page took a wrong turn. Head back to the CFS home page.",
};

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const H  = "var(--font-caveat, cursive)";

// Same four destinations, styled as bento tiles in the home hero's
// palette — cream paper, pink, amber, mint.
const links = [
  { area: "events",  href: "/events",  label: "EVENTS",  note: "What's coming up", icon: <IconCalendar size={15} color="#1A6E0E" />,     bg: "#F5F7EC", border: "1px dashed #C7D5C0", ink: "#1B3A2D", sub: "#4A7C59" },
  { area: "shop",    href: "/shop",    label: "SHOP",    note: "Merch & bundles",  icon: <IconShoppingBag size={15} color="#B85268" />,  bg: "#FDE9EC", border: "1px solid #F3C4CC",  ink: "#8A2E45", sub: "#B85268" },
  { area: "support", href: "/support", label: "SUPPORT", note: "Help the cause",   icon: <IconHeart size={15} color="#8B5E1F" />,        bg: "#FFF3D6", border: "1px solid #F0C48A",  ink: "#8B5E1F", sub: "#A8762F" },
  { area: "contact", href: "/contact", label: "CONTACT", note: "Talk to us",       icon: <IconMail size={15} color="#1E5A2E" />,         bg: "#EAF4EA", border: "1px solid #C7DFC7",  ink: "#1B3A2D", sub: "#4A7C59" },
];

export default function NotFound() {
  return (
    <div className="scrap-paper" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
      {/* Bento collage — same asymmetric scrapbook grid as the home hero,
          so a dead URL still lands somewhere that looks like the site. */}
      <div className="nf-wrap" style={{ width: "100%", maxWidth: "1080px", margin: "0 auto", padding: "0 24px" }}>
        <div className="nf-bento">

          {/* OOPS tile — cream paper, handwritten headline, spans wide */}
          <div className="nf-tile nf-oops" style={{ background: "#F5F7EC", border: "1px dashed #C7D5C0" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "2px", color: "#4A7C59", marginBottom: "10px" }}>
                PAGE NOT FOUND
              </div>
              <div className="scrap-note" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "#1B3A2D", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
                Ay, wrong turn — this page isn&apos;t on the setlist.
              </div>
              <p style={{ fontFamily: B, fontSize: "13.5px", color: "#4A7C59", margin: "14px 0 0", lineHeight: 1.65, maxWidth: "460px" }}>
                The link may be old, or the page has moved. Everything else is still right where you left it.
              </p>
            </div>
          </div>

          {/* CODE tile — forest-green contrast, big cream number */}
          <div className="nf-tile nf-code" style={{ background: "#1B3A2D", color: "#F5F7EC" }}>
            <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "2px", color: "#B7CDB7", marginBottom: "8px" }}>
              ERROR CODE
            </div>
            <div style={{ fontFamily: S, fontSize: "clamp(3.2rem, 8vw, 5rem)", lineHeight: 0.95, letterSpacing: "-2px", color: "#F5F7EC" }}>
              404
            </div>
            <div style={{ fontFamily: H, fontSize: "1.35rem", color: "#B7CDB7", marginTop: "auto", paddingTop: "14px" }}>
              nawala ka yata ✦
            </div>
          </div>

          {/* LINK tiles — one per destination, each in its own color */}
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`nf-tile nf-link nf-${l.area}`} style={{ gridArea: l.area, background: l.bg, border: l.border, textDecoration: "none" }}>
              <span className="nf-link-icon" style={{ display: "inline-flex" }}>{l.icon}</span>
              <span className="nf-link-text">
                <span style={{ display: "block", fontFamily: SG, fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", color: l.ink }}>{l.label}</span>
                <span style={{ display: "block", fontFamily: B, fontSize: "12px", color: l.sub, marginTop: "4px" }}>{l.note}</span>
              </span>
            </Link>
          ))}

          {/* CTA strip — full width, same treatment as the home hero */}
          <div className="nf-tile nf-cta">
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
              <Link href="/" className="btn-fx btn-fx-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, background: "#1B3A2D", color: "#ffffff", padding: "14px 30px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px" }}>
                BACK TO HOME
              </Link>
              <Link href="/events" className="btn-fx btn-fx-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, color: "#1B3A2D", background: "#FFFFFF", border: "1.5px solid #1B3A2D", padding: "13px 28px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px", boxShadow: "0 2px 6px rgba(27,58,45,0.08)" }}>
                <IconCalendar size={14} /> SEE EVENTS
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .nf-bento {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-template-areas:
            "oops   oops  oops    code"
            "events shop  support contact"
            "cta    cta   cta     cta";
          gap: 16px;
        }
        .nf-tile {
          position: relative;
          border-radius: 18px;
          padding: 26px 24px;
          box-shadow: 0 6px 20px rgba(15,42,30,0.07);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          min-width: 0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .nf-tile:hover { transform: translateY(-3px) rotate(0deg) !important; box-shadow: 0 14px 30px rgba(15,42,30,0.11); }

        .nf-oops    { grid-area: oops; transform: rotate(-0.4deg); }
        .nf-code    { grid-area: code; transform: rotate(1.2deg); justify-content: space-between; }
        .nf-events  { transform: rotate(-1.6deg); }
        .nf-shop    { transform: rotate(0.8deg); }
        .nf-support { transform: rotate(-0.7deg); }
        .nf-contact { transform: rotate(1.4deg); }
        .nf-cta     { grid-area: cta; background: transparent; box-shadow: none; padding: 8px 0 0; justify-content: center; align-items: center; }
        .nf-cta:hover { transform: none !important; box-shadow: none !important; }

        /* Link tiles carry little copy — center it so they don't read
           as half-empty next to the content-heavy tiles. */
        .nf-link { justify-content: center; }
        .nf-link-icon { margin-bottom: 10px; }

        @media (prefers-reduced-motion: reduce) {
          .nf-tile { transform: none !important; }
        }

        /* Tablet — 2 col grid, straightened tiles, tighter padding */
        @media (max-width: 820px) {
          .nf-bento {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-areas:
              "oops    oops"
              "code    code"
              "events  shop"
              "support contact"
              "cta     cta";
            gap: 12px;
          }
          .nf-tile { padding: 22px 20px; border-radius: 16px; transform: none !important; }
          .nf-cta  { padding: 4px 0 0 !important; }
          .nf-cta > div { align-items: center !important; }
        }

        /* Phone — single-column stack, Colet centered above the copy */
        @media (max-width: 520px) {
          .nf-wrap { padding: 0 16px; }
          .nf-bento {
            grid-template-columns: 1fr !important;
            grid-template-areas:
              "oops"
              "code"
              "events"
              "shop"
              "support"
              "contact"
              "cta" !important;
            gap: 10px !important;
          }
          .nf-tile { padding: 18px 16px !important; border-radius: 14px !important; }
          /* Link tiles go horizontal so four of them don't turn the
             phone layout into a long scroll of near-empty cards. */
          .nf-link { flex-direction: row; align-items: center; justify-content: flex-start; gap: 12px; padding: 14px 16px !important; }
          .nf-link-icon { margin-bottom: 0; }
          .nf-oops .scrap-note { font-size: 1.7rem !important; }
          .nf-code > div:nth-of-type(2) { font-size: 3.2rem !important; }
          .nf-cta { padding: 0 !important; }
          /* nowrap matters: a column flex container that still wraps will
             spill the second button into a new column instead of stacking. */
          .nf-cta > div { flex-direction: column; flex-wrap: nowrap !important; gap: 10px !important; }
          .nf-cta > div > a { flex: 0 0 auto; width: 100%; justify-content: center; padding: 12px 22px !important; font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
}
