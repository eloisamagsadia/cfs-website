"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

const STATUS_COLORS: Record<string, string> = {
  active: "#3CCE2A",
  used: "#5A7A50",
  cancelled: "#F04060",
  pending_payment: "#F5C82A",
};

const STATUS_LABELS: Record<string, string> = {
  active: "VALID",
  used: "USED",
  cancelled: "CANCELLED",
  pending_payment: "PENDING PAYMENT",
};

export default function TicketPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<any>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/events/tickets?my=true`)
      .then(r => r.json())
      .then(({ tickets }) => {
        const found = (tickets ?? []).find((t: any) => t.id === id);
        setTicket(found ?? null);
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
  );

  if (!ticket) return (
    <div style={{ textAlign: "center", padding: "80px" }}>
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎫</div>
      <div style={{ fontFamily: R, fontSize: "14px", color: "#5A7A50", letterSpacing: "2px" }}>TICKET NOT FOUND</div>
      <Link href="/members/events" style={{ fontFamily: B, fontSize: "13px", color: "#3CCE2A", textDecoration: "none", display: "block", marginTop: "12px" }}>← Back to Events</Link>
    </div>
  );

  const statusColor = STATUS_COLORS[ticket.status] ?? "#5A7A50";
  const tierColor = ticket.event_tiers?.color ?? "#3CCE2A";
  const event = ticket.events ?? {};
  const tier = ticket.event_tiers ?? {};
  const qrValue = JSON.stringify({ ticket_id: ticket.id, ticket_number: ticket.ticket_number });

  return (
    <div style={{ maxWidth: "420px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Back */}
      <Link href="/members/events" style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", textDecoration: "none" }}>
        ← Back to Events
      </Link>

      {/* Ticket card */}
      <div ref={ticketRef} style={{ background: "#1A2614", border: `2px solid ${tierColor}`, borderRadius: "20px", overflow: "hidden", position: "relative" }}>

        {/* Top accent */}
        <div style={{ height: "6px", background: `linear-gradient(90deg, ${tierColor}, ${tierColor}80)` }} />

        {/* Event header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px dashed #2C4820" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: R, fontSize: "10px", color: tierColor, letterSpacing: "2px", marginBottom: "6px" }}>+ CFS BINI COLET FAN CLUB</div>
              <div style={{ fontFamily: S, fontSize: "1.3rem", color: "#F0EAD6", lineHeight: 1.3 }}>{event.title ?? "Event"}</div>
            </div>
            <div style={{ background: statusColor + "20", border: `1.5px solid ${statusColor}`, borderRadius: "20px", padding: "3px 10px", flexShrink: 0, marginTop: "4px" }}>
              <span style={{ fontFamily: R, fontSize: "9px", color: statusColor, letterSpacing: "1.5px" }}>{STATUS_LABELS[ticket.status] ?? ticket.status}</span>
            </div>
          </div>
        </div>

        {/* Event details */}
        <div style={{ padding: "16px 24px", borderBottom: "1px dashed #2C4820", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {[
            { label: "DATE", value: event.date ? new Date(event.date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "TBA" },
            { label: "LOCATION", value: event.location ?? "TBA" },
            { label: "TIER", value: tier.name ?? "General" },
            { label: "TICKET NO.", value: ticket.ticket_number ?? "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1px", marginBottom: "3px" }}>{label}</div>
              <div style={{ fontFamily: R, fontSize: "12px", color: label === "TIER" ? tierColor : "#F0EAD6", letterSpacing: "0.5px" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Member info */}
        <div style={{ padding: "16px 24px", borderBottom: "1px dashed #2C4820", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: `2px solid ${tierColor}`, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0F1A0B" }}>
            {ticket.profiles?.avatar_url
              ? <img src={ticket.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontFamily: R, fontSize: "18px", color: tierColor }}>{(ticket.profiles?.display_name ?? "M")[0].toUpperCase()}</span>
            }
          </div>
          <div>
            <div style={{ fontFamily: R, fontSize: "14px", color: "#F0EAD6", letterSpacing: "1px" }}>{ticket.profiles?.display_name ?? ticket.qr_data?.member_name ?? "Member"}</div>
            <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{ticket.profiles?.email ?? ticket.qr_data?.member_email ?? ""}</div>
          </div>
        </div>

        {/* Tier perks */}
        {tier.perks?.length > 0 && (
          <div style={{ padding: "14px 24px", borderBottom: "1px dashed #2C4820" }}>
            <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1px", marginBottom: "8px" }}>INCLUDES</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {tier.perks.map((perk: string) => (
                <span key={perk} style={{ fontFamily: B, fontSize: "10px", color: tierColor, background: tierColor + "20", borderRadius: "20px", padding: "2px 10px" }}>✓ {perk}</span>
              ))}
            </div>
          </div>
        )}

        {/* Custom message */}
        {template?.custom_message && (
          <div style={{ padding: "10px 24px", borderBottom: "1px dashed #2C4820" }}>
            <p style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78", fontStyle: "italic", margin: 0, textAlign: "center" }}>{template.custom_message}</p>
          </div>
        )}

        {/* Background image overlay */}
        {template?.bg_image_url && (
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${template.bg_image_url})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.08, zIndex: 0, borderRadius: "18px" }} />
        )}

        {/* QR Code */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          {ticket.status === "active" ? (
            <>
              <div style={{ background: "#fff", padding: "16px", borderRadius: "12px" }}>
                <QRCode value={qrValue} size={160} level="H" />
              </div>
              <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", textAlign: "center" }}>
                Present this QR code at the event entrance
              </div>
            </>
          ) : ticket.status === "used" ? (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>✅</div>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#5A7A50", letterSpacing: "2px" }}>TICKET USED</div>
              {ticket.checked_in_at && (
                <div style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30", marginTop: "6px" }}>
                  Checked in {new Date(ticket.checked_in_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          ) : ticket.status === "pending_payment" ? (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>⏳</div>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#F5C82A", letterSpacing: "2px" }}>AWAITING PAYMENT</div>
              <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", marginTop: "6px" }}>Complete payment to activate your ticket</div>
            </div>
          ) : null}
        </div>

        {/* Bottom */}
        <div style={{ background: "#0F1A0B", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: R, fontSize: "10px", color: "#3A5A30", letterSpacing: "1px" }}>coletfs.com</div>
          <div style={{ fontFamily: B, fontSize: "10px", color: "#3A5A30" }}>
            {new Date(ticket.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Save hint */}
      {ticket.status === "active" && (
        <div style={{ background: "#1A3D14", border: "1.5px solid #2C4820", borderRadius: "10px", padding: "12px 16px", display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "16px" }}>💡</span>
          <span style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78", lineHeight: 1.5 }}>
            Take a screenshot of this ticket to save it offline. Present the QR code at the event.
          </span>
        </div>
      )}
    </div>
  );
}
