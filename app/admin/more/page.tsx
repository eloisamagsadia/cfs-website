"use client";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const icons: Record<string, React.ReactNode> = {
  community:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  fanwall:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  projects:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  reports:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  checkin:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  notifs:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  codes:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/></svg>,
  media:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  exit:       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const sections = [
  {
    label: "CONTENT",
    items: [
      { label: "Community",    href: "/admin/community",              icon: icons.community },
      { label: "Fan Wall",     href: "/admin/events/fan-submissions", icon: icons.fanwall },
      { label: "Projects",     href: "/admin/projects",               icon: icons.projects },
      { label: "Reports",      href: "/admin/reports",                icon: icons.reports },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { label: "Check-In",     href: "/admin/check-in",               icon: icons.checkin },
      { label: "Notifications",href: "/admin/notifications",          icon: icons.notifs },
      { label: "Support",      href: "/admin/support",              icon: icons.notifs },
      { label: "Promo Codes",  href: "/admin/codes",                  icon: icons.codes },
      { label: "Media",        href: "/admin/media",                  icon: icons.media },
    ],
  },
  {
    label: "EXIT",
    items: [
      { label: "Back to Members", href: "/members",                   icon: icons.exit },
    ],
  },
];

export default function AdminMorePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>MORE</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>All admin tools</p>
      </div>

      {sections.map(section => (
        <div key={section.label}>
          <div style={{ fontFamily: R, fontSize: "10px", color: "#5A3A28", letterSpacing: "2px", marginBottom: "10px" }}>{section.label}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {section.items.map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "18px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "#F07228", flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6" }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
