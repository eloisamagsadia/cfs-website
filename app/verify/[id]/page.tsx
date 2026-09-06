import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import CheckInButton from "./CheckInButton";

const S  = "var(--font-dm-serif,'DM Serif Display',Georgia,serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const R  = "var(--font-righteous,'Righteous',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Ticket = {
  id: string;
  ticket_number: string;
  status: string;
  payment_status: string;
  user_id: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  events: { id: string; title: string; date: string; location: string | null; banner_url: string | null } | null;
  event_tiers: { name: string; price: number; color: string | null } | null;
  profiles: { id: string; display_name: string | null; avatar_url: string | null } | null;
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; note: string }> = {
  active:          { label: "VALID",             color: "#1A8040", bg: "#E8F0E4", border: "#1A8040", note: "This ticket is ready to be checked in at the door." },
  used:            { label: "ALREADY CHECKED IN", color: "#B0731A", bg: "#FFF3D6", border: "#E5B547", note: "This ticket has already been used." },
  cancelled:       { label: "CANCELLED",         color: "#CC3344", bg: "#FFE8EC", border: "#CC3344", note: "This ticket has been cancelled." },
  pending_payment: { label: "AWAITING PAYMENT",  color: "#B0731A", bg: "#FFF3D6", border: "#E5B547", note: "Payment for this ticket hasn't cleared yet." },
};

export default async function VerifyTicketPage({ params }: { params: { id: string } }) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  const isStaff = role === "admin" || role === "super_admin" || role === "moderator";

  const raw = decodeURIComponent(params.id ?? "").trim();
  const isTicketNumber = raw.toUpperCase().startsWith("CFS-");

  const supabase = createAdminClient();
  const { data } = await (supabase as any)
    .from("event_tickets")
    .select(`
      id, ticket_number, status, payment_status, user_id, checked_in_at, checked_in_by, created_at,
      events:event_id(id, title, date, location, banner_url),
      event_tiers:tier_id(name, price, color),
      profiles:user_id(id, display_name, avatar_url)
    `)
    .eq(isTicketNumber ? "ticket_number" : "id", isTicketNumber ? raw.toUpperCase() : raw)
    .maybeSingle();

  const ticket = data as Ticket | null;
  const isOwner = !!(userId && ticket?.user_id === userId);
  const canSeeAttendee = isStaff || isOwner;

  return (
    <div className="scrap-paper" style={{ minHeight: "100vh", padding: "36px 16px 48px", fontFamily: B, position: "relative", overflow: "hidden" }}>
      <div className="scrap-glow" />
      <div className="scrap-glow scrap-glow-pink" style={{ top: "auto", bottom: "-100px", left: "auto", right: "-80px" }} />

      <div style={{ maxWidth: "480px", margin: "0 auto", position: "relative" }}>

        {/* Brand */}
        <Link href="/" style={{ display: "block", textAlign: "center", textDecoration: "none", marginBottom: "14px" }}>
          <div style={{ marginBottom: "6px" }}>
            <span className="scrap-tape scrap-tape-mint">ticket check</span>
          </div>
          <div style={{ fontFamily: S, fontSize: "22px", color: "#1B3A2D", lineHeight: 1 }}>Colet Fan Suporta</div>
        </Link>

        {!ticket ? (
          <div style={{ background: "#FFFFFF", border: "2px solid #CC3344", borderRadius: "16px", padding: "36px 24px", textAlign: "center", boxShadow: "0 6px 24px rgba(27,58,45,0.08)" }}>
            <div style={{ fontFamily: R, fontSize: "18px", color: "#CC3344", letterSpacing: "2px" }}>TICKET NOT FOUND</div>
            <p style={{ fontSize: "13px", color: "#5A7A60", marginTop: "10px", lineHeight: 1.6 }}>
              The code <span style={{ fontFamily: "monospace", color: "#1B3A2D" }}>{raw}</span> doesn't match any ticket. Please double-check the QR or ticket ID.
            </p>
          </div>
        ) : (() => {
          const meta = STATUS_META[ticket.status] ?? { label: ticket.status.toUpperCase(), color: "#5A7A60", bg: "#EFF6EA", border: "#DDE8DD", note: "" };
          const ev = ticket.events;
          const dateStr = ev?.date ? new Date(ev.date).toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—";
          const timeStr = ev?.date ? new Date(ev.date).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";

          return (
            <div style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "16px", overflow: "hidden", boxShadow: "0 6px 24px rgba(27,58,45,0.08)" }}>

              {/* Banner or gradient */}
              {ev?.banner_url ? (
                <div style={{ position: "relative", width: "100%", height: "180px", overflow: "hidden" }}>
                  <Image src={ev.banner_url} alt={ev.title} fill sizes="480px" priority style={{ objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ height: "12px", background: "linear-gradient(90deg,#1A8040 0%,#4ACB6E 55%,#E5B547 100%)" }} />
              )}

              {/* Status pill + event */}
              <div style={{ padding: "22px 24px 8px", textAlign: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: meta.bg, color: meta.color, border: `1.5px solid ${meta.border}`, padding: "6px 14px", borderRadius: "999px", fontFamily: R, fontSize: "11px", letterSpacing: "2px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: meta.color }} />
                  {meta.label}
                </div>
                <h1 style={{ fontFamily: S, fontSize: "22px", lineHeight: 1.2, color: "#1B3A2D", margin: "12px 0 6px" }}>{ev?.title ?? "Untitled event"}</h1>
                <div style={{ fontSize: "13px", color: "#3A5A30" }}>{dateStr}</div>
                {ev?.location && <div style={{ fontSize: "12px", color: "#5A7A60", marginTop: "2px" }}>{timeStr} · {ev.location}</div>}
              </div>

              {/* Ticket code block */}
              <div style={{ padding: "16px 24px" }}>
                <div style={{ background: "#FAF6EE", border: "1px dashed #C7D6BE", borderRadius: "12px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#5A7A60" }}>TICKET ID</div>
                    <div style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: 700, color: "#1B3A2D", letterSpacing: "1.5px", marginTop: "2px" }}>{ticket.ticket_number}</div>
                  </div>
                  {ticket.event_tiers && (
                    <div style={{ display: "inline-block", background: (ticket.event_tiers.color ?? "#1A8040") + "18", color: ticket.event_tiers.color ?? "#1A8040", border: `1px solid ${ticket.event_tiers.color ?? "#1A8040"}40`, padding: "3px 10px", borderRadius: "999px", fontFamily: R, fontSize: "10px", letterSpacing: "1.5px" }}>
                      {ticket.event_tiers.name.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Attendee — only staff or owner */}
              {canSeeAttendee && ticket.profiles && (
                <div style={{ padding: "8px 24px 16px" }}>
                  <div style={{ background: "#F7FAF5", border: "1px solid #E4EDE4", borderRadius: "12px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#E8F0E4", border: "1.5px solid #DDE8DD", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                      {ticket.profiles.avatar_url
                        ? <Image src={ticket.profiles.avatar_url} alt="" fill sizes="44px" style={{ objectFit: "cover" }} />
                        : <span style={{ fontFamily: R, fontSize: "16px", color: "#1A8040" }}>{(ticket.profiles.display_name ?? "M")[0].toUpperCase()}</span>}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "10px", letterSpacing: "2px", color: "#5A7A60" }}>ATTENDEE</div>
                      <div style={{ fontSize: "14px", color: "#1B3A2D", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.profiles.display_name ?? "Member"}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status note + check-in history */}
              <div style={{ padding: "0 24px 20px" }}>
                {meta.note && (
                  <div style={{ fontSize: "12px", color: "#5A7A60", textAlign: "center", padding: "8px 0", lineHeight: 1.5 }}>{meta.note}</div>
                )}
                {ticket.status === "used" && ticket.checked_in_at && (
                  <div style={{ background: "#FFF9E6", border: "1px solid #E5B547", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#7A5A00", textAlign: "center", marginTop: "8px" }}>
                    Checked in {new Date(ticket.checked_in_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                  </div>
                )}
              </div>

              {/* Action zone */}
              <div style={{ padding: "0 24px 24px" }}>
                {!userId ? (
                  <Link href={`/sign-in?redirect_url=/verify/${encodeURIComponent(raw)}`} className="btn-fx btn-fx-primary" style={{ display: "block", textAlign: "center", background: "#1A8040", color: "#FFFFFF", textDecoration: "none", fontFamily: SG, fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", padding: "13px", borderRadius: "10px" }}>
                    SIGN IN AS STAFF TO CHECK IN
                  </Link>
                ) : !isStaff ? (
                  <div style={{ background: "#F7FAF5", border: "1px dashed #DDE8DD", borderRadius: "10px", padding: "14px", fontSize: "12px", color: "#5A7A60", textAlign: "center", lineHeight: 1.5 }}>
                    Only CFS staff can check in tickets at the door.
                    {isOwner && <div style={{ marginTop: "6px" }}><Link href="/members/tickets" style={{ color: "#1A8040", textDecoration: "none", fontWeight: 600 }}>View your tickets →</Link></div>}
                  </div>
                ) : ticket.status === "active" ? (
                  <CheckInButton ticketId={ticket.ticket_number ?? ticket.id} />
                ) : (
                  <Link href="/admin/check-in" style={{ display: "block", textAlign: "center", background: "#FFFFFF", color: "#1B3A2D", textDecoration: "none", fontFamily: SG, fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", padding: "12px", borderRadius: "10px", border: "1.5px solid #DDE8DD" }}>
                    SCAN NEXT TICKET
                  </Link>
                )}
              </div>
            </div>
          );
        })()}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "#5A7A60", lineHeight: 1.7 }}>
          <span className="scrap-note" style={{ fontSize: "16px", color: "#4A7C59", display: "block", marginBottom: "4px" }}>salamat ✦</span>
          <Link href="/" style={{ color: "#1A8040", textDecoration: "none" }}>coletfs.com</Link> · @coletfansuporta
        </div>
      </div>
    </div>
  );
}
