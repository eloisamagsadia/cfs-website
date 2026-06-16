"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const icons = {
  dashboard:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  events:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  shop:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  orders:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  donations:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  members:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  community:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  fanwall:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  checkin:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  notifs:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  projects:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  reports:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  codes:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/></svg>,
  media:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  exit:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const sections = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard",     href: "/admin",                        icon: icons.dashboard, exact: true },
    ]
  },
  {
    label: "MANAGE",
    items: [
      { label: "Events",        href: "/admin/events",                 icon: icons.events },
      { label: "Shop",          href: "/admin/shop",                   icon: icons.shop },
      { label: "Orders",        href: "/admin/orders",                 icon: icons.orders },
      { label: "Donations",     href: "/admin/donations",              icon: icons.donations },
      { label: "Members",       href: "/admin/members",                icon: icons.members },
    ]
  },
  {
    label: "CONTENT",
    items: [
      { label: "Community",     href: "/admin/community",              icon: icons.community },
      { label: "Fan Wall",      href: "/admin/events/fan-submissions", icon: icons.fanwall },
      { label: "Projects",      href: "/admin/projects",               icon: icons.projects },
      { label: "Reports",       href: "/admin/reports",                icon: icons.reports },
    ]
  },
  {
    label: "TOOLS",
    items: [
      { label: "Check-In",      href: "/admin/check-in",               icon: icons.checkin },
      { label: "Notifications", href: "/admin/notifications",          icon: icons.notifs },
      { label: "Support",       href: "/admin/support",              icon: icons.notifs },
      { label: "Shipping",      href: "/admin/shipping",             icon: icons.orders },
      { label: "Email",         href: "/admin/email",                icon: icons.notifs },
      { label: "Promo Codes",   href: "/admin/codes",                  icon: icons.codes },
      { label: "Media",         href: "/admin/media",                  icon: icons.media },
    ]
  },
];

function NavItem({ label, href, icon, exact }: { label: string; href: string; icon: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href);

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", position: "relative", background: isActive ? "#E8F4EC" : "transparent", transition: "background 0.15s" }}>
        {isActive && <div style={{ position: "absolute", left: 0, top: "20%", height: "60%", width: "3px", background: "#1A8040", borderRadius: "0 3px 3px 0" }} />}
        <span style={{ color: isActive ? "#1A8040" : "#5A7A60", transition: "color 0.15s" }}>{icon}</span>
        <span style={{ fontFamily: B, fontSize: "13px", color: isActive ? "#1B5030" : "#5A7A60", letterSpacing: "0.3px" }}>{label}</span>
      </div>
    </Link>
  );
}

export default function AdminSidebar() {
  return (
    <aside style={{ width: "210px", flexShrink: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "#E8F4EC", border: "1px solid #1A804040", borderRadius: "10px", marginBottom: "20px" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A8040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span style={{ fontFamily: R, fontSize: "11px", color: "#1A8040", letterSpacing: "2px" }}>ADMIN PANEL</span>
      </div>

      <nav style={{ position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {sections.map(section => (
          <div key={section.label}>
            <div style={{ fontFamily: R, fontSize: "9px", color: "#9AA899", letterSpacing: "2px", padding: "0 12px", marginBottom: "4px" }}>{section.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              {section.items.map(item => <NavItem key={item.href} {...item} />)}
            </div>
          </div>
        ))}

        <div style={{ borderTop: "1px solid #DDE8DD", paddingTop: "12px" }}>
          <Link href="/members" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px" }}>
              <span style={{ color: "#5A7A60" }}>{icons.exit}</span>
              <span style={{ fontFamily: B, fontSize: "13px", color: "#5A7A60" }}>Exit Admin</span>
            </div>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
