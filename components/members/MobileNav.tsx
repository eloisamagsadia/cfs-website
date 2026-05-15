"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";

const tabs = [
  {
    label: "Home",
    href: "/members",
    exact: true,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    label: "Community",
    href: "/members/community",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    label: "Events",
    href: "/members/events",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    label: "Orders",
    href: "/members/orders",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  },
  {
    label: "More",
    href: "/members/more",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: "#0A1008", backdropFilter: "blur(12px)", borderTop: "1px solid #1E3318", padding: "8px 0 calc(8px + env(safe-area-inset-bottom))", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
      {tabs.map(({ label, href, icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "4px 12px", borderRadius: "10px", background: isActive ? "#1A3D14" : "transparent", transition: "background 0.15s" }}>
            <span style={{ color: isActive ? "#3CCE2A" : "#3A5230" }}>{icon}</span>
            <span style={{ fontFamily: R, fontSize: "9px", color: isActive ? "#3CCE2A" : "#3A5230", letterSpacing: "1px" }}>{label.toUpperCase()}</span>
          </Link>
        );
      })}
    </nav>
  );
}
