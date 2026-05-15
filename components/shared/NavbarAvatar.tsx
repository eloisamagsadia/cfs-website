"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const ROLE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  super_admin: { label: "⚡ SUPER ADMIN", color: "#F5C82A", bg: "#3D3000" },
  admin:       { label: "ADMIN",          color: "#F07228", bg: "#3D1A0A" },
  moderator:   { label: "MOD",            color: "#69C9D0", bg: "#0A2A2A" },
  sponsor:     { label: "✦ SPONSOR",      color: "#B47FE3", bg: "#2A1A3D" },
  member:      { label: "MEMBER",         color: "#3CCE2A", bg: "#1A3D14" },
};

const icons = {
  dashboard: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  events: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  orders: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  profile: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  settings: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  admin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  super: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  help: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  signout: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

interface NavbarAvatarProps {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
}

export default function NavbarAvatar({ userId, displayName, avatarUrl, role }: NavbarAvatarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { signOut } = useClerk();

  const badge = ROLE_BADGES[role] ?? ROLE_BADGES.member;
  const isAdmin = ["admin", "super_admin"].includes(role);
  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
  }

  const menuItems = [
    { label: "Dashboard",  href: "/members",               icon: icons.dashboard },
    { label: "My Events",  href: "/members/events",        icon: icons.events },
    { label: "My Orders",  href: "/members/orders",        icon: icons.orders },
    { label: "Profile",    href: "/members/account/profile", icon: icons.profile },
    { label: "Settings",   href: "/members/account/settings", icon: icons.settings },
    { label: "Help & Support", href: "/members/support", icon: icons.help },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(p => !p)}
        style={{ background: "none", border: `2px solid ${open ? badge.color : "#2C4820"}`, borderRadius: "50%", padding: "2px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "38px", height: "38px", transition: "border-color 0.15s" }}>
        {avatarUrl
          ? <img src={avatarUrl} alt="" style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" }} />
          : <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: badge.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: R, fontSize: "13px", color: badge.color }}>{(displayName ?? "M")[0].toUpperCase()}</span>
            </div>
        }
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, background: "#111A0F", border: "1.5px solid #2C4820", borderRadius: "14px", padding: "6px", zIndex: 100, minWidth: "210px", boxShadow: "0 12px 40px rgba(0,0,0,0.7)" }}>

          {/* Profile header */}
          <div style={{ padding: "10px 12px 12px", borderBottom: "1px solid #2C4820", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${badge.color}`, flexShrink: 0 }} />
              : <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: badge.bg, border: `2px solid ${badge.color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: R, fontSize: "15px", color: badge.color }}>{(displayName ?? "M")[0].toUpperCase()}</span>
                </div>
            }
            <div>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", letterSpacing: "0.5px", marginBottom: "4px" }}>{displayName}</div>
              <span style={{ fontFamily: R, fontSize: "9px", color: badge.color, background: badge.bg, borderRadius: "4px", padding: "2px 7px", letterSpacing: "1.5px" }}>{badge.label}</span>
            </div>
          </div>

          {/* Menu items */}
          {menuItems.map(({ label, href, icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", textDecoration: "none", color: "#B0C4A8" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#1A2614"; e.currentTarget.style.color = "#F0EAD6"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#B0C4A8"; }}>
              <span style={{ opacity: 0.7 }}>{icon}</span>
              <span style={{ fontFamily: B, fontSize: "13px" }}>{label}</span>
            </Link>
          ))}

          <div style={{ height: "1px", background: "#2C4820", margin: "4px 0" }} />

          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", textDecoration: "none", color: "#F07228" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#3D1A0A"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              <span>{icons.admin}</span>
              <span style={{ fontFamily: B, fontSize: "13px" }}>Admin Panel</span>
            </Link>
          )}

          {isSuperAdmin && (
            <Link href="/super" onClick={() => setOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", textDecoration: "none", color: "#F5C82A" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#3D3000"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              <span>{icons.super}</span>
              <span style={{ fontFamily: B, fontSize: "13px" }}>Super Admin</span>
            </Link>
          )}

          <div style={{ height: "1px", background: "#2C4820", margin: "4px 0" }} />

          <button onClick={handleSignOut}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", background: "none", border: "none", cursor: "pointer", color: "#F04060", textAlign: "left" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#3D0A14"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
            <span>{icons.signout}</span>
            <span style={{ fontFamily: B, fontSize: "13px" }}>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
