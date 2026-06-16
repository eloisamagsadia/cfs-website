"use client";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const icons: Record<string, React.ReactNode> = {
  audit:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  exclusive: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  danger:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

const sections = [
  {
    label: "SYSTEM",
    items: [
      { label: "Audit Log",   href: "/super/audit",     icon: icons.audit,     color: "#156530" },
      { label: "Exclusive",   href: "/super/exclusive", icon: icons.exclusive, color: "#156530" },
      { label: "Danger Zone", href: "/super/danger",    icon: icons.danger,    color: "#CC3344" },
    ],
  },
];

export default function SuperMorePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>MORE</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Additional super admin tools</p>
      </div>

      {sections.map(section => (
        <div key={section.label}>
          <div style={{ fontFamily: R, fontSize: "10px", color: "#5A7A60", letterSpacing: "2px", marginBottom: "10px" }}>{section.label}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {section.items.map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{ background: "#1A1400", border: `2px solid ${item.color}30`, borderRadius: "12px", padding: "18px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: item.color, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D" }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
