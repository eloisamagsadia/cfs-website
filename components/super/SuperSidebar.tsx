"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const svg = (d: React.ReactNode) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const icons = {
  command:    svg(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>),
  analytics:  svg(<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>),
  health:     svg(<><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>),
  roles:      svg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  bulk:       svg(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11l-3 3"/><path d="M19 11l3 3"/></>),
  impersonate:svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></>),
  categories: svg(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>),
  donations:  svg(<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>),
  perks:      svg(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>),
  badges:     svg(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>),
  exclusive:  svg(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>),
  broadcast:  svg(<><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></>),
  finance:    svg(<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>),
  settings:   svg(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  audit:      svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></>),
  flags:      svg(<><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>),
  cleanup:    svg(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>),
  backup:     svg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>),
  danger:     svg(<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>),
  admin:      svg(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>),
  member:     svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
};

// Sidebar sections. Items flagged `owner` are only rendered when the
// current viewer is the site owner (hidden super admin). Other super
// admins never see them in the sidebar at all — the corresponding
// endpoints/pages also gate on owner, so no way to reach them by URL.
type SectionItem = { label: string; href: string; icon: React.ReactNode; exact?: boolean; owner?: boolean };

const sections: { label: string; items: SectionItem[] }[] = [
  {
    label: "COMMAND",
    items: [
      { label: "Command Center",  href: "/super",              icon: icons.command, exact: true },
      { label: "Launch Day",      href: "/super/launch",       icon: icons.command },
      { label: "Analytics",       href: "/super/analytics",    icon: icons.analytics },
      { label: "System Health",   href: "/super/system-health",icon: icons.health },
    ]
  },
  {
    label: "MEMBERS",
    items: [
      { label: "Role Management", href: "/super/roles",         icon: icons.roles },
      { label: "Bulk Members",    href: "/super/bulk-members",  icon: icons.bulk },
      { label: "Sign in as…",     href: "/super/impersonate",   icon: icons.impersonate, owner: true },
      { label: "Badges",          href: "/super/badges",        icon: icons.badges },
    ]
  },
  {
    label: "CONFIG",
    items: [
      { label: "Categories",      href: "/super/categories",    icon: icons.categories },
      { label: "Donation Drives", href: "/super/donation-drives", icon: icons.donations },
      { label: "Sponsor Perks",   href: "/super/sponsor-perks", icon: icons.perks },
      { label: "Site Settings",   href: "/super/settings",      icon: icons.settings },
      { label: "Feature Flags",   href: "/super/feature-flags", icon: icons.flags },
    ]
  },
  {
    label: "CONTENT",
    items: [
      { label: "Exclusive",       href: "/super/exclusive",     icon: icons.exclusive },
      { label: "Broadcast",       href: "/super/broadcast",     icon: icons.broadcast },
    ]
  },
  {
    label: "REVENUE",
    items: [
      { label: "Financials",      href: "/super/finance",       icon: icons.finance },
    ]
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Audit Log",       href: "/super/audit",         icon: icons.audit, owner: true },
      { label: "Pending Tickets", href: "/admin/tickets-cleanup", icon: icons.cleanup },
      { label: "Backup",          href: "/super/backup",        icon: icons.backup, owner: true },
      { label: "Danger Zone",     href: "/super/danger",        icon: icons.danger },
    ]
  },
];

function NavItem({ label, href, icon, exact }: { label: string; href: string; icon: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href);

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", position: "relative", background: isActive ? "#E8F4EC" : "transparent", transition: "background 0.15s" }}>
        {isActive && <div style={{ position: "absolute", left: 0, top: "20%", height: "60%", width: "3px", background: "#156530", borderRadius: "0 3px 3px 0" }} />}
        <span style={{ color: isActive ? "#156530" : "#5A7A60", transition: "color 0.15s" }}>{icon}</span>
        <span style={{ fontFamily: B, fontSize: "13px", color: isActive ? "#156530" : "#5A7A60", letterSpacing: "0.3px" }}>{label}</span>
      </div>
    </Link>
  );
}

export default function SuperSidebar({ isOwner = false }: { isOwner?: boolean }) {
  // Prune owner-only items when the viewer isn't the owner, and drop
  // whole sections that end up empty.
  const visibleSections = sections
    .map(s => ({ ...s, items: s.items.filter(i => !i.owner || isOwner) }))
    .filter(s => s.items.length > 0);

  return (
    <aside style={{ width: "210px", flexShrink: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "#E8F4EC", border: "1px solid #1A804020", borderRadius: "10px", marginBottom: "20px" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#156530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <div>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#156530", letterSpacing: "2px" }}>SUPER ADMIN</div>
          <div style={{ fontFamily: B, fontSize: "9px", color: "#5A7A60", marginTop: "1px" }}>Command Center</div>
        </div>
      </div>

      <nav style={{ position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "20px", maxHeight: "calc(100vh - 100px)", overflowY: "auto", paddingRight: "4px" }}>
        {visibleSections.map(section => (
          <div key={section.label}>
            <div style={{ fontFamily: R, fontSize: "9px", color: "#9AA870", letterSpacing: "2px", padding: "0 12px", marginBottom: "4px" }}>{section.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              {section.items.map(item => <NavItem key={item.href} {...item} />)}
            </div>
          </div>
        ))}

        <div style={{ borderTop: "1px solid #DDE8DD", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "1px" }}>
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px", background: "#E8F4EC", border: "1px solid #1A804030" }}>
              <span style={{ color: "#1A8040" }}>{icons.admin}</span>
              <span style={{ fontFamily: B, fontSize: "13px", color: "#1A8040" }}>Admin Panel</span>
            </div>
          </Link>
          <Link href="/members" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "8px" }}>
              <span style={{ color: "#9AA870" }}>{icons.member}</span>
              <span style={{ fontFamily: B, fontSize: "13px", color: "#9AA870" }}>Member Area</span>
            </div>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
