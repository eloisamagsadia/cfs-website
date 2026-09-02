import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Metadata } from "next";
import { IconTicket, IconEdit, IconPin, IconUsers, IconTag, IconCalendar, IconEyeOff, IconEye, IconDownload } from "@/components/shared/Icons";
import EventVisibilityToggle from "@/components/admin/EventVisibilityToggle";
import RealtimeRefresh from "@/components/shared/RealtimeRefresh";

export const metadata: Metadata = { title: "Manage Events" };
export const revalidate = 30;


const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const STATUS_META: Record<string, { fg: string; bg: string; ring: string; label: string }> = {
  upcoming:  { fg: "#ffffff", bg: "#1A8040", ring: "#1A8040", label: "UPCOMING" },
  ongoing:   { fg: "#ffffff", bg: "#156530", ring: "#156530", label: "ONGOING" },
  completed: { fg: "#ffffff", bg: "#7A8E7A", ring: "#7A8E7A", label: "COMPLETED" },
  cancelled: { fg: "#ffffff", bg: "#CC3344", ring: "#CC3344", label: "CANCELLED" },
};

export default async function AdminEventsPage() {
  const admin = createAdminClient();
  const { data: events } = await (admin as any)
    .from("events")
    .select("*")
    .order("date", { ascending: false });

  const list = events ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <RealtimeRefresh tables="events" />
      <style>{`
        @media (max-width: 720px) {
          .aev-row { flex-direction: column !important; align-items: stretch !important; }
          .aev-actions { justify-content: flex-start !important; }
        }
        .aev-btn-primary:hover   { background: #156530 !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(21,101,48,0.25); }
        .aev-btn-secondary:hover { background: #DDE8DD !important; }
        .aev-btn-ghost:hover     { background: #F2F7F2 !important; border-color: #1A8040 !important; color: #1A8040 !important; }
        .aev-btn-primary, .aev-btn-secondary, .aev-btn-ghost { transition: all 0.15s; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>EVENTS</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>{list.length} total event{list.length === 1 ? "" : "s"}</p>
        </div>
        <Link href="/admin/events/create" style={{ textDecoration: "none", position: "relative", display: "inline-block" }}>
          <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "10px" }} />
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "12px", fontWeight: 700, background: "#1A8040", color: "#ffffff", padding: "11px 22px", border: "1.5px solid #1B3A2D", borderRadius: "10px", letterSpacing: "1.5px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            CREATE EVENT
          </span>
        </Link>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {list.map((event: any) => {
          const status = STATUS_META[event.status] ?? STATUS_META.completed;
          const d = new Date(event.date);
          const regCount = event.event_registrations?.length ?? 0;
          const capacity = event.capacity ?? 0;

          const isHidden = !!event.is_hidden;

          return (
            <div key={event.id} className="aev-row" style={{ background: "#ffffff", borderRadius: "14px", padding: "18px 20px", display: "flex", gap: "18px", alignItems: "center", boxShadow: "0 1px 0 rgba(15,42,30,0.04), 0 4px 14px rgba(15,42,30,0.05)", opacity: isHidden ? 0.72 : 1 }}>

              {/* Date tile */}
              <div style={{ flexShrink: 0, width: "62px", background: `linear-gradient(180deg, ${status.bg}, ${status.ring})`, borderRadius: "12px", padding: "10px 8px", textAlign: "center", color: "#ffffff", boxShadow: `0 4px 12px ${status.bg}30` }}>
                <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", opacity: 0.85 }}>
                  {d.toLocaleDateString("en-PH", { month: "short", timeZone: "Asia/Manila" }).toUpperCase()}
                </div>
                <div style={{ fontFamily: R, fontSize: "1.6rem", lineHeight: 1, marginTop: "2px" }}>
                  {d.toLocaleDateString("en-PH", { day: "numeric", timeZone: "Asia/Manila" })}
                </div>
              </div>

              {/* Info column */}
              <div style={{ flex: 1, minWidth: "220px" }}>
                <Link href={`/admin/events/${event.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ fontFamily: R, fontSize: "15px", color: "#1B3A2D", letterSpacing: "0.5px", marginBottom: "6px" }}>{event.title}</div>
                </Link>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center", fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <IconCalendar size={12} color="#7A8E7A" />
                    {d.toLocaleDateString("en-PH", { weekday: "short", timeZone: "Asia/Manila" })} · {d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })}
                  </span>
                  {event.location && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <IconPin size={12} color="#7A8E7A" /> {event.location}
                    </span>
                  )}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <IconUsers size={12} color="#7A8E7A" />
                    {regCount}{capacity ? ` / ${capacity}` : ""} registered
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#1A8040", fontWeight: 600 }}>
                    <IconTag size={12} color="#1A8040" />
                    {event.price > 0 ? `₱${Number(event.price).toLocaleString()}` : "Free"}
                  </span>
                  <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: status.fg, background: status.bg, borderRadius: "999px", padding: "3px 10px", letterSpacing: "1.5px" }}>{status.label}</span>
                  {isHidden && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#B45309", background: "#FFF3E0", border: "1px solid #F0C48A", borderRadius: "999px", padding: "3px 10px", letterSpacing: "1.5px" }}>
                      <IconEyeOff size={10} color="#B45309" /> HIDDEN
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="aev-actions" style={{ display: "flex", gap: "6px", flexShrink: 0, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <EventVisibilityToggle id={event.id} initialHidden={isHidden} />
                <a href={`/events/${event.id}`} target="_blank" rel="noopener noreferrer"
                  className="aev-btn-ghost"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", letterSpacing: "1.2px" }}>
                  <IconEye size={12} color="#5A7A60" /> PREVIEW
                </a>
                <Link href={`/admin/events/${event.id}/tiers`}
                  className="aev-btn-secondary"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", background: "#E8F0E4", border: "1.5px solid transparent", borderRadius: "10px", padding: "9px 14px", letterSpacing: "1.2px" }}>
                  <IconTag size={12} color="#1B3A2D" /> TIERS
                </Link>
                <Link href={`/admin/events/${event.id}/tickets`}
                  className="aev-btn-secondary"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", background: "#E8F0E4", border: "1.5px solid transparent", borderRadius: "10px", padding: "9px 14px", letterSpacing: "1.2px" }}>
                  <IconTicket size={12} color="#1B3A2D" /> TICKETS
                </Link>
                <Link href={`/admin/events/${event.id}/report`}
                  className="aev-btn-ghost"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", letterSpacing: "1.2px" }}>
                  <IconDownload size={12} color="#5A7A60" /> REPORT
                </Link>
                <Link href={`/admin/events/${event.id}/edit`}
                  className="aev-btn-primary"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "9px 16px", letterSpacing: "1.2px", boxShadow: "0 2px 8px rgba(26,128,64,0.25)" }}>
                  <IconEdit size={12} color="#ffffff" /> EDIT
                </Link>
              </div>
            </div>
          );
        })}

        {list.length === 0 && (
          <div style={{ background: "#ffffff", border: `1.5px dashed #DDE8DD`, borderRadius: "14px", padding: "56px 24px", textAlign: "center" }}>
            <div style={{ marginBottom: "10px" }}>
              <IconCalendar size={32} color="#B7CDB7" />
            </div>
            <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#4A7C59", letterSpacing: "2px", marginBottom: "6px" }}>NO EVENTS YET</div>
            <div style={{ fontFamily: B, fontSize: "13px", color: "#7A8E7A", marginBottom: "18px" }}>Create your first event to start selling tickets.</div>
            <Link href="/admin/events/create" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "12px", fontWeight: 700, background: "#1A8040", color: "#ffffff", padding: "10px 20px", borderRadius: "10px", letterSpacing: "1.5px" }}>
              + CREATE EVENT
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
