import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import NotificationBell from "./NotificationBell";
import NavbarAvatar from "./NavbarAvatar";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const R = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const navLinks = [
  { label: "EVENTS",   href: "/events" },
  { label: "SHOP",     href: "/shop" },
  { label: "PROJECTS", href: "/projects" },
  { label: "REPORTS",  href: "/reports" },
  { label: "DONATE",   href: "/donate" },
];

const admin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function BellWithCount({ userId }: { userId: string }) {
  const supabase = admin();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return <NotificationBell initialCount={count ?? 0} userId={userId} />;
}

async function AvatarWithProfile({ userId, role }: { userId: string; role: string }) {
  const supabase = admin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", userId)
    .single();
  return (
    <NavbarAvatar
      userId={userId}
      displayName={profile?.display_name ?? "Member"}
      avatarUrl={profile?.avatar_url ?? null}
      role={role}
    />
  );
}

export default async function Navbar() {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role ?? "member";

  return (
    <>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(250,253,249,0.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid #DDE8DD" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 32px", maxWidth: "1320px", margin: "0 auto" }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none" }}>
            <img
              src="https://media.coletfs.com/assets/logo/cfs-logo.svg"
              alt="CFS Logo"
              style={{ height: "120px", width: "auto", display: "block", marginTop: "-15px", marginBottom: "-15px" }}
            />
          </Link>

          {/* Nav links */}
          <div className="nav-links" style={{ display: "flex", gap: "28px", alignItems: "center" }}>
            {navLinks.map(({ label, href }) => (
              <Link key={href} href={href} className="nav-link"
                style={{ fontFamily: R, fontSize: "11px", color: "#4A7C59", letterSpacing: "1.5px", textDecoration: "none", fontWeight: "500" }} className="nav-link-light">
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            {userId ? (
              <>
                <Suspense fallback={<div style={{ width: "34px", height: "34px" }} />}>
                  <BellWithCount userId={userId} />
                </Suspense>
                <Suspense fallback={<div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#FFFFFF", border: "1.5px solid #DDE8DD" }} />}>
                  <AvatarWithProfile userId={userId} role={role} />
                </Suspense>
              </>
            ) : (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Link href="/sign-in"
                  style={{ fontFamily: R, fontSize: "11px", color: "#4A7C59", letterSpacing: "1.5px", textDecoration: "none", fontWeight: "500" }} className="nav-link-light">
                  SIGN IN
                </Link>
                <Link href="/sign-up" style={{ textDecoration: "none" }}>
                  <div style={{ fontFamily: R, fontSize: "11px", background: "#1B3A2D", color: "#fff", padding: "8px 20px", borderRadius: "6px", letterSpacing: "1px", fontWeight: "700", fontSize: "11px" }}>
                    JOIN ✦
                  </div>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom accent line */}
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #DDE8DD 20%, #DDE8DD 80%, transparent)" }} />
      </header>
    </>
  );
}
