"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const icons: Record<string, React.ReactNode> = {
  letters:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  cart:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  badges:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  codes:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/></svg>,
  notifs:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  exclusive: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  account:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  signout:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  messages:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  orders:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  support:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  tickets:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg>,
};

const sections = [
  {
    label: "MY STUFF",
    items: [
      { label: "Cart",          href: "/members/cart",          icon: icons.cart },
      { label: "Badges",        href: "/members/badges",        icon: icons.badges },
      { label: "Promo Codes",   href: "/members/codes",         icon: icons.codes },
      { label: "Letters",       href: "/members/letters",       icon: icons.letters },
      { label: "Exclusive",     href: "/members/exclusive",     icon: icons.exclusive },
      { label: "My Orders",     href: "/members/orders",         icon: icons.orders },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { label: "Messages",      href: "/members/messages",      icon: icons.messages },
      { label: "My Account",    href: "/members/account",        icon: icons.account },
      { label: "Help & Support", href: "/members/support",       icon: icons.support },
    ],
  },
];

export default function MembersMorePage() {
  const router = useRouter();
  const { signOut } = useClerk();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>MORE</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Everything else</p>
      </div>

      {sections.map(section => (
        <div key={section.label}>
          <div style={{ fontFamily: R, fontSize: "10px", color: "#2C4820", letterSpacing: "2px", marginBottom: "10px" }}>{section.label}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {section.items.map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "18px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "#3CCE2A", flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6" }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Sign out */}
      <div>
        <div style={{ fontFamily: R, fontSize: "10px", color: "#2C4820", letterSpacing: "2px", marginBottom: "10px" }}>SESSION</div>
        <button onClick={handleSignOut}
          style={{ width: "100%", background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "18px 16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
          <span style={{ color: "#F04060", flexShrink: 0 }}>{icons.signout}</span>
          <span style={{ fontFamily: B, fontSize: "13px", color: "#F04060" }}>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
