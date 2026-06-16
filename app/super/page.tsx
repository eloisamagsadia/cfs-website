import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const revalidate = 0;


const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default async function SuperCommandCenter() {
  const db = createAdminClient();

  const [
    { count: total_members },
    { count: sponsors },
    { count: admins },
    { count: moderators },
    { count: total_posts },
    { count: total_tickets },
    { count: total_events },
    { count: exclusive_content },
  ] = await Promise.all([
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "sponsor"),
    db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
    db.from("profiles").select("*", { count: "exact", head: true }).eq("role", "moderator"),
    db.from("community_posts").select("*", { count: "exact", head: true }).eq("is_hidden", false),
    (db as any).from("event_tickets").select("*", { count: "exact", head: true }),
    (db as any).from("events").select("*", { count: "exact", head: true }),
    (db as any).from("exclusive_content").select("*", { count: "exact", head: true }),
  ]);

  const { data: settings } = await (db as any).from("site_settings").select("*").single();
  const { data: sponsorPerks } = await (db as any).from("sponsor_perks").select("*").single();

  const stats = [
    { label: "TOTAL MEMBERS", value: total_members ?? 0, color: "#1B3A2D", icon: "◈", href: "/super/roles" },
    { label: "SPONSORS", value: sponsors ?? 0, color: "#B47FE3", icon: "✦", href: "/super/roles" },
    { label: "ADMINS", value: admins ?? 0, color: "#F07228", icon: "▲", href: "/super/roles" },
    { label: "MODERATORS", value: moderators ?? 0, color: "#69C9D0", icon: "◆", href: "/super/roles" },
    { label: "TOTAL POSTS", value: total_posts ?? 0, color: "#3CCE2A", icon: "◉", href: "/admin/community" },
    { label: "TOTAL TICKETS", value: total_tickets ?? 0, color: "#F5C82A", icon: "◈", href: "/admin/events" },
    { label: "TOTAL EVENTS", value: total_events ?? 0, color: "#F07228", icon: "◆", href: "/admin/events" },
    { label: "EXCLUSIVE CONTENT", value: exclusive_content ?? 0, color: "#B47FE3", icon: "✦", href: "/super/exclusive" },
  ];

  const quickActions = [
    { label: "MANAGE ROLES", href: "/super/roles", color: "#B47FE3", bg: "#F0EAFF" },
    { label: "BROADCAST", href: "/super/broadcast", color: "#3CCE2A", bg: "#E8F0E4" },
    { label: "SITE SETTINGS", href: "/super/settings", color: "#F07228", bg: "#FFF0E8" },
    { label: "AUDIT LOG", href: "/super/audit", color: "#F5C82A", bg: "#FFFBE8" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #FFFBE8, #FFF7D4)", border: "2px solid #F5C82A40", borderRadius: "16px", padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{ fontSize: "28px" }}>⚡</span>
          <h1 style={{ fontFamily: R, fontSize: "1.8rem", color: "#C8960A", letterSpacing: "4px", margin: 0 }}>COMMAND CENTER</h1>
        </div>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59", margin: 0 }}>Full platform control — with great power comes great responsibility.</p>

        {/* Site status */}
        <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
          <div style={{ background: settings?.maintenance_mode ? "#FFE8EC" : "#E8F0E4", border: `1px solid ${settings?.maintenance_mode ? "#F04060" : "#3CCE2A"}40`, borderRadius: "8px", padding: "8px 16px" }}>
            <span style={{ fontFamily: R, fontSize: "11px", color: settings?.maintenance_mode ? "#F04060" : "#3CCE2A", letterSpacing: "1px" }}>
              {settings?.maintenance_mode ? "🔴 MAINTENANCE MODE" : "🟢 SITE LIVE"}
            </span>
          </div>
          {settings?.announcement_active && (
            <div style={{ background: "#FFF0D8", border: "1px solid #F07228", borderRadius: "8px", padding: "8px 16px" }}>
              <span style={{ fontFamily: B, fontSize: "11px", color: "#F07228" }}>📣 Announcement active</span>
            </div>
          )}
          {sponsorPerks && (
            <div style={{ background: "#F0EAFF", border: "1px solid #B47FE340", borderRadius: "8px", padding: "8px 16px" }}>
              <span style={{ fontFamily: B, fontSize: "11px", color: "#B47FE3" }}>✦ {sponsors ?? 0}/{sponsorPerks.max_sponsors} sponsor slots</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
        {stats.map(({ label, value, color, icon, href }) => (
          <Link key={label} href={href} style={{ textDecoration: "none" }}>
            <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "10px", padding: "16px", transition: "border-color 0.15s" }}
>
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>{icon}</div>
              <div style={{ fontFamily: R, fontSize: "1.6rem", color }}>{value}</div>
              <div style={{ fontFamily: B, fontSize: "9px", color: "#5A7A60", letterSpacing: "1.5px", marginTop: "2px" }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <div style={{ fontFamily: R, fontSize: "12px", color: "#5A7A60", letterSpacing: "2px", marginBottom: "12px" }}>QUICK ACTIONS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
          {quickActions.map(({ label, href, color, bg }) => (
            <Link key={label} href={href} style={{ textDecoration: "none" }}>
              <div style={{ background: bg, border: `2px solid ${color}40`, borderRadius: "10px", padding: "16px", textAlign: "center", transition: "border-color 0.15s" }}
>
                <span style={{ fontFamily: R, fontSize: "12px", color, letterSpacing: "1.5px" }}>{label} →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
