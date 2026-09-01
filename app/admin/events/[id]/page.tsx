import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  IconCalendar, IconPin, IconUsers, IconTag, IconTicket, IconEdit,
  IconEye, IconEyeOff, IconCheck, IconDownload,
} from "@/components/shared/Icons";
import EventVisibilityToggle from "@/components/admin/EventVisibilityToggle";

export const metadata: Metadata = { title: "Event Details" };
export const dynamic  = "force-dynamic";
export const revalidate = 0;

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const S  = "var(--font-dm-serif,'DM Serif Display',Georgia,serif)";

const STATUS_META: Record<string, { fg: string; bg: string; label: string }> = {
  upcoming:  { fg: "#ffffff", bg: "#1A8040", label: "UPCOMING" },
  ongoing:   { fg: "#ffffff", bg: "#156530", label: "ONGOING" },
  completed: { fg: "#ffffff", bg: "#7A8E7A", label: "COMPLETED" },
  cancelled: { fg: "#ffffff", bg: "#CC3344", label: "CANCELLED" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

export default async function AdminEventDetailPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();

  const [{ data: event }, { data: tiers }, { data: tickets }] = await Promise.all([
    (admin as any).from("events").select("*").eq("id", params.id).maybeSingle(),
    (admin as any).from("event_tiers").select("*").eq("event_id", params.id).order("price", { ascending: false }),
    (admin as any).from("event_tickets")
      .select("id, ticket_number, status, payment_status, tier_id, checked_in_at, created_at, profiles:user_id(display_name, avatar_url), event_tiers:tier_id(name, price, color)")
      .eq("event_id", params.id)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  if (!event) notFound();

  const status  = STATUS_META[event.status] ?? STATUS_META.completed;
  const d       = new Date(event.date);
  const isHidden = !!event.is_hidden;

  const tickList: any[] = tickets ?? [];
  const tierList: any[] = tiers ?? [];

  const soldCount     = tickList.filter(t => ["active", "used"].includes(t.status)).length;
  const revenue       = tickList
    .filter(t => t.payment_status === "paid")
    .reduce((sum, t) => sum + Number(t.event_tiers?.price ?? event.price ?? 0), 0);
  const checkedIn     = tickList.filter(t => !!t.checked_in_at).length;
  const pendingPayment = tickList.filter(t => t.status === "pending_payment").length;

  // Per-tier sold counts
  const soldByTier: Record<string, number> = {};
  for (const t of tickList) {
    if (["active", "used"].includes(t.status) && t.tier_id) {
      soldByTier[t.tier_id] = (soldByTier[t.tier_id] ?? 0) + 1;
    }
  }

  const recent = tickList.slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        .aed-action:hover { transform: translateY(-1px); }
        .aed-action { transition: all 0.15s; }
        @media (max-width: 720px) {
          .aed-stats  { grid-template-columns: 1fr 1fr !important; }
          .aed-actions { justify-content: flex-start !important; }
        }
      `}</style>

      {/* Breadcrumb */}
      <Link href="/admin/events" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.5px" }}>
        ← ALL EVENTS
      </Link>

      {/* Hero card */}
      <div style={{ background: "#ffffff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 0 rgba(15,42,30,0.04), 0 6px 20px rgba(15,42,30,0.06)" }}>
        {event.banner_url ? (
          <div style={{ width: "100%", height: "220px", position: "relative", overflow: "hidden" }}>
            <img src={event.banner_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)" }} />
          </div>
        ) : (
          <div style={{ height: "12px", background: "linear-gradient(90deg,#1A8040 0%,#F5C82A 55%,#E88C4A 100%)" }} />
        )}

        <div style={{ padding: "22px 24px 20px" }}>
          <h1 style={{ fontFamily: S, fontSize: "28px", lineHeight: 1.15, color: "#1B3A2D", margin: "0 0 10px" }}>{event.title}</h1>

          {/* Meta row */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", fontFamily: B, fontSize: "13px", color: "#5A7A60", marginBottom: "14px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <IconCalendar size={14} color="#7A8E7A" />
              {d.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })}
              {" · "}
              {d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })}
            </span>
            {event.location && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <IconPin size={14} color="#7A8E7A" /> {event.location}
              </span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#1A8040", fontWeight: 600 }}>
              <IconTag size={14} color="#1A8040" />
              {Number(event.price) > 0 ? `₱${Number(event.price).toLocaleString()}` : "Free"}
            </span>
            <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: status.fg, background: status.bg, borderRadius: "999px", padding: "4px 12px", letterSpacing: "1.5px" }}>{status.label}</span>
            {isHidden && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#B45309", background: "#FFF3E0", border: "1px solid #F0C48A", borderRadius: "999px", padding: "3px 10px", letterSpacing: "1.5px" }}>
                <IconEyeOff size={11} color="#B45309" /> HIDDEN
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="aed-actions" style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
            <EventVisibilityToggle id={event.id} initialHidden={isHidden} />
            <a href={`/events/${event.id}`} target="_blank" rel="noopener noreferrer"
              className="aed-action"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", letterSpacing: "1.2px" }}>
              <IconEye size={12} color="#5A7A60" /> PREVIEW
            </a>
            <Link href={`/admin/events/${event.id}/report`}
              className="aed-action"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", letterSpacing: "1.2px" }}>
              <IconDownload size={12} color="#1B3A2D" /> REPORT
            </Link>
            <Link href={`/admin/events/${event.id}/tiers`}
              className="aed-action"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", background: "#E8F0E4", border: "1.5px solid transparent", borderRadius: "10px", padding: "9px 14px", letterSpacing: "1.2px" }}>
              <IconTag size={12} color="#1B3A2D" /> TIERS
            </Link>
            <Link href={`/admin/events/${event.id}/tickets`}
              className="aed-action"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", background: "#E8F0E4", border: "1.5px solid transparent", borderRadius: "10px", padding: "9px 14px", letterSpacing: "1.2px" }}>
              <IconTicket size={12} color="#1B3A2D" /> TICKETS
            </Link>
            <Link href={`/admin/events/${event.id}/edit`}
              className="aed-action"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "9px 16px", letterSpacing: "1.2px", boxShadow: "0 2px 8px rgba(26,128,64,0.25)" }}>
              <IconEdit size={12} color="#ffffff" /> EDIT
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="aed-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {[
          { label: "TICKETS SOLD",   value: `${soldCount}${event.capacity ? ` / ${event.capacity}` : ""}`, color: "#1B3A2D", icon: <IconTicket size={14} color="#1A8040" /> },
          { label: "REVENUE",        value: `₱${revenue.toLocaleString("en-PH")}`,                          color: "#1A8040", icon: <IconTag size={14} color="#1A8040" /> },
          { label: "CHECKED IN",     value: `${checkedIn}`,                                                  color: "#156530", icon: <IconCheck size={14} color="#156530" /> },
          { label: "PENDING PAYMENT", value: `${pendingPayment}`,                                            color: "#B45309", icon: <IconUsers size={14} color="#B45309" /> },
        ].map(s => (
          <div key={s.label} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "12px", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              {s.icon}
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.5px" }}>{s.label}</div>
            </div>
            <div style={{ fontFamily: R, fontSize: "1.35rem", color: s.color, letterSpacing: "0.5px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      {event.description && (
        <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "12px", padding: "18px 22px" }}>
          <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", letterSpacing: "2px", marginBottom: "10px" }}>ABOUT THIS EVENT</div>
          <div style={{ fontFamily: B, fontSize: "14px", color: "#1B3A2D", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{event.description}</div>
        </div>
      )}

      {/* Tiers */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "12px", padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", letterSpacing: "2px" }}>TIERS</div>
          <Link href={`/admin/events/${event.id}/tiers`} style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040", textDecoration: "none", letterSpacing: "1px" }}>MANAGE →</Link>
        </div>
        {tierList.length === 0 ? (
          <div style={{ fontFamily: B, fontSize: "13px", color: "#7A8E7A", textAlign: "center", padding: "12px 0" }}>
            No tiers created yet. <Link href={`/admin/events/${event.id}/tiers`} style={{ color: "#1A8040" }}>Add one →</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {tierList.map(t => {
              const sold  = soldByTier[t.id] ?? 0;
              const cap   = t.capacity;
              const color = t.color ?? "#1A8040";
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "#F7FAF5", borderRadius: "10px", border: `1px solid ${color}20` }}>
                  <div style={{ width: "8px", height: "40px", background: color, borderRadius: "4px", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "0.5px" }}>{t.name}</div>
                    <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>
                      ₱{Number(t.price).toLocaleString()} · {sold}{cap ? ` / ${cap}` : ""} sold
                    </div>
                  </div>
                  {cap ? (
                    <div style={{ width: "80px", height: "6px", background: "#E4EDE4", borderRadius: "3px", overflow: "hidden", flexShrink: 0 }}>
                      <div style={{ width: `${Math.min(100, (sold / cap) * 100)}%`, height: "100%", background: color }} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent attendees */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "12px", padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", letterSpacing: "2px" }}>RECENT ATTENDEES</div>
          <Link href={`/admin/events/${event.id}/tickets`} style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040", textDecoration: "none", letterSpacing: "1px" }}>VIEW ALL →</Link>
        </div>
        {recent.length === 0 ? (
          <div style={{ fontFamily: B, fontSize: "13px", color: "#7A8E7A", textAlign: "center", padding: "12px 0" }}>
            No tickets yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recent.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "#F7FAF5", borderRadius: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#E8F0E4", border: "1.5px solid #DDE8DD", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {t.profiles?.avatar_url
                    ? <img src={t.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: R, fontSize: "13px", color: "#1A8040" }}>{(t.profiles?.display_name ?? "M")[0].toUpperCase()}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.profiles?.display_name ?? "Member"}
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>
                    <span style={{ fontFamily: "monospace" }}>{t.ticket_number}</span>
                    {t.event_tiers && <span>· {t.event_tiers.name}</span>}
                    <span>· {timeAgo(t.created_at)}</span>
                  </div>
                </div>
                {t.checked_in_at ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1A8040", background: "#E8F0E4", borderRadius: "999px", padding: "3px 10px", letterSpacing: "1px" }}>
                    <IconCheck size={10} color="#1A8040" /> IN
                  </span>
                ) : t.status === "pending_payment" ? (
                  <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#B45309", background: "#FFF3E0", borderRadius: "999px", padding: "3px 10px", letterSpacing: "1px" }}>
                    PENDING
                  </span>
                ) : t.status === "cancelled" ? (
                  <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#CC3344", background: "#FFE8EC", borderRadius: "999px", padding: "3px 10px", letterSpacing: "1px" }}>
                    CANCELLED
                  </span>
                ) : (
                  <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1A8040", background: "#F7FAF5", border: "1px solid #DDE8DD", borderRadius: "999px", padding: "3px 10px", letterSpacing: "1px" }}>
                    ACTIVE
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
