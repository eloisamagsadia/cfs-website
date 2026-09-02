"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconTicket, IconCart, IconHeart, IconUser, IconShoppingBag } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Group = "nav" | "events" | "products" | "members" | "orders" | "donations";

interface Item {
  key: string;
  group: Group;
  title: string;
  subtitle?: string;
  href: string;
  icon?: React.ReactNode;
  accent?: string;
}

// Static nav shortcuts — surfaced when the query is empty or matches label
const NAV_LINKS: { title: string; href: string; keywords?: string }[] = [
  { title: "Dashboard",           href: "/admin",                    keywords: "home overview" },
  { title: "Events",              href: "/admin/events",             keywords: "concert meetup" },
  { title: "Event Waitlists",     href: "/admin/waitlist",           keywords: "queue" },
  { title: "Shop",                href: "/admin/shop",               keywords: "products merch" },
  { title: "Shop Stock",          href: "/admin/shop/stock",         keywords: "inventory low" },
  { title: "Orders",              href: "/admin/orders",             keywords: "sales" },
  { title: "Donations",           href: "/admin/donations",          keywords: "money" },
  { title: "Refunds",             href: "/admin/refunds",            keywords: "money back" },
  { title: "Members",             href: "/admin/members",            keywords: "users profiles" },
  { title: "Member Tags",         href: "/admin/tags",               keywords: "labels segments" },
  { title: "Community",           href: "/admin/community",          keywords: "posts" },
  { title: "Chat Mod",            href: "/admin/chat",               keywords: "dms messages" },
  { title: "Community Reports",   href: "/admin/community-reports",  keywords: "flagged" },
  { title: "Fan Letters",         href: "/admin/fan-letters",        keywords: "letters" },
  { title: "Fan Wall",            href: "/admin/events/fan-submissions", keywords: "submissions" },
  { title: "Polls",               href: "/admin/polls",              keywords: "vote survey" },
  { title: "FAQ",                 href: "/admin/faq",                keywords: "questions help" },
  { title: "Reports",             href: "/admin/reports",            keywords: "receipts" },
  { title: "Projects",            href: "/admin/projects",           keywords: "drives" },
  { title: "Check-In",            href: "/admin/check-in",           keywords: "qr scan" },
  { title: "Notifications",       href: "/admin/notifications",      keywords: "broadcast push" },
  { title: "Support",             href: "/admin/support",            keywords: "tickets help" },
  { title: "Contact Messages",    href: "/admin/contact",            keywords: "inquiries guest email" },
  { title: "Shipping",            href: "/admin/shipping",           keywords: "delivery track" },
  { title: "Emails",              href: "/admin/emails",             keywords: "resend templates" },
  { title: "Newsletter",          href: "/admin/newsletter",         keywords: "subscribers email list" },
  { title: "Promo Codes",         href: "/admin/codes",              keywords: "discount coupon" },
  { title: "Media Library",       href: "/admin/media",              keywords: "images r2 upload" },
  { title: "Super Admin",         href: "/super",                    keywords: "system" },
  { title: "Audit Log",           href: "/super/audit",              keywords: "history trail" },
  { title: "Analytics",           href: "/super/analytics",          keywords: "charts stats" },
  { title: "System Health",       href: "/super/system-health",      keywords: "diagnostics" },
];

const GROUP_LABEL: Record<Group, string> = {
  nav:       "PAGES",
  events:    "EVENTS",
  products:  "PRODUCTS",
  members:   "MEMBERS",
  orders:    "ORDERS",
  donations: "DONATIONS",
};

const GROUP_ORDER: Group[] = ["members", "events", "products", "orders", "donations", "nav"];

