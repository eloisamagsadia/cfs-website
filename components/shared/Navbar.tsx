import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import NotificationBell from "./NotificationBell";
import NavbarAvatar from "./NavbarAvatar";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const R = "var(--font-righteous,'Righteous',sans-serif)";
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
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(15,26,11,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1E3318" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 32px", maxWidth: "1320px", margin: "0 auto" }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none" }} className="cfs-logo">
            <div className="cfs-logo-inner" style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0F1A0B", border: "1.5px solid #2C4820", borderRadius: "10px", padding: "6px 16px", transition: "border-color 0.2s" }}>
              <svg width="12" height="12" viewBox="0 0 10 10">
                <path d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z" fill="#F5C82A"/>
              </svg>
              <span style={{ fontFamily: R, fontSize: "17px", color: "#3CCE2A", letterSpacing: "3px" }}>CFS</span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="nav-links" style={{ display: "flex", gap: "28px", alignItems: "center" }}>
            {navLinks.map(({ label, href }) => (
              <Link key={href} href={href} className="nav-link"
                style={{ fontFamily: R, fontSize: "11px", color: "#6A8A60", letterSpacing: "2px", textDecoration: "none" }}>
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
                <Suspense fallback={<div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#1A2614", border: "1.5px solid #2C4820" }} />}>
                  <AvatarWithProfile userId={userId} role={role} />
                </Suspense>
              </>
            ) : (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <Link href="/sign-in"
                  style={{ fontFamily: R, fontSize: "11px", color: "#6A8A60", letterSpacing: "2px", textDecoration: "none" }}>
                  SIGN IN
                </Link>
                <Link href="/sign-up" style={{ textDecoration: "none" }}>
                  <div style={{ fontFamily: R, fontSize: "11px", background: "#F5C82A", color: "#080F06", padding: "7px 18px", borderRadius: "8px", letterSpacing: "2px" }}>
                    JOIN ✦
                  </div>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom accent line */}
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #2C4820 20%, #2C4820 80%, transparent)" }} />
      </header>
    </>
  );
}
