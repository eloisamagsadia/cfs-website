"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const STATUS_COLORS: Record<string, string> = {
  active: "#3CCE2A",
  used: "#5A7A50",
  cancelled: "#F04060",
  pending_payment: "#F5C82A",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export default function EventTicketsPage() {
  const { id: event_id } = useParams();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch(`/api/events/tickets?event_id=${event_id}`)
      .then(r => r.json())
      .then(({ tickets }) => { setTickets(tickets ?? []); setLoading(false); });
  }, [event_id]);

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);
  const counts = {
    all: tickets.length,
    active: tickets.filter(t => t.status === "active").length,
    used: tickets.filter(t => t.status === "used").length,
    pending_payment: tickets.filter(t => t.status === "pending_payment").length,
    cancelled: tickets.filter(t => t.status === "cancelled").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <Link href={`/admin/events/${event_id}/tiers`} style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", textDecoration: "none" }}>← Tiers</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#F0EAD6", letterSpacing: "3px", margin: "4px 0" }}>TICKETS</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78", margin: 0 }}>{tickets.length} total registrations</p>
        </div>
        <Link href="/admin/check-in"
          style={{ fontFamily: R, fontSize: "11px", background: "#3CCE2A", color: "#080F06", textDecoration: "none", borderRadius: "6px", padding: "8px 16px", letterSpacing: "1px" }}>
          📷 CHECK-IN SCANNER
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {[
          { label: "REGISTERED", value: counts.active, color: "#3CCE2A" },
          { label: "CHECKED IN", value: counts.used, color: "#5A7A50" },
          { label: "PENDING", value: counts.pending_payment, color: "#F5C82A" },
          { label: "CANCELLED", value: counts.cancelled, color: "#F04060" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#1A2614", border: `2px solid ${color}30`, borderRadius: "10px", padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: R, fontSize: "1.6rem", color }}>{value}</div>
            <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {["all", "active", "used", "pending_payment", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ fontFamily: R, fontSize: "11px", background: filter === s ? "#1A3D14" : "transparent", border: `1.5px solid ${filter === s ? "#3CCE2A" : "#2C4820"}`, color: filter === s ? "#3CCE2A" : "#5A7A50", borderRadius: "20px", padding: "5px 14px", cursor: "pointer", letterSpacing: "1px" }}>
            {s.replace("_", " ").toUpperCase()} ({counts[s as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* Tickets list */}
      {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A50", letterSpacing: "2px" }}>
          NO TICKETS
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(ticket => {
            const color = STATUS_COLORS[ticket.status] ?? "#5A7A50";
            return (
              <div key={ticket.id} style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "14px 18px", display: "flex", gap: "14px", alignItems: "center" }}>
                {/* Avatar */}
                <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#1A3D14", border: "1.5px solid #2C4820", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {ticket.profiles?.avatar_url
                    ? <img src={ticket.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: R, fontSize: "14px", color: "#3CCE2A" }}>{(ticket.profiles?.display_name ?? "M")[0].toUpperCase()}</span>
                  }
                </div>
                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", letterSpacing: "0.5px", marginBottom: "3px" }}>
                    {ticket.profiles?.display_name ?? "Member"}
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{ticket.ticket_number}</span>
                    <span style={{ fontFamily: R, fontSize: "10px", color: ticket.event_tiers?.color ?? "#5A7A50", background: (ticket.event_tiers?.color ?? "#5A7A50") + "20", borderRadius: "20px", padding: "1px 8px" }}>
                      {ticket.event_tiers?.name ?? "—"}
                    </span>
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{timeAgo(ticket.created_at)}</span>
                    {ticket.checked_in_at && (
                      <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>✓ {timeAgo(ticket.checked_in_at)}</span>
                    )}
                  </div>
                </div>
                {/* Status */}
                <span style={{ fontFamily: R, fontSize: "10px", color, background: color + "20", borderRadius: "20px", padding: "3px 10px", letterSpacing: "1px", flexShrink: 0 }}>
                  {ticket.status.replace("_", " ").toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
