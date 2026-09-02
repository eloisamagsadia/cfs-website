"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { IconTicket, IconCheck } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  active:          { color: "#156530", bg: "#E8F0E4", label: "VALID"           },
  used:            { color: "#5A7A60", bg: "#F0F0F0", label: "USED"            },
  cancelled:       { color: "#8A1E27", bg: "#FFE8EC", label: "CANCELLED"       },
  pending_payment: { color: "#7A5A0F", bg: "#FFF3D6", label: "PENDING PAYMENT" },
};

type Filter = "all" | "upcoming" | "past" | "cancelled";

interface Ticket {
  id: string;
  event_id: string;
  ticket_number: string;
  status: keyof typeof STATUS_META;
  payment_status?: string;
  checked_in_at: string | null;
  created_at: string;
  events?: { id: string; title: string; date: string; location?: string; banner_url?: string | null } | null;
  event_tiers?: { name: string } | null;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" });
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [filter, setFilter]   = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/events/tickets?my=true")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setTickets(d.tickets ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const now = Date.now();

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const eventTime = t.events?.date ? new Date(t.events.date).getTime() : null;
      if (filter === "upcoming") return t.status !== "cancelled" && (eventTime == null || eventTime >= now);
      if (filter === "past")     return t.status !== "cancelled" && eventTime != null && eventTime < now;
      if (filter === "cancelled") return t.status === "cancelled";
      return true;
    }).sort((a, b) => {
      const ea = a.events?.date ? new Date(a.events.date).getTime() : 0;
      const eb = b.events?.date ? new Date(b.events.date).getTime() : 0;
      return eb - ea;
    });
  }, [tickets, filter, now]);

  const counts = useMemo(() => {
    const c = { all: tickets.length, upcoming: 0, past: 0, cancelled: 0 };
    for (const t of tickets) {
      if (t.status === "cancelled") { c.cancelled++; continue; }
      const et = t.events?.date ? new Date(t.events.date).getTime() : null;
      if (et != null && et < now) c.past++;
      else c.upcoming++;
    }
    return c;
  }, [tickets, now]);

  if (loading) return <div style={{ padding: "8px 0" }}><SkeletonPage /></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: 3, marginBottom: 4 }}>MY TICKETS</h1>
        <p style={{ fontFamily: B, fontSize: 13, color: "#4A7C59" }}>Every event you've registered for. Tap a ticket to open its QR code for check-in.</p>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["all", "upcoming", "past", "cancelled"] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: filter === f ? "#ffffff" : "#1B3A2D", background: filter === f ? "#1A8040" : "#ffffff", border: `1.5px solid ${filter === f ? "#1A8040" : "#DDE8DD"}`, borderRadius: 999, padding: "7px 14px", cursor: "pointer", letterSpacing: 1.2 }}>
            {f.toUpperCase()} ({counts[f]})
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: 10, padding: "10px 14px", fontFamily: B, fontSize: 13, color: "#CC3344" }}>{error}</div>}

      {filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: 14, padding: "56px 24px", textAlign: "center" }}>
          <IconTicket size={30} color="#B7CDB7" />
          <div style={{ fontFamily: SG, fontSize: 12, fontWeight: 700, color: "#4A7C59", letterSpacing: 2, marginTop: 10 }}>
            {tickets.length === 0 ? "NO TICKETS YET" : `NO ${filter.toUpperCase()} TICKETS`}
          </div>
          <div style={{ fontFamily: B, fontSize: 12, color: "#7A8E7A", marginTop: 6 }}>
            {tickets.length === 0
              ? <>Browse the <Link href="/events" style={{ color: "#1A8040" }}>events page</Link> to register.</>
              : <>Try a different filter, or <Link href="/events" style={{ color: "#1A8040" }}>find another event</Link>.</>}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(t => {
            const meta = STATUS_META[t.status] ?? STATUS_META.active;
            const eventPast = t.events?.date ? new Date(t.events.date).getTime() < now : false;
            return (
              <Link key={t.id} href={`/members/tickets/${t.id}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "#ffffff", border: `1px solid ${eventPast && t.status === "active" ? "#DDE8DD" : "#B7D8B7"}`, borderRadius: 14, padding: 0, display: "grid", gridTemplateColumns: "72px 1fr auto", overflow: "hidden", alignItems: "stretch" }}>

                  {/* Left rail with date */}
                  <div style={{ background: eventPast ? "#F0F5F0" : "#1B3A2D", color: eventPast ? "#5A7A60" : "#F0D889", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 0", gap: 2 }}>
                    <div style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, letterSpacing: 1.5 }}>{t.events?.date ? new Date(t.events.date).toLocaleDateString("en-PH", { month: "short", timeZone: "Asia/Manila" }).toUpperCase() : "—"}</div>
                    <div style={{ fontFamily: R, fontSize: 24, letterSpacing: 1, lineHeight: 1 }}>{t.events?.date ? new Date(t.events.date).toLocaleDateString("en-PH", { day: "numeric", timeZone: "Asia/Manila" }) : "?"}</div>
                    <div style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, letterSpacing: 1.5 }}>{t.events?.date ? new Date(t.events.date).toLocaleDateString("en-PH", { year: "numeric", timeZone: "Asia/Manila" }) : ""}</div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: "14px 16px", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: meta.color, background: meta.bg, borderRadius: 6, padding: "2px 8px", letterSpacing: 1.2 }}>{meta.label}</span>
                      {t.checked_in_at && <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#156530", background: "#E8F0E4", borderRadius: 6, padding: "2px 8px", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 4 }}><IconCheck size={9} color="#156530" /> CHECKED IN</span>}
                      {t.event_tiers?.name && <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: 6, padding: "2px 8px", letterSpacing: 1.2 }}>{t.event_tiers.name.toUpperCase()}</span>}
                    </div>
                    <div style={{ fontFamily: R, fontSize: 15, color: "#1B3A2D", letterSpacing: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{t.events?.title ?? "Event"}</div>
                    <div style={{ fontFamily: B, fontSize: 11, color: "#5A7A60" }}>
                      {t.events?.date && `${fmtTime(t.events.date)}`}
                      {t.events?.location && ` · ${t.events.location}`}
                    </div>
                    <div style={{ fontFamily: "monospace" as const, fontSize: 10, color: "#7A8E7A", marginTop: 2 }}>#{t.ticket_number}</div>
                  </div>

                  {/* Chevron */}
                  <div style={{ display: "flex", alignItems: "center", padding: "0 16px", color: "#B7CDB7" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
