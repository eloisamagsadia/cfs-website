"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import { IconTicket, IconCheck, IconLightning } from "@/components/shared/Icons";

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
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
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
            <div style={{ padding: "24px", textAlign: "center" }}>
              <div style={{ marginBottom: "8px" }}><IconLightning size={36} color="#156530" /></div>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#156530", letterSpacing: "2px" }}>AWAITING PAYMENT</div>
              <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "6px" }}>Complete payment to activate your ticket</div>
            </div>
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

      {/* Official receipt — always shown so members have proof of purchase
          even if the confirmation email didn't arrive (Resend daily cap,
          spam folder, typo'd address). Renders differently for paid vs
          free vs comp tickets. */}
      {receipt && (
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", boxShadow: "0 4px 12px rgba(15,42,30,0.04)" }}>
          <div style={{ textAlign: "center", paddingBottom: "12px", borderBottom: "1px dashed #DDE8DD" }}>
            <div style={{ fontFamily: S, fontSize: "12px", letterSpacing: "3px", color: "#1B3A2D", fontWeight: 700 }}>OFFICIAL RECEIPT</div>
            <div style={{ fontFamily: "'Courier New',monospace", fontSize: "11px", color: "#7A8E7A", marginTop: "4px", letterSpacing: "1px" }}>
              REF #{(receipt.payment?.reference ?? receipt.ticket.ticket_number ?? receipt.ticket.id).slice(0, 20).toUpperCase()}
            </div>
          </div>

          <table style={{ width: "100%", marginTop: "12px", fontFamily: "'Courier New',monospace", color: "#1B3A2D", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "4px 0", fontSize: "12px" }}>{receipt.tier.name}{receipt.ticket.bundle_size > 1 ? ` × ${receipt.ticket.bundle_size}` : ""}</td>
                <td style={{ textAlign: "right", padding: "4px 0", fontSize: "12px" }}>
                  {receipt.tier.unit_price > 0
                    ? `₱${(receipt.tier.unit_price * receipt.ticket.bundle_size).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                    : "FREE"}
                </td>
              </tr>
              {receipt.payment && receipt.payment.fee > 0 && (
                <tr>
                  <td style={{ padding: "2px 0", fontSize: "11px", color: "#7A8E7A" }}>Payment processing fee</td>
                  <td style={{ textAlign: "right", padding: "2px 0", fontSize: "11px", color: "#7A8E7A" }}>
                    ₱{receipt.payment.fee.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
              <tr><td colSpan={2} style={{ borderTop: "1px dashed #DDE8DD", paddingTop: "8px" }}></td></tr>
              <tr>
                <td style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "1px" }}>{receipt.payment ? "TOTAL PAID" : "TOTAL"}</td>
                <td style={{ textAlign: "right", fontWeight: 700, fontSize: "14px", color: "#1A8040" }}>
                  {receipt.payment
                    ? `₱${receipt.payment.amount_paid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                    : (receipt.tier.unit_price > 0
                        ? `₱${(receipt.tier.unit_price * receipt.ticket.bundle_size).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                        : "FREE")}
                </td>
              </tr>
              {receipt.payment && (
                <>
                  <tr>
                    <td style={{ paddingTop: "10px", color: "#7A8E7A", fontSize: "10px", letterSpacing: "1.5px" }}>METHOD</td>
                    <td style={{ textAlign: "right", paddingTop: "10px", color: "#7A8E7A", fontSize: "10px", letterSpacing: "1px" }}>
                      {(receipt.payment.method ?? "ONLINE").toString().toUpperCase().replace(/_/g, " ")}
                    </td>
                  </tr>
                  {receipt.payment.paid_at && (
                    <tr>
                      <td style={{ color: "#7A8E7A", fontSize: "10px", letterSpacing: "1.5px" }}>PAID ON</td>
                      <td style={{ textAlign: "right", color: "#7A8E7A", fontSize: "10px" }}>
                        {new Date(receipt.payment.paid_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" })}
                      </td>
                    </tr>
                  )}
                </>
              )}
              {receipt.ticket.is_comp && (
                <tr>
                  <td colSpan={2} style={{ paddingTop: "10px", textAlign: "center" }}>
                    <span style={{ display: "inline-block", background: "#FFF3D6", border: "1px solid #F0D889", color: "#7A5A0F", fontSize: "10px", fontFamily: "'Courier New',monospace", letterSpacing: "1px", padding: "3px 10px", borderRadius: "999px" }}>
                      COMPLIMENTARY · ISSUED BY CFS ADMIN
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ textAlign: "center", marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #DDE8DD", fontFamily: B, fontSize: "10px", color: "#7A8E7A", letterSpacing: "0.5px", lineHeight: 1.6 }}>
            Keep this receipt in your account as proof of purchase.<br />
            If you didn&apos;t receive an email confirmation, this page is your record.
          </div>
        </div>
      )}
    </div>
  );
}
