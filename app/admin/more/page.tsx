import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

type Item = { label: string; href: string; icon: React.ReactNode };
type Section = { label: string; items: Item[]; accent?: "green" | "amber" };

const svg = (d: React.ReactNode) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;

const icons = {
  dashboard:  svg(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>),
  events:     svg(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  shop:       svg(<><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>),
  orders:     svg(<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></>),
  donations:  svg(<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>),
  members:    svg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  community:  svg(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>),
  fanwall:    svg(<><path d="M18 22H4a2 2 0 0 1-2-2V6"/><rect x="6" y="2" width="16" height="16" rx="2"/><circle cx="12" cy="8" r="1.5"/><path d="m22 13-3-3-8 8"/></>),
  projects:   svg(<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>),
  reports:    svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>),
  checkin:    svg(<><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>),
  notifs:     svg(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>),
  support:    svg(<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></>),
  shipping:   svg(<><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></>),
  emails:     svg(<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>),
  codes:      svg(<><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/></>),
  media:      svg(<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>),
  exit:       svg(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>),

  command:    svg(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>),
  analytics:  svg(<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>),
  health:     svg(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>),
  categories: svg(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>),
  perks:      svg(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>),
  badges:     svg(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>),
  backup:     svg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>),
  roles:      svg(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>),
  impersonate:svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></>),
  audit:      svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></>),
  broadcast:  svg(<><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></>),
  finance:    svg(<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>),
  flags:      svg(<><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></>),
  exclusive:  svg(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>),
  cleanup:    svg(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>),
  settings:   svg(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  danger:     svg(<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>),
  bulk:       svg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  refunds:    svg(<><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 3 3 9 9 9"/></>),
};

const adminSections: Section[] = [
  {
    label: "OVERVIEW",
    items: [{ label: "Dashboard", href: "/admin", icon: icons.dashboard }],
  },
  {
    label: "MANAGE",
    items: [
      { label: "Events",    href: "/admin/events",    icon: icons.events },
      { label: "Waitlist",  href: "/admin/waitlist",  icon: icons.members },
      { label: "Shop",      href: "/admin/shop",      icon: icons.shop },
      { label: "Orders",    href: "/admin/orders",    icon: icons.orders },
      { label: "Donations", href: "/admin/donations", icon: icons.donations },
      { label: "Refunds",   href: "/admin/refunds",   icon: icons.refunds },
      { label: "Members",   href: "/admin/members",   icon: icons.members },
      { label: "Member Tags", href: "/admin/tags",    icon: icons.codes },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { label: "Community",     href: "/admin/community",              icon: icons.community },
      { label: "Chat Mod",      href: "/admin/chat",                   icon: icons.community },
      { label: "Reports Queue", href: "/admin/community-reports",      icon: icons.support },
      { label: "Fan Letters",   href: "/admin/fan-letters",            icon: icons.emails },
      { label: "Fan Wall",      href: "/admin/events/fan-submissions", icon: icons.fanwall },
      { label: "Projects",      href: "/admin/projects",               icon: icons.projects },
      { label: "Reports",       href: "/admin/reports",                icon: icons.reports },
      { label: "FAQ",           href: "/admin/faq",                    icon: icons.support },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { label: "Check-In",      href: "/admin/check-in",     icon: icons.checkin },
      { label: "Notifications", href: "/admin/notifications",icon: icons.notifs },
      { label: "Support",       href: "/admin/support",      icon: icons.support },
      { label: "Shipping",      href: "/admin/shipping",     icon: icons.shipping },
      { label: "Emails",        href: "/admin/emails",       icon: icons.emails },
      { label: "Promo Codes",   href: "/admin/codes",        icon: icons.codes },
      { label: "Media",         href: "/admin/media",        icon: icons.media },
    ],
  },
];

const exitSection: Section = {
  label: "EXIT",
  items: [{ label: "Back to Members", href: "/members", icon: icons.exit }],
};

export default function AdminMorePage() {
  const sections: Section[] = [
    ...adminSections,
    exitSection,
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>MORE</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>All admin tools</p>
      </div>

      {sections.map(section => {
        const isSuperBlock = section.accent === "amber";
        return (
          <div key={section.label} style={isSuperBlock ? { background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "14px", padding: "14px 12px" } : undefined}>
            <div style={{ fontFamily: R, fontSize: "10px", color: isSuperBlock ? "#B78A1F" : "#5A7A60", letterSpacing: "2px", marginBottom: "10px", paddingLeft: isSuperBlock ? "4px" : 0 }}>{section.label}</div>
            <div className="stack-md" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {section.items.map(item => (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#FFFFFF", border: isSuperBlock ? "1.5px solid #F0D889" : "2px solid #DDE8DD", borderRadius: "12px", padding: "16px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ color: isSuperBlock ? "#B78A1F" : "#1A8040", flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D" }}>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
