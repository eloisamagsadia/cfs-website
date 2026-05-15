"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const icons = {
  dashboard:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  community:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  events:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  orders:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  cart:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  notifs:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  badges:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  codes:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  letters:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  exclusive:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  admin:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  signout:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const sections = [
  {
    label: "MAIN",
    items: [
      { label: "Dashboard",     href: "/members",               icon: icons.dashboard,  exact: true },
      { label: "Community",     href: "/members/community",     icon: icons.community },
      { label: "Letters",       href: "/members/letters",       icon: icons.letters },
    ]
  },
  {
    label: "MY STUFF",
    items: [
      { label: "My Events",     href: "/members/events",        icon: icons.events },
      { label: "My Orders",     href: "/members/orders",        icon: icons.orders },
      { label: "Cart",          href: "/members/cart",          icon: icons.cart },
      { label: "Badges",        href: "/members/badges",        icon: icons.badges },
      { label: "Codes",         href: "/members/codes",         icon: icons.codes },
    ]
  },
  {
    label: "ACCOUNT",
    items: [
      { label: "Notifications", href: "/members/notifications", icon: icons.notifs },
    ]
  },
];

function NavItem({ label, href, icon, exact }: { label: string; href: string; icon: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href);

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", position: "relative", background: isActive ? "linear-gradient(90deg, #1A3D14, #162212)" : "transparent", transition: "background 0.15s" }}>
        {isActive && <div style={{ position: "absolute", left: 0, top: "20%", height: "60%", width: "3px", background: "#3CCE2A", borderRadius: "0 3px 3px 0" }} />}
        <span style={{ color: isActive ? "#3CCE2A" : "#4A6A42", transition: "color 0.15s" }}>{icon}</span>
        <span style={{ fontFamily: B, fontSize: "13px", color: isActive ? "#D0E8C8" : "#4A6A42", letterSpacing: "0.3px", transition: "color 0.15s" }}>{label}</span>
      </div>
    </Link>
  );
}

export default function MembersSidebar({ isAdmin = false, role = "member" }: { isAdmin?: boolean; role?: string }) {
  const canSeeExclusive = ["sponsor", "admin", "super_admin"].includes(role);
  const router = useRouter();
  const { signOut } = useClerk();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <aside style={{ width: "210px", flexShrink: 0 }}>
      <nav style={{ position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {sections.map(section => (
          <div key={section.label}>
            <div style={{ fontFamily: R, fontSize: "9px", color: "#2C4820", letterSpacing: "2px", padding: "0 12px", marginBottom: "4px" }}>{section.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              {section.items.map(item => <NavItem key={item.href} {...item} />)}
            </div>
          </div>
        ))}

        {/* Exclusive — sponsors only */}
        {canSeeExclusive && (
          <div>
            <div style={{ fontFamily: R, fontSize: "9px", color: "#2C4820", letterSpacing: "2px", padding: "0 12px", marginBottom: "4px" }}>SPONSORS</div>
            <NavItem label="Exclusive" href="/members/exclusive" icon={icons.exclusive} />
          </div>
        )}

        {/* Bottom actions */}
        <div style={{ borderTop: "1px solid #1E3318", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "1px" }}>
          {isAdmin && (
            <Link href="/admin" style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", background: "#1A0E08", border: "1px solid #F07228" }}>
                <span style={{ color: "#F07228" }}>{icons.admin}</span>
                <span style={{ fontFamily: B, fontSize: "13px", color: "#F07228" }}>Admin Panel</span>
              </div>
            </Link>
          )}
          <button onClick={handleSignOut}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", background: "none", border: "none", cursor: "pointer", width: "100%" }}>
            <span style={{ color: "#3A5230" }}>{icons.signout}</span>
            <span style={{ fontFamily: B, fontSize: "13px", color: "#3A5230" }}>Sign Out</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
