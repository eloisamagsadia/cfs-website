import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

// Site-wide maintenance gate. When site_settings.maintenance_mode is on:
//   - admins + super admins bypass and see the normal site (with a
//     yellow strip up top so they know maintenance is active)
//   - everyone else (members + anon) sees a "we'll be back soon" page
//
// Wrap the root <body> children in this. Fails open — if settings can't
// be read, the gate does nothing (better than locking everyone out).
export default async function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  if (!settings?.maintenance_mode) return <>{children}</>;

  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role ?? "";
  const isPrivileged = role === "admin" || role === "super_admin";

  if (isPrivileged) {
    return (
      <>
        <div style={{ background: "#FFF3D6", borderBottom: "2px solid #B78A1F", padding: "8px 16px", textAlign: "center" }}>
          <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#7A5A0F", letterSpacing: "1.5px" }}>
            ⚠ MAINTENANCE MODE ACTIVE · Members and visitors see the "back soon" page. You (admin) can continue working.
          </span>
          {" "}
          <Link href="/super/settings" style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#7A5A0F", letterSpacing: "1.5px", textDecoration: "underline" }}>
            TURN OFF →
          </Link>
        </div>
        {children}
      </>
    );
  }

  const custom = settings?.announcement_text?.trim();

  return (
    <div style={{ minHeight: "100vh", background: "#FAFDF9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" }}>
      <div style={{ maxWidth: "520px", background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "18px", padding: "40px 32px", boxShadow: "0 6px 24px rgba(27,58,45,0.06)" }}>
        <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040", letterSpacing: "3px", marginBottom: "8px" }}>CFS · COLET FAN SUPORTA</div>
        <h1 style={{ fontFamily: R, fontSize: "2rem", color: "#1B3A2D", letterSpacing: "3px", margin: "8px 0 12px" }}>WE&apos;LL BE BACK SOON</h1>
        <p style={{ fontFamily: B, fontSize: "14px", color: "#4A7C59", lineHeight: 1.6, margin: 0 }}>
          {custom ?? "The site is briefly down for maintenance. Thanks for your patience — check back in a few minutes."}
        </p>
        <div style={{ marginTop: "24px", fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>
          Follow us on socials for updates · <strong style={{ color: "#1A8040" }}>@coletfansuporta</strong>
        </div>
      </div>
    </div>
  );
}