export default function CommandPalette() {
  const [open, setOpen]       = useState(false);
  const [q, setQ]             = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive]   = useState(0);
  const inputRef              = useRef<HTMLInputElement | null>(null);
  const router                = useRouter();

  // Cmd/Ctrl-K toggles the palette
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
        return;
      }
      if (e.key === "Escape") { setOpen(false); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) { setQ(""); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  // Nav filter for the current query
  const navItems: Item[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    return NAV_LINKS
      .filter(n => !term || n.title.toLowerCase().includes(term) || (n.keywords ?? "").includes(term))
      .slice(0, term ? 6 : 12)
      .map(n => ({ key: `nav:${n.href}`, group: "nav" as Group, title: n.title, subtitle: n.href, href: n.href, accent: "#4A7C59" }));
  }, [q]);

  // Debounced remote search
  useEffect(() => {
    const term = q.trim();
    if (!open) return;
    if (term.length < 2) {
      setResults(navItems);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/search?q=${encodeURIComponent(term)}`);
        const d = await r.json();

        const items: Item[] = [];
        for (const m of (d.members ?? []) as any[]) items.push({
          key: `member:${m.id}`, group: "members", title: m.display_name ?? m.email ?? m.id.slice(0, 8),
          subtitle: [m.email, m.role, m.is_banned && "BANNED"].filter(Boolean).join(" · "),
          href: `/admin/members/${m.id}/activity`,
          icon: <IconUser size={13} color="#1A8040" />,
          accent: "#1A8040",
        });
        for (const e of (d.events ?? []) as any[]) items.push({
          key: `event:${e.id}`, group: "events", title: e.title,
          subtitle: `${new Date(e.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })}${e.is_hidden ? " · HIDDEN" : ""}`,
          href: `/admin/events/${e.id}`,
          icon: <IconTicket size={13} color="#156530" />,
          accent: "#156530",
        });
        for (const p of (d.products ?? []) as any[]) items.push({
          key: `product:${p.id}`, group: "products", title: p.name,
          subtitle: `₱${Number(p.price).toLocaleString()} · ${p.stock > 0 ? `${p.stock} in stock` : "OUT"}`,
          href: `/admin/shop/${p.id}`,
          icon: <IconShoppingBag size={13} color="#7A5A0F" />,
          accent: "#7A5A0F",
        });
        for (const o of (d.orders ?? []) as any[]) items.push({
          key: `order:${o.id}`, group: "orders", title: `Order #${o.id.slice(0, 8).toUpperCase()}`,
          subtitle: `${o.profiles?.display_name ?? "?"} · ₱${Number(o.total).toLocaleString()} · ${o.payment_status?.toUpperCase() ?? ""}`,
          href: `/admin/orders/${o.id}`,
          icon: <IconCart size={13} color="#B78A1F" />,
          accent: "#B78A1F",
        });
        for (const dn of (d.donations ?? []) as any[]) items.push({
          key: `donation:${dn.id}`, group: "donations", title: `Donation #${dn.id.slice(0, 8).toUpperCase()}`,
          subtitle: `${dn.profiles?.display_name ?? "?"} · ₱${Number(dn.amount).toLocaleString()} · ${dn.status?.toUpperCase() ?? ""}`,
          href: `/admin/donations`,
          icon: <IconHeart size={13} color="#8A1E27" />,
          accent: "#8A1E27",
        });
        setResults([...items, ...navItems]);
      } finally { setLoading(false); }
    }, 180);
    return () => clearTimeout(t);
  }, [q, open, navItems]);

  const grouped = useMemo(() => {
    const g: Record<Group, Item[]> = { nav: [], events: [], products: [], members: [], orders: [], donations: [] };
    for (const r of results) g[r.group].push(r);
    return g;
  }, [results]);

  const flat = useMemo(() => GROUP_ORDER.flatMap(g => grouped[g]), [grouped]);
  useEffect(() => { setActive(0); }, [q, results]);

  function jump(item: Item) {
    setOpen(false);
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (flat[active]) jump(flat[active]); }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        title="Quick jump (⌘K)"
        style={{ position: "fixed", right: "18px", bottom: "18px", zIndex: 40, background: "#1B3A2D", color: "#ffffff", border: "none", borderRadius: "999px", padding: "12px 16px", fontFamily: SG, fontSize: "11px", fontWeight: 700, letterSpacing: "1.2px", boxShadow: "0 6px 14px rgba(0,0,0,0.15)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <span>SEARCH</span>
        <span style={{ fontFamily: SG, fontSize: "10px", background: "rgba(255,255,255,0.12)", borderRadius: "6px", padding: "2px 6px" }}>⌘K</span>
      </button>
    );
  }

  return (
    <div onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(20, 40, 30, 0.55)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: "min(640px, 92vw)", maxHeight: "68vh", background: "#ffffff", borderRadius: "16px", border: "1px solid #DDE8DD", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderBottom: "1px solid #F0F5F0" }}>
          <span style={{ fontFamily: SG, fontSize: "12px", color: "#5A7A60", letterSpacing: "1.5px" }}>⌘</span>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Search members, events, products, orders…"
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontFamily: B, fontSize: "15px", color: "#1B3A2D" }} />
          {loading && <span style={{ fontFamily: SG, fontSize: "10px", color: "#7A8E7A", letterSpacing: "1.3px" }}>…</span>}
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {flat.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>
              {q.trim().length < 2 ? "Type at least 2 characters." : "No matches."}
            </div>
          ) : (
            GROUP_ORDER.map(g => {
              const list = grouped[g];
              if (list.length === 0) return null;
              return (
                <div key={g}>
                  <div style={{ padding: "8px 16px 4px", fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.5px", background: "#F7FAF5" }}>{GROUP_LABEL[g]}</div>
                  {list.map(item => {
                    const idx = flat.indexOf(item);
                    const isActive = idx === active;
                    return (
                      <button key={item.key} onMouseEnter={() => setActive(idx)} onClick={() => jump(item)}
                        style={{ width: "100%", textAlign: "left" as const, display: "grid", gridTemplateColumns: "24px 1fr auto", gap: "10px", alignItems: "center", padding: "10px 16px", background: isActive ? "#F0F5F0" : "transparent", border: "none", cursor: "pointer", borderLeft: `3px solid ${isActive ? (item.accent ?? "#1A8040") : "transparent"}` }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          {item.icon ?? <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.accent ?? "#B7CDB7" }} />}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.title}</div>
                          {item.subtitle && <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.subtitle}</div>}
                        </div>
                        {isActive && <span style={{ fontFamily: SG, fontSize: "10px", color: "#5A7A60", letterSpacing: "1.2px" }}>↵</span>}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", background: "#FAFCF9", borderTop: "1px solid #F0F5F0", fontFamily: SG, fontSize: "10px", color: "#7A8E7A", letterSpacing: "1.2px" }}>
          <span>↑↓ navigate · ↵ open · esc close</span>
          <span>⌘K anywhere</span>
        </div>
      </div>
    </div>
  );
}
