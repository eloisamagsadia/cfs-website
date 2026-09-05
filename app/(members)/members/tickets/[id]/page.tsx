"use client";
import { SkLine, SkCircle } from "@/components/shared/Skeleton";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import { IconTicket, IconCheck, IconLightning } from "@/components/shared/Icons";
import ReceiptBlock from "@/components/tickets/ReceiptBlock";
import TierChangeBlock from "@/components/members/TierChangeBlock";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

const STATUS_COLORS: Record<string, string> = {
  active: "#1A8040",
  used: "#5A7A60",
  cancelled: "#CC3344",
  pending_payment: "#156530",
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
  const [receipt, setReceipt] = useState<any>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/events/tickets?my=true`)
      .then(r => r.json())
      .then(({ tickets }) => {
        const found = (tickets ?? []).find((t: any) => t.id === id);
        setTicket(found ?? null);
        setLoading(false);
      });
    // Receipt is fetched separately so the ticket card can render fast
    // while receipt data hydrates. Non-blocking — if it errors, we just
    // hide the receipt block.
    fetch(`/api/members/receipt?ticket_id=${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setReceipt(d ?? null))
      .catch(() => setReceipt(null));
  }, [id]);

  if (loading) return (
    <div style={{ maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <SkLine w="120px" h="12px" />
      {/* Ticket card shape */}
      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: 20, overflow: "hidden" }}>
        <SkLine w="100%" h="6px" r="0" />
        <div style={{ padding: "20px 24px 16px", display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px dashed #DDE8DD" }}>
          <SkLine w="140px" h="10px" />
          <SkLine w="80%" h="20px" />
        </div>
        <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, borderBottom: "1px dashed #DDE8DD" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <SkLine w="50px" h="9px" />
              <SkLine w="80px" h="12px" />
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 24px", display: "flex", gap: 12, alignItems: "center", borderBottom: "1px dashed #DDE8DD" }}>
          <SkCircle size="44px" />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <SkLine w="140px" h="12px" />
            <SkLine w="180px" h="10px" />
          </div>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <SkLine w="192px" h="192px" r="12px" />
          <SkLine w="200px" h="10px" />
        </div>
      </div>
    </div>
  );

  if (!ticket) return (
    <div style={{ textAlign: "center", padding: "80px" }}>
      <div style={{ marginBottom: "12px" }}><IconTicket size={40} color="#DDE8DD" /></div>
      <div style={{ fontFamily: R, fontSize: "14px", color: "#5A7A60", letterSpacing: "2px" }}>TICKET NOT FOUND</div>
      <Link href="/members/events" style={{ fontFamily: B, fontSize: "13px", color: "#1A8040", textDecoration: "none", display: "block", marginTop: "12px" }}>← Back to Events</Link>
    </div>
  );

  const statusColor = STATUS_COLORS[ticket.status] ?? "#5A7A60";
  const tierColor = ticket.event_tiers?.color ?? "#1A8040";
  const event = ticket.events ?? {};
  const tier = ticket.event_tiers ?? {};
  const qrValue = JSON.stringify({ ticket_id: ticket.id, ticket_number: ticket.ticket_number });

  return (
    <div style={{ maxWidth: "420px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Back */}
      <Link href="/members/events" style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", textDecoration: "none" }}>
        ← Back to Events
      </Link>

      {/* Ticket card */}
      <div ref={ticketRef} style={{ background: "#FFFFFF", border: `2px solid ${tierColor}`, borderRadius: "20px", overflow: "hidden", position: "relative" }}>

        {/* Top accent */}
        <div style={{ height: "6px", background: `linear-gradient(90deg, ${tierColor}, ${tierColor}80)` }} />

        {/* Event header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px dashed #DDE8DD" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: R, fontSize: "10px", color: tierColor, letterSpacing: "2px", marginBottom: "6px" }}>+ CFS BINI COLET FAN CLUB</div>
              <div style={{ fontFamily: S, fontSize: "1.3rem", color: "#1B3A2D", lineHeight: 1.3 }}>{event.title ?? "Event"}</div>
            </div>
            <div style={{ background: statusColor + "20", border: `1.5px solid ${statusColor}`, borderRadius: "20px", padding: "3px 10px", flexShrink: 0, marginTop: "4px" }}>
              <span style={{ fontFamily: R, fontSize: "9px", color: statusColor, letterSpacing: "1.5px" }}>{STATUS_LABELS[ticket.status] ?? ticket.status}</span>
            </div>
          </div>
        </div>

        {/* Event details */}
        <div className="stack-sm" style={{ padding: "16px 24px", borderBottom: "1px dashed #DDE8DD", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {[
            { label: "DATE", value: event.date ? new Date(event.date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }) : "TBA" },
            { label: "LOCATION", value: event.location ?? "TBA" },
            { label: "TIER", value: tier.name ?? "General" },
            { label: "TICKET NO.", value: ticket.ticket_number ?? "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "3px" }}>{label}</div>
              <div style={{ fontFamily: R, fontSize: "12px", color: label === "TIER" ? tierColor : "#1B3A2D", letterSpacing: "0.5px" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Member info */}
        <div style={{ padding: "16px 24px", borderBottom: "1px dashed #DDE8DD", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: `2px solid ${tierColor}`, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#F7FAF5" }}>
            {ticket.profiles?.avatar_url
              ? <img src={ticket.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontFamily: R, fontSize: "18px", color: tierColor }}>{(ticket.profiles?.display_name ?? "M")[0].toUpperCase()}</span>
            }
          </div>
          <div>
            <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1px" }}>{ticket.profiles?.display_name ?? ticket.qr_data?.member_name ?? "Member"}</div>
            <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{ticket.profiles?.email ?? ticket.qr_data?.member_email ?? ""}</div>
          </div>
        </div>

        {/* Tier perks */}
        {tier.perks?.length > 0 && (
          <div style={{ padding: "14px 24px", borderBottom: "1px dashed #DDE8DD" }}>
            <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "8px" }}>INCLUDES</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {tier.perks.map((perk: string) => (
                <span key={perk} style={{ fontFamily: B, fontSize: "10px", color: tierColor, background: tierColor + "20", borderRadius: "20px", padding: "2px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}><IconCheck size={8} color={tierColor} /> {perk}</span>
              ))}
            </div>
          </div>
        )}

        {/* Custom message */}
        {template?.custom_message && (
          <div style={{ padding: "10px 24px", borderBottom: "1px dashed #DDE8DD" }}>
            <p style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", fontStyle: "italic", margin: 0, textAlign: "center" }}>{template.custom_message}</p>
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
              <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", textAlign: "center" }}>
                Present this QR code at the event entrance
              </div>
            </>
          ) : ticket.status === "used" ? (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ marginBottom: "8px" }}><IconCheck size={36} color="#1A8040" /></div>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#5A7A60", letterSpacing: "2px" }}>TICKET USED</div>
              {ticket.checked_in_at && (
                <div style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30", marginTop: "6px" }}>
                  Checked in {new Date(ticket.checked_in_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          ) : ticket.status === "pending_payment" ? (
            <PendingPaymentBlock ticketId={ticket.id} />
          ) : null}
        </div>

        {/* Bottom */}
        <div style={{ background: "#F7FAF5", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: R, fontSize: "10px", color: "#3A5A30", letterSpacing: "1px" }}>coletfs.com</div>
          <div style={{ fontFamily: B, fontSize: "10px", color: "#3A5A30" }}>
            {new Date(ticket.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Save hint */}
      {ticket.status === "active" && (
        <div style={{ background: "#E8F0E4", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "12px 16px", display: "flex", gap: "10px", alignItems: "center" }}>
          <IconLightning size={16} color="#4A7C59" />
          <span style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", lineHeight: 1.5 }}>
            Take a screenshot of this ticket to save it offline. Present the QR code at the event.
          </span>
        </div>
      )}

      {/* Change tier (self-serve). Only rendered while the ticket is active. */}
      {ticket.status === "active" && <TierChangeBlock ticketId={ticket.id} />}

      {/* Official receipt — always shown so members have proof of purchase
          even if the confirmation email didn't arrive (Resend daily cap,
          spam folder, typo'd address). Component includes Print button
          and its own print stylesheet. */}
      {receipt && <ReceiptBlock receipt={receipt as any} />}
    </div>
  );
}

// Pending-payment block: fetches the saved PayMongo checkout URL for
// this ticket and gives the buyer a big "COMPLETE PAYMENT" button so
// they can resume the payment session they abandoned earlier. If the
// original link is likely expired (~24h), offers to regenerate it.
function PendingPaymentBlock({ ticketId }: { ticketId: string }) {
  const [info, setInfo] = useState<{ checkout_url: string | null; link_maybe_expired: boolean; amount: number } | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/members/pending-payments")
      .then(r => (r.ok ? r.json() : { pending: [] }))
      .then((d: any) => {
        const match = (d.pending ?? []).find((p: any) => p.ticket_id === ticketId);
        if (match) setInfo({ checkout_url: match.checkout_url, link_maybe_expired: !!match.link_maybe_expired, amount: Number(match.amount ?? 0) });
      })
      .catch(() => {});
  }, [ticketId]);

  async function regenerate() {
    setRegenerating(true); setError("");
    try {
      const res = await fetch("/api/members/regenerate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketId }),
      });
      const d = await res.json();
      if (!res.ok || !d.checkout_url) throw new Error(d.error ?? "Could not regenerate link");
      window.location.href = d.checkout_url;
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
      setRegenerating(false);
    }
  }

  const R = "var(--font-righteous,'Righteous',sans-serif)";
  const B = "var(--font-barlow,'Barlow',sans-serif)";

  return (
    <div style={{ padding: "20px 24px 24px", textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontFamily: R, fontSize: "13px", color: "#B0731A", letterSpacing: "2px" }}>AWAITING PAYMENT</div>
        <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "6px" }}>
          Your ticket is being held while we wait for payment. Complete it below to activate.
        </div>
      </div>

      {info?.checkout_url && !info.link_maybe_expired && (
        <a href={info.checkout_url} style={{ display: "block", background: "#1A8040", color: "#FFFFFF", padding: "14px 20px", borderRadius: 10, fontFamily: R, fontSize: 13, letterSpacing: 1.5, textDecoration: "none" }}>
          COMPLETE PAYMENT{info.amount ? ` — ₱${info.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : ""}
        </a>
      )}

      {info?.checkout_url && info.link_maybe_expired && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontFamily: B, fontSize: 12, color: "#B0731A", background: "#FFF3D6", border: "1px solid #F0D889", borderRadius: 8, padding: "8px 12px" }}>
            Your original payment link is more than 24 hours old and may have expired. Regenerate a fresh link below.
          </div>
          <a href={info.checkout_url} style={{ background: "#F7FAF5", color: "#4A7C59", padding: "10px 14px", borderRadius: 10, fontFamily: B, fontSize: 12, textDecoration: "none", border: "1px solid #DDE8DD" }}>
            Try old link anyway
          </a>
          <button onClick={regenerate} disabled={regenerating}
            style={{ background: "#1A8040", color: "#FFFFFF", padding: "12px 20px", borderRadius: 10, fontFamily: R, fontSize: 13, letterSpacing: 1.5, border: "none", cursor: regenerating ? "wait" : "pointer" }}>
            {regenerating ? "GENERATING…" : "REGENERATE PAYMENT LINK"}
          </button>
        </div>
      )}

      {info && !info.checkout_url && (
        <button onClick={regenerate} disabled={regenerating}
          style={{ background: "#1A8040", color: "#FFFFFF", padding: "12px 20px", borderRadius: 10, fontFamily: R, fontSize: 13, letterSpacing: 1.5, border: "none", cursor: regenerating ? "wait" : "pointer" }}>
          {regenerating ? "GENERATING…" : "GET PAYMENT LINK"}
        </button>
      )}

      {error && <div style={{ fontFamily: B, fontSize: 12, color: "#CC3344" }}>{error}</div>}
    </div>
  );
}
