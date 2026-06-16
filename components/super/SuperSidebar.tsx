"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const icons = {
  command:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  roles:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  exclusive:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  broadcast:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.83a16 16 0 0 0 6.29 6.29l1.65-1.65a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  settings:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  audit:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  danger:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  admin:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  member:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

const sections = [
  {
    label: "COMMAND",
    items: [
      { label: "Command Center",  href: "/super",            icon: icons.command,   exact: true },
      { label: "Role Management", href: "/super/roles",      icon: icons.roles },
    ]
  },
  {
    label: "CONTENT",
    items: [
      { label: "Exclusive",       href: "/super/exclusive",  icon: icons.exclusive },
      { label: "Broadcast",       href: "/super/broadcast",  icon: icons.broadcast },
    ]
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Site Settings",   href: "/super/settings",   icon: icons.settings },
      { label: "Audit Log",       href: "/super/audit",      icon: icons.audit },
      { label: "Danger Zone",     href: "/super/danger",     icon: icons.danger },
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

export default function SuperSidebar() {
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

      <nav style={{ position: "sticky", top: "80px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {sections.map(section => (
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
