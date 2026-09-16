import type { Metadata } from "next";
import Link from "next/link";
import ColetCharacter from "@/components/illustrations/ColetCharacter";
import { IconCalendar, IconShoppingBag, IconHeart, IconMail } from "@/components/shared/Icons";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "This page took a wrong turn. Head back to the CFS home page.",
};

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

// Same pastel scrapbook palette as the home hero bento — cream paper,
// pink, amber, mint — so a wrong URL still looks like the same website.
const quickLinks = [
  { href: "/events",  label: "Events",  note: "What's coming up", icon: <IconCalendar size={16} color="#1A6E0E" />,  bg: "#F5F7EC", border: "1px dashed #C7D5C0", ink: "#1B3A2D", sub: "#4A7C59", tilt: "-1.4deg" },
  { href: "/shop",    label: "Shop",    note: "Merch & bundles",  icon: <IconShoppingBag size={16} color="#B85268" />, bg: "#FDE9EC", border: "1px solid #F3C4CC",  ink: "#8A2E45", sub: "#B85268", tilt: "1deg"    },
  { href: "/support", label: "Support", note: "Help the cause",   icon: <IconHeart size={16} color="#8B5E1F" />,       bg: "#FFF3D6", border: "1px solid #F0C48A",  ink: "#8B5E1F", sub: "#A8762F", tilt: "-0.7deg" },
  { href: "/contact", label: "Contact", note: "Talk to us",       icon: <IconMail size={16} color="#1E5A2E" />,        bg: "#EAF4EA", border: "1px solid #C7DFC7",  ink: "#1B3A2D", sub: "#4A7C59", tilt: "1.3deg"  },
];

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAFDF9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 24px", position: "relative", overflow: "hidden" }}>
      {/* Soft radial glow behind the whole composition */}
      <div aria-hidden style={{ position: "absolute", top: "36%", left: "50%", transform: "translate(-50%, -50%)", width: "780px", height: "780px", background: "radial-gradient(circle, #E4F0E4 0%, transparent 65%)", pointerEvents: "none" }} />

      {/* Concentric rings — same motif as the maintenance screen */}
      {[560, 400, 260].map((size) => (
        <div key={size} aria-hidden style={{ position: "absolute", top: "36%", left: "50%", transform: "translate(-50%, -50%)", width: `${size}px`, height: `${size}px`, borderRadius: "50%", border: "1px solid #DDE8DD", pointerEvents: "none" }} />
      ))}

      <div style={{ position: "relative", width: "100%", maxWidth: "640px", textAlign: "center" }}>
        {/* Eyebrow */}
        <div style={{ display: "inline-block", fontFamily: B, fontSize: "10px", color: "#4A7C59", letterSpacing: "3px", textTransform: "uppercase", border: "1px solid #DDE8DD", borderRadius: "20px", padding: "5px 18px", background: "#F2F7F2", marginBottom: "24px" }}>
          Error 404
        </div>

        {/* The number, with Colet standing in place of the zero */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", marginBottom: "2px" }}>
          <span className="nf-digit" style={{ fontFamily: S, fontSize: "clamp(5.5rem, 23vw, 10.5rem)", color: "#1B3A2D", lineHeight: 0.9, letterSpacing: "-4px" }}>4</span>
          <span className="nf-coco" style={{ display: "inline-flex", alignItems: "flex-end", margin: "0 -4px 4px" }}>
            <ColetCharacter height={156} />
          </span>
          <span className="nf-digit" style={{ fontFamily: S, fontSize: "clamp(5.5rem, 23vw, 10.5rem)", color: "#1B3A2D", lineHeight: 0.9, letterSpacing: "-4px" }}>4</span>
        </div>

        {/* Handwritten aside on the site's underline-tape treatment */}
        <div style={{ marginBottom: "20px" }}>
          <span className="scrap-tape scrap-tape-mint" style={{ fontSize: "clamp(1.25rem, 5vw, 1.7rem)" }}>
            ay, wrong turn!
          </span>
        </div>

        <h1 style={{ fontFamily: S, fontSize: "clamp(1.6rem, 6vw, 2.4rem)", color: "#1B3A2D", margin: "0 0 12px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
          This page isn&apos;t on the setlist.
        </h1>

        <p style={{ fontFamily: B, fontSize: "14px", color: "#7A8E7A", margin: "0 auto 30px", maxWidth: "400px", lineHeight: 1.8 }}>
          The link may be old, or the page has moved. Everything else is still
          right where you left it.
        </p>

        {/* Primary actions — site-standard button treatments */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", marginBottom: "42px" }}>
          <Link href="/" className="btn-fx btn-fx-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, color: "#FFFFFF", background: "#1B3A2D", padding: "14px 30px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px" }}>
            BACK TO HOME
          </Link>
          <Link href="/events" className="btn-fx btn-fx-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, color: "#1B3A2D", background: "#FFFFFF", border: "1.5px solid #1B3A2D", padding: "13px 28px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px", boxShadow: "0 2px 6px rgba(27,58,45,0.08)" }}>
            <IconCalendar size={14} /> SEE EVENTS
          </Link>
        </div>

        <p style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 16px" }}>
          Or try one of these
        </p>

        {/* Tilted pastel tiles, same family as the home hero bento */}
        <div className="nf-links">
          {quickLinks.map((l) => (
            <Link key={l.href} href={l.href} className="nf-tile" style={{ transform: `rotate(${l.tilt})`, background: l.bg, border: l.border, borderRadius: "14px", padding: "16px 12px", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", boxShadow: "0 4px 14px rgba(15,42,30,0.06)" }}>
              <span style={{ display: "inline-flex" }}>{l.icon}</span>
              <span style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, letterSpacing: "1px", color: l.ink }}>{l.label}</span>
              <span style={{ fontFamily: B, fontSize: "11px", color: l.sub }}>{l.note}</span>
            </Link>
          ))}
        </div>

        <p style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1.5px", marginTop: "34px" }}>
          COLET FAN SUPORTA
        </p>
      </div>

      <style>{`
        .nf-links {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .nf-tile {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .nf-tile:hover {
          transform: translateY(-4px) rotate(0deg) !important;
          box-shadow: 0 10px 24px rgba(15,42,30,0.13);
        }
        @media (max-width: 560px) {
          .nf-links { grid-template-columns: repeat(2, 1fr); }
          .nf-coco svg { height: 108px; width: auto; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nf-tile { transform: none !important; }
          .nf-coco svg { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
