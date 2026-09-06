import Link from "next/link";
import NewsletterSignup from "@/components/shared/NewsletterSignup";

const R = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const H = "var(--font-caveat, cursive)";

const socials = [
  {
    label: "Twitter",
    href: "https://x.com/coletfansuporta",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    label: "Facebook",
    href: "https://facebook.com/coletfansuporta",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  },
  {
    label: "Instagram",
    href: "https://instagram.com/coletfansuporta",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>,
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@coletfansuporta",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  },
];

const linkGroups: { title: string; items: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    items: [
      { label: "Events",   href: "/events"   },
      { label: "Projects", href: "/projects" },
      { label: "Reports",  href: "/reports"  },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Join the fam", href: "/sign-up" },
      { label: "Sign in",      href: "/sign-in" },
      { label: "Contact",      href: "/contact" },
    ],
  },
  {
    title: "Info",
    items: [
      { label: "FAQ",   href: "/faq"   },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="scrap-paper" style={{ position: "relative", borderTop: "1px dashed #E4D8C4" }}>
      {/* soft warm-lamp glow in the corner */}
      <div className="scrap-glow" style={{ top: "-40px", left: "50%", transform: "translateX(-50%)", width: "700px", height: "300px", background: "radial-gradient(ellipse, rgba(255, 210, 130, 0.28), transparent 60%)" }} />

      <div style={{ position: "relative", maxWidth: "1180px", margin: "0 auto", padding: "56px 28px 28px" }}>

        {/* Top row: brand + tagline + newsletter */}
        <div className="footer-top" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "48px", alignItems: "start", marginBottom: "44px" }}>

          {/* Brand block */}
          <div>
            <div style={{ marginBottom: "14px" }}>
              <span className="scrap-tape scrap-tape-blue">the fan society</span>
            </div>
            <h2 style={{ fontFamily: S, fontSize: "clamp(2rem, 5vw, 2.8rem)", color: "#1B3A2D", margin: "0 0 8px", lineHeight: 1.05 }}>
              Colet Fan Suporta
            </h2>
            <p className="scrap-note" style={{ fontSize: "20px", color: "#8B5E1F", margin: "0 0 14px", lineHeight: 1.15 }}>
              @coletfansuporta
            </p>
            <p style={{ fontFamily: B, fontSize: "13px", color: "#5A4020", margin: 0, lineHeight: 1.7, maxWidth: "420px" }}>
              An Iu-ers home base. Buy tickets together, throw fan events, and cheer Colet on — from anywhere in the Philippines.
            </p>
          </div>

          {/* Newsletter */}
          <div>
            <div style={{ marginBottom: "10px" }}>
              <span className="scrap-tape scrap-tape-pink" style={{ transform: "rotate(1.5deg)" }}>stay in the loop</span>
            </div>
            <p className="scrap-note" style={{ fontSize: "18px", color: "#3A2A0F", margin: "0 0 14px", lineHeight: 1.25 }}>
              Get event drops + fan announcements straight to your inbox.
            </p>
            <NewsletterSignup source="footer" />
          </div>
        </div>

        {/* Middle row: link columns + socials */}
        <div className="footer-mid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr)) auto", gap: "32px", alignItems: "start", paddingTop: "32px", borderTop: "1px dashed #E4D8C4" }}>
          {linkGroups.map(group => (
            <div key={group.title}>
              <div className="scrap-note" style={{ fontSize: "18px", color: "#5A4020", marginBottom: "8px", lineHeight: 1 }}>
                {group.title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {group.items.map(({ label, href }) => (
                  <Link key={href} href={href} className="footer-link" style={{ fontFamily: B, fontSize: "13px", color: "#3A2A0F", textDecoration: "none", transition: "color 0.15s" }}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Socials — pinned right */}
          <div>
            <div className="scrap-note" style={{ fontSize: "18px", color: "#5A4020", marginBottom: "10px", lineHeight: 1 }}>
              Follow
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {socials.map(({ label, href, icon }) => (
                <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer" className="footer-social btn-fx" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 38, height: 38, borderRadius: "50%",
                  background: "#FFFFFF", border: "1.5px solid #E4D8C4",
                  color: "#5A4020", boxShadow: "0 2px 6px rgba(80,50,20,0.08)",
                }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: signed-note copyright */}
        <div style={{ marginTop: "36px", paddingTop: "20px", borderTop: "1px dashed #E4D8C4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ fontFamily: B, fontSize: "12px", color: "#7A6540" }}>
            © {new Date().getFullYear()} Colet Fan Suporta ✦ Built by Iu-ers, for Iu-ers.
          </span>
          <span className="scrap-note" style={{ fontSize: "18px", color: "#8B5E1F", transform: "rotate(-2deg)" }}>
            para kay Colet 🌱
          </span>
        </div>

      </div>

      <style>{`
        .footer-link:hover { color: #1A8040 !important; }
        .footer-social:hover { color: #1A8040 !important; border-color: #1A8040 !important; }
        @media (max-width: 820px) {
          .footer-top { grid-template-columns: 1fr !important; gap: 32px !important; }
          .footer-mid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
        }
        @media (max-width: 480px) {
          .footer-mid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
