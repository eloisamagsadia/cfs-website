"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const R = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const ICONS: Record<string, React.ReactNode> = {
  event_reminder:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  order_update:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  community_reply:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  community_mention: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>,
  badge_earned:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  new_follower:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>,
  donation_ack:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  new_report:        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  announcement:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  new_message:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  support_reply:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  default:           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};
const TC: Record<string, { color: string }> = {
  event_reminder:    { color: "#1A8040" },
  order_update:      { color: "#1A8040" },
  community_reply:   { color: "#156530" },
  community_mention: { color: "#156530" },
  badge_earned:      { color: "#1A8040" },
  new_follower:      { color: "#1A8040" },
  donation_ack:      { color: "#CC3344" },
  new_report:        { color: "#1A8040" },
  announcement:      { color: "#1A8040" },
  new_message:       { color: "#1A8040" },
  support_reply:     { color: "#1A8040" },
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell({ initialCount, userId }: { initialCount: number; userId: string }) {
  const [count, setCount] = useState(initialCount);
  const [open, setOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const swipeStart = useRef(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/notifications/count");
        const d = await res.json();
        const newCount = d.count ?? 0;
        if (newCount > count) {
          try {
            const ctx = new AudioContext();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = 520;
            g.gain.setValueAtTime(0.3, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.4);
          } catch {}
        }
        setCount(newCount);
      } catch {}
    }
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, [userId, count]);

  function toggleGroup(group: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  }

  async function loadNotifications() {
    setLoading(true);
    const res = await fetch("/api/notifications?unread=true");
    const d = await res.json();
    setNotifications(d.notifications ?? []);
    setLoading(false);
  }

  async function markRead(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setCount(c => Math.max(0, c - 1));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }

  async function markAllRead() {
    setNotifications([]);
    setCount(0);
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
  }

  async function handleView(notif: any) {
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setCount(c => Math.max(0, c - 1));
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: notif.id }) });
    if (notif.link) { setOpen(false); router.push(notif.link); }
  }

  function handleOpen() {
    setOpen(o => {
      if (!o) loadNotifications();
      return !o;
    });
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={handleOpen} style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", width: "34px", height: "34px", padding: 0 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2C10 2 6 3.5 6 9V14L4 16H16L14 14V9C14 3.5 10 2 10 2Z" stroke={count > 0 ? "#1B3A2D" : "#7A8E7A"} strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
          <path d="M8 16C8 17.1 8.9 18 10 18C11.1 18 12 17.1 12 16" stroke={count > 0 ? "#1B3A2D" : "#7A8E7A"} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
        {count > 0 && (
          <span style={{ position: "absolute", top: "0px", right: "0px", background: "#CC3344", border: "1.5px solid #fff", borderRadius: "20px", minWidth: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: R, fontSize: "9px", color: "#1B3A2D", padding: "0 3px" }}>
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: "fixed", top: "60px", right: "12px", left: "12px", width: "auto", maxWidth: "420px", marginLeft: "auto", background: "#FAFDF9", border: "1px solid #DDE8DD", borderRadius: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #DDE8DD", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
            <span style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "2px" }}>NOTIFICATIONS {count > 0 && <span style={{ color: "#CC3344" }}>({count})</span>}</span>
            {count > 0 && <button onClick={markAllRead} style={{ fontFamily: R, fontSize: "9px", color: "#4A7C59", background: "transparent", border: "none", cursor: "pointer", letterSpacing: "1px" }}>MARK ALL READ</button>}
          </div>

          {/* List */}
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "32px", textAlign: "center", fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔔</div>
                <div style={{ fontFamily: R, fontSize: "12px", color: "#7A8E7A", letterSpacing: "1px" }}>ALL CAUGHT UP</div>
              </div>
            ) : (() => {
              const TYPE_LABELS: Record<string,string> = {
                new_message: "Messages", community_reply: "Community", community_mention: "Community",
                new_follower: "Social", badge_earned: "Badges", event_reminder: "Events",
                order_update: "Orders", donation_ack: "Donations", announcement: "Announcements",
                support_reply: "Support", new_report: "Reports",
              };
              // Dedupe: keep only latest per link for messages and community
              const seen = new Set<string>();
              const hidden: string[] = [];
              const deduped = notifications.filter(n => {
                const dedupeTypes = ["new_message", "community_reply", "community_mention"];
                if (dedupeTypes.includes(n.type) && n.link) {
                  const key = `${n.type}:${n.link}`;
                  if (seen.has(key)) { if (!n.is_read) hidden.push(n.id); return false; }
                  seen.add(key);
                }
                return true;
              });
              // Mark hidden duplicates as read silently
              if (hidden.length) {
                hidden.forEach(id => fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }));
              }
              const groups: Record<string, any[]> = {};
              deduped.forEach(n => {
                const g = TYPE_LABELS[n.type] ?? "General";
                if (!groups[g]) groups[g] = [];
                groups[g].push(n);
              });
              return Object.keys(groups).sort().map(group => (
                <div key={group}>
                  <div onClick={() => toggleGroup(group)} style={{ padding: "8px 16px 4px", fontFamily: R, fontSize: "9px", color: "#7A8E7A", letterSpacing: "2px", background: "#F2F7F2", borderBottom: "1px solid #DDE8DD", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{group.toUpperCase()} ({groups[group].length})</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7A8E7A" strokeWidth="2" strokeLinecap="round"><polyline points={collapsedGroups.has(group) ? "6 9 12 15 18 9" : "18 15 12 9 6 15"}/></svg>
                  </div>
                  {!collapsedGroups.has(group) && groups[group].map(notif => {
                    const cfg = TC[notif.type] ?? { color: "#5A7A60" };
                    const icon = ICONS[notif.type] ?? ICONS.default;
                    return (
                      <div key={notif.id} style={{ position: "relative", overflow: "hidden" }}>
                        {/* Swipe delete bg */}
                        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "80px", background: "#CC3344", display: swipedId === notif.id && swipeX <= -40 ? "flex" : "none", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          onClick={() => { markRead(notif.id); setNotifications(prev => prev.filter(n => n.id !== notif.id)); }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </div>
                        <div onClick={() => handleView(notif)}
                          onTouchStart={e => { swipeStart.current = e.touches[0].clientX; setSwipedId(notif.id); setSwipeX(0); }}
                          onTouchMove={e => { const dx = e.touches[0].clientX - swipeStart.current; if (dx < 0) setSwipeX(Math.max(dx, -80)); }}
                          onTouchEnd={() => { if (swipeX < -40) setSwipeX(-80); else { setSwipeX(0); setSwipedId(null); } }}
                          style={{ padding: "10px 16px", borderBottom: "1px solid #EEF4EE", display: "flex", gap: "10px", alignItems: "flex-start", cursor: notif.link ? "pointer" : "default", background: notif.is_read ? "transparent" : "#F2F7F2", opacity: notif.is_read ? 0.7 : 1, transform: swipedId === notif.id ? `translateX(${swipeX}px)` : "translateX(0)", transition: swipedId === notif.id ? "none" : "transform 0.2s ease", position: "relative", zIndex: 1 }}
                          onMouseEnter={e => { if (notif.link) (e.currentTarget as HTMLDivElement).style.background = "#EEF4EE"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = notif.is_read ? "transparent" : "#F2F7F2"; }}>
                          {/* Avatar or icon */}
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: cfg.color + "20", border: `1.5px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: cfg.color, overflow: "hidden" }}>
                            {notif.image_url
                              ? <img src={notif.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "2px" }}>
                              <span style={{ fontFamily: R, fontSize: "11px", color: notif.is_read ? "#7A8E7A" : cfg.color, letterSpacing: "0.5px" }}>{notif.title}</span>
                              <span style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A", flexShrink: 0 }}>{timeAgo(notif.created_at)}</span>
                            </div>
                            <div style={{ fontFamily: B, fontSize: "11px", color: notif.is_read ? "#7A8E7A" : "#1B3A2D", lineHeight: 1.4 }}>{notif.message}</div>
                          </div>
                          {!notif.is_read && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.color, flexShrink: 0, marginTop: "4px" }} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
