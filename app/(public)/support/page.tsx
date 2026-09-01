import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support" };
export const dynamic = "force-dynamic";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

export default function PublicSupportPage() {
  const { userId } = auth();

  const primaryHref  = userId ? "/members/support" : "/sign-in?redirect_url=/members/support";
  const primaryLabel = userId ? "OPEN A SUPPORT TICKET →" : "SIGN IN TO OPEN A TICKET →";

  return (
    <div style={{ background: "#FAF6EE", minHeight: "100vh", padding: "56px 20px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "28px" }}>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040", letterSpacing: "3px" }}>SUPPORT CENTER</div>
          <h1 style={{ fontFamily: R, fontSize: "2.4rem", color: "#1B3A2D", letterSpacing: "4px", margin: "8px 0 6px" }}>CONTACT US</h1>
          <p style={{ fontFamily: B, fontSize: "14px", color: "#4A7C59", maxWidth: "520px", margin: "0 auto" }}>
            We&apos;re here to help. Check the <Link href="/faq" style={{ color: "#1A8040", fontWeight: 600 }}>FAQ</Link> first — most questions are answered there.
          </p>
        </div>

        {/* Ticket CTA */}
        <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "16px", padding: "28px", textAlign: "center", boxShadow: "0 4px 16px rgba(27,58,45,0.05)" }}>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "2px" }}>MEMBERS</div>
          <h2 style={{ fontFamily: R, fontSize: "1.4rem", color: "#1B3A2D", letterSpacing: "2px", margin: "8px 0 6px" }}>SUPPORT TICKETS</h2>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#5A7A60", maxWidth: "460px", margin: "0 auto 18px", lineHeight: 1.6 }}>
            The fastest way to reach us. Submit a ticket and the CFS team will get back within one business day.
            {!userId && " Free to sign up."}
          </p>
          <Link href={primaryHref} style={{ textDecoration: "none", display: "inline-block" }}>
            <span style={{ display: "inline-block", fontFamily: R, fontSize: "13px", background: "#1A8040", color: "#FFFFFF", padding: "12px 26px", border: "2px solid #1B3A2D", borderRadius: "8px", letterSpacing: "1.5px" }}>
              {primaryLabel}
            </span>
          </Link>
        </div>

        {/* Alternate channels */}
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "2px" }}>OTHER WAYS TO REACH US</div>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", margin: 0, lineHeight: 1.7 }}>
            DM us on social — <strong>@coletfansuporta</strong> — or email <a href="mailto:hello@coletfs.com" style={{ color: "#1A8040", fontWeight: 600, textDecoration: "none" }}>hello@coletfs.com</a>. Signed-in members get faster replies through the ticket system above.
          </p>
        </div>

        <div style={{ textAlign: "center" }}>
          <Link href="/" style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.5px" }}>← BACK HOME</Link>
        </div>

      </div>
    </div>
  );
}
