"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const icons = {
  dashboard:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  events:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  shop:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  orders:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>,
  donations:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  members:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  community:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  fanwall:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 22H4a2 2 0 0 1-2-2V6"/><rect x="6" y="2" width="16" height="16" rx="2"/><circle cx="12" cy="8" r="1.5"/><path d="m22 13-3-3-8 8"/></svg>,
  checkin:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  notifs:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  support:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg>,
  shipping:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>,
  emails:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  projects:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  reports:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  codes:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/></svg>,
  media:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  exit:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  command:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  roles:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  audit:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
  broadcast:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>,
  finance:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  impersonate:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>,
  flags:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  settings:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  danger:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  exclusive:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  cleanup:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
};

const superItems = [
  { label: "Command Center", href: "/super",                   icon: icons.command, exact: true },
  { label: "Analytics",      href: "/super/analytics",         icon: icons.finance },
  { label: "Roles",          href: "/super/roles",             icon: icons.roles },
  { label: "Impersonate",    href: "/super/impersonate",       icon: icons.impersonate },
  { label: "Audit Log",      href: "/super/audit",             icon: icons.audit },
  { label: "Broadcast",      href: "/super/broadcast",         icon: icons.broadcast },
  { label: "Finance",        href: "/super/finance",           icon: icons.finance },
  { label: "Feature Flags",  href: "/super/feature-flags",     icon: icons.flags },
  { label: "Exclusives",     href: "/super/exclusive",         icon: icons.exclusive },
  { label: "Ticket Cleanup", href: "/super/tickets-cleanup",   icon: icons.cleanup },
  { label: "Site Settings",  href: "/super/settings",          icon: icons.settings },
  { label: "Danger Zone",    href: "/super/danger",            icon: icons.danger },
];

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
      { label: "Support",       href: "/admin/support",                icon: icons.support },
      { label: "Shipping",      href: "/admin/shipping",               icon: icons.shipping },
      { label: "Emails",        href: "/admin/emails",                 icon: icons.emails },
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

function SuperNavItem({ label, href, icon, exact }: { label: string; href: string; icon: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 10px", borderRadius: "7px", position: "relative", background: isActive ? "#FFF3D6" : "transparent", transition: "background 0.15s" }}>
        {isActive && <div style={{ position: "absolute", left: 0, top: "20%", height: "60%", width: "3px", background: "#B78A1F", borderRadius: "0 3px 3px 0" }} />}
        <span style={{ color: isActive ? "#7A5A0F" : "#B78A1F", transition: "color 0.15s" }}>{icon}</span>
        <span style={{ fontFamily: B, fontSize: "12px", color: isActive ? "#7A5A0F" : "#7A5A0F", letterSpacing: "0.3px" }}>{label}</span>
      </div>
    </Link>
  );
}

export default function AdminSidebar({ isSuper = false }: { isSuper?: boolean }) {
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

        {isSuper && (
          <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "10px", padding: "10px 6px 6px", marginTop: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: R, fontSize: "9px", color: "#B78A1F", letterSpacing: "2px", padding: "0 8px 6px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B78A1F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              SUPER ADMIN
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              {superItems.map(item => <SuperNavItem key={item.href} {...item} />)}
            </div>
          </div>
        )}

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
