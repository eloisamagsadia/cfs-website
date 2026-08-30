import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import EventRegisterButton from "@/components/public/EventRegisterButton";
import type { Metadata } from "next";
import { IconCalendar, IconPin, IconUsers, IconTicket, IconSparkle } from "@/components/shared/Icons";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  paper:  "#FAFDF9",
  cream:  "#F2F7F2",
  mist:   "#E8F0E4",
  forest: "#0F2A1E",
  deep:   "#1B3A2D",
  sage:   "#4A7C59",
  border: "#E4EDE4",
  hair:   "#DDE8DD",
  muted:  "#7A8E7A",
  green:  "#1A8040",
  gold:   "#B78A1F",
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data: e } = await (supabase.from("events") as any).select("title, description").eq("id", params.id).single();
  return { title: (e as any)?.title ?? "Event", description: (e as any)?.description ?? "" };
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { userId, sessionClaims } = auth();
  const user = userId ? { id: userId } : null;
  const role = (sessionClaims?.metadata as any)?.role ?? "member";
  const isSponsor = ["sponsor", "admin", "super_admin"].includes(role);

  const [{ data: event }, { count: regCount }] = await Promise.all([
    (supabase.from("events") as any).select("*").eq("id", params.id).single(),
    (supabase as any).from("event_tickets").select("id", { count: "exact", head: true }).eq("event_id", params.id).neq("status", "cancelled"),
  ]);

  if (!event) notFound();

  const { data: tiers } = await (supabase as any).from("event_tiers").select("*").eq("event_id", params.id).eq("is_active", true).order("price", { ascending: true });

  let isRegistered = false;
  let existingTicketId: string | null = null;
  if (user) {
    const { data: reg } = await (supabase as any).from("event_tickets").select("id").eq("event_id", params.id).eq("user_id", userId).single();
    isRegistered = !!reg;
    existingTicketId = reg?.id ?? null;
  }

  const isFull = !!(event.capacity && (regCount ?? 0) >= event.capacity);
  const spotsLeft = event.capacity ? event.capacity - (regCount ?? 0) : null;
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();
  const statusColors: Record<string, { bg: string; fg: string }> = {
    upcoming:  { bg: "#1A8040", fg: "#ffffff" },
    ongoing:   { bg: "#B78A1F", fg: "#ffffff" },
    completed: { bg: "#7A8E7A", fg: "#ffffff" },
    cancelled: { bg: "#CC3344", fg: "#ffffff" },
  };
  const statusChip = statusColors[event.status] ?? { bg: "#7A8E7A", fg: "#ffffff" };
  const pct = event.capacity ? Math.min(((regCount ?? 0) / event.capacity) * 100, 100) : 0;

  const dateWeekday = eventDate.toLocaleDateString("en-PH", { weekday: "long", timeZone: "Asia/Manila" });
  const dateShort   = eventDate.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
  const dateMonth   = eventDate.toLocaleDateString("en-PH", { month: "short", timeZone: "Asia/Manila" }).toUpperCase();
  const dateDay     = eventDate.toLocaleDateString("en-PH", { day: "numeric", timeZone: "Asia/Manila" });
  const dateTime    = eventDate.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });

  return (
    <div style={{ minHeight: "100vh", background: C.paper }}>
      <style>{`
        @media (max-width: 960px) {
          .evd-hero-grid { grid-template-columns: 1fr !important; }
          .evd-hero-banner { min-height: 240px !important; aspect-ratio: 16/9 !important; }
          .evd-shell { padding: 24px !important; }
          .evd-title { font-size: clamp(2rem, 7vw, 2.6rem) !important; }
          .evd-body-grid { grid-template-columns: 1fr !important; }
          .evd-register-card { position: static !important; }
          .evd-details-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .evd-details-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ background: C.forest, color: "#ffffff", position: "relative", overflow: "hidden" }}>
        {/* Ambient gradient */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(1000px 500px at 20% -10%, rgba(26,128,64,0.25), transparent 60%), radial-gradient(800px 400px at 90% 110%, rgba(183,138,31,0.18), transparent 60%)" }} />

        <div className="evd-shell" style={{ position: "relative", maxWidth: "1240px", margin: "0 auto", padding: "40px 48px 64px" }}>
          <Link href="/events" style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.7)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "32px", letterSpacing: "1.5px" }}>
            <svg width="6" height="10" viewBox="0 0 6 10"><path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
            BACK TO EVENTS
          </Link>

          <div className="evd-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "44px", alignItems: "center" }}>

            {/* Banner card (left) */}
            <div className="evd-hero-banner" style={{ position: "relative", aspectRatio: "4/3", borderRadius: "20px", overflow: "hidden", background: C.deep, boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)" }}>
              {event.banner_url ? (
                <img src={event.banner_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${C.deep} 0%, ${C.forest} 100%)` }}>
                  <IconCalendar size={64} color="rgba(255,255,255,0.28)" />
                </div>
              )}
              {/* Date badge overlay */}
              <div style={{ position: "absolute", top: "18px", left: "18px", background: "rgba(255,255,255,0.96)", borderRadius: "14px", padding: "10px 14px", minWidth: "68px", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
                <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "2px" }}>{dateMonth}</div>
                <div style={{ fontFamily: S, fontSize: "28px", color: C.forest, lineHeight: 1 }}>{dateDay}</div>
              </div>
            </div>

            {/* Info column (right) */}
            <div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "22px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "10px", fontWeight: 700, color: statusChip.fg, background: statusChip.bg, borderRadius: "999px", padding: "5px 12px", letterSpacing: "1.5px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor", opacity: 0.85 }} />
                  {event.status.toUpperCase()}
                </span>
                {event.is_members_only && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.gold, background: "rgba(183,138,31,0.16)", border: "1px solid rgba(183,138,31,0.4)", borderRadius: "999px", padding: "5px 12px", letterSpacing: "1.5px" }}>
                    <IconSparkle size={10} color={C.gold} /> MEMBERS ONLY
                  </span>
                )}
                {event.capacity && spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 20 && (
                  <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#F5C242", background: "rgba(245,194,66,0.16)", border: "1px solid rgba(245,194,66,0.4)", borderRadius: "999px", padding: "5px 12px", letterSpacing: "1.5px" }}>
                    ONLY {spotsLeft} SPOT{spotsLeft === 1 ? "" : "S"} LEFT
                  </span>
                )}
              </div>

              <h1 className="evd-title" style={{ fontFamily: S, fontSize: "clamp(2.2rem, 4.6vw, 3.6rem)", color: "#ffffff", lineHeight: 1.05, margin: "0 0 20px", letterSpacing: "-0.5px" }}>
                {event.title}
              </h1>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IconCalendar size={16} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontFamily: B, fontSize: "14px", color: "#ffffff", fontWeight: 600 }}>{dateWeekday}, {dateShort}</div>
                    <div style={{ fontFamily: B, fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>{dateTime} · Manila time</div>
                  </div>
                </div>
                {event.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <IconPin size={16} color="#ffffff" />
                    </div>
                    <div>
                      <div style={{ fontFamily: B, fontSize: "14px", color: "#ffffff", fontWeight: 600 }}>{event.location}</div>
                      {event.map_url && (
                        <a href={event.map_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: B, fontSize: "12px", color: "rgba(255,255,255,0.55)", textDecoration: "underline" }}>Open in maps</a>
                      )}
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <IconUsers size={16} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontFamily: B, fontSize: "14px", color: "#ffffff", fontWeight: 600 }}>
                      {regCount ?? 0} registered{event.capacity ? ` / ${event.capacity}` : ""}
                    </div>
                    <div style={{ fontFamily: B, fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>
                      {event.capacity ? (isFull ? "This event is fully booked" : `${spotsLeft} spots remaining`) : "Unlimited capacity"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability bar */}
              {event.capacity && (
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: isFull ? "#CC3344" : "linear-gradient(90deg, #1A8040, #4ACB6E)", borderRadius: "999px", transition: "width 0.5s" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── BODY ─────────────────────────────────────────────── */}
      <div className="evd-shell evd-body-grid" style={{ maxWidth: "1240px", margin: "0 auto", padding: "56px 48px 96px", display: "grid", gridTemplateColumns: "1fr 360px", gap: "36px", alignItems: "start" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {event.description && (
            <div style={{ background: "#ffffff", borderRadius: "18px", padding: "28px 32px", boxShadow: "0 1px 0 rgba(15,42,30,0.04), 0 8px 24px rgba(15,42,30,0.05)" }}>
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "2.5px", marginBottom: "14px" }}>ABOUT THIS EVENT</div>
              <p style={{ fontFamily: B, fontSize: "15px", color: C.deep, lineHeight: 1.85, margin: 0, whiteSpace: "pre-wrap" }}>{event.description}</p>
            </div>
          )}

          {(event.guidelines_url || event.guidelines_text) && (
            <div style={{ background: "#ffffff", borderRadius: "18px", padding: "28px 32px", boxShadow: "0 1px 0 rgba(15,42,30,0.04), 0 8px 24px rgba(15,42,30,0.05)" }}>
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "2.5px", marginBottom: "14px" }}>GUIDELINES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {event.guidelines_url && (
                  <a href={event.guidelines_url} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "12px", overflow: "hidden", border: `1px solid ${C.hair}`, background: C.cream }}>
                    <img src={event.guidelines_url} alt="Event guidelines" style={{ width: "100%", maxHeight: "520px", objectFit: "contain", display: "block" }} />
                  </a>
                )}
                {event.guidelines_text && (
                  <p style={{ fontFamily: B, fontSize: "14px", color: C.deep, lineHeight: 1.9, margin: 0, whiteSpace: "pre-wrap" }}>{event.guidelines_text}</p>
                )}
              </div>
            </div>
          )}

          <div style={{ background: "#ffffff", borderRadius: "18px", padding: "28px 32px", boxShadow: "0 1px 0 rgba(15,42,30,0.04), 0 8px 24px rgba(15,42,30,0.05)" }}>
            <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "2.5px", marginBottom: "18px" }}>EVENT DETAILS</div>
            <div className="evd-details-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px 24px" }}>
              {[
                { label: "Date",     value: dateShort },
                { label: "Time",     value: dateTime },
                { label: "Location", value: event.location || "TBA" },
                { label: "Price",    value: event.price > 0 ? `₱${Number(event.price).toLocaleString()}` : "Free" },
                { label: "Capacity", value: event.capacity ? `${event.capacity} slots` : "Unlimited" },
                { label: "Registered", value: `${regCount ?? 0}${event.capacity ? ` of ${event.capacity}` : ""}` },
                ...(event.sponsor_access_at ? [{ label: "Sponsor early access", value: new Date(event.sponsor_access_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }) + " PHT" }] : []),
                ...(event.member_access_at ? [{ label: "General registration",  value: new Date(event.member_access_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }) + " PHT" }] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{ paddingLeft: "12px", borderLeft: `2px solid ${C.mist}` }}>
                  <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontFamily: B, fontSize: "14px", color: C.deep, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — register card */}
        <div className="evd-register-card" style={{ position: "sticky", top: "88px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#ffffff", borderRadius: "18px", overflow: "hidden", boxShadow: "0 1px 0 rgba(15,42,30,0.04), 0 12px 32px rgba(15,42,30,0.08)" }}>
            {/* Price header */}
            <div style={{ background: `linear-gradient(135deg, ${C.forest} 0%, ${C.deep} 100%)`, padding: "22px 24px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(400px 200px at 100% 0%, rgba(74,203,110,0.18), transparent 60%)" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "2.5px", marginBottom: "6px" }}>
                  {event.price > 0 ? "TICKET PRICE" : "REGISTRATION"}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <div style={{ fontFamily: S, fontSize: "2.2rem", color: "#ffffff", lineHeight: 1 }}>
                    {event.price > 0 ? `₱${Number(event.price).toLocaleString()}` : "Free"}
                  </div>
                  {event.price > 0 && <div style={{ fontFamily: B, fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>per person</div>}
                </div>
              </div>
            </div>

            {/* Availability + button */}
            <div style={{ padding: "22px 24px" }}>
              {event.capacity && (
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                      {isFull ? "Fully booked" : `${spotsLeft} spots left`}
                    </span>
                    <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: isFull ? "#CC3344" : C.green }}>{regCount ?? 0}/{event.capacity}</span>
                  </div>
                  <div style={{ background: C.mist, borderRadius: "999px", height: "6px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: isFull ? "#CC3344" : "linear-gradient(90deg, #1A8040, #4ACB6E)", borderRadius: "999px", transition: "width 0.5s" }} />
                  </div>
                </div>
              )}
              {!isPast && event.status !== "cancelled" ? (
                <EventRegisterButton event={event} isLoggedIn={!!user} isRegistered={isRegistered} isFull={isFull} tiers={tiers ?? []} existingTicketId={existingTicketId} isSponsor={isSponsor} />
              ) : (
                <div style={{ background: C.cream, border: `1px dashed ${C.hair}`, borderRadius: "12px", padding: "16px", textAlign: "center", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: C.muted, letterSpacing: "2px" }}>
                  {event.status === "cancelled" ? "EVENT CANCELLED" : "EVENT HAS ENDED"}
                </div>
              )}
            </div>

            {/* Trust row */}
            <div style={{ borderTop: `1px solid ${C.hair}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: "10px", background: C.cream }}>
              <IconTicket size={14} color={C.sage} />
              <span style={{ fontFamily: B, fontSize: "11px", color: C.muted, lineHeight: 1.5 }}>
                Secure checkout via PayMongo. Ticket emailed to you after payment.
              </span>
            </div>
          </div>

          {/* Share card */}
          <div style={{ background: "#ffffff", borderRadius: "18px", padding: "18px 22px", boxShadow: "0 1px 0 rgba(15,42,30,0.04), 0 8px 24px rgba(15,42,30,0.05)" }}>
            <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "2.5px", marginBottom: "12px" }}>SHARE THIS EVENT</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { label: "Twitter", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(event.title)}` },
                { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=` },
                { label: "Copy Link", href: "#" },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, textAlign: "center", fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.deep, background: C.cream, border: `1px solid ${C.hair}`, borderRadius: "8px", padding: "8px 6px", cursor: "pointer", textDecoration: "none", letterSpacing: "1px" }}>
                  {s.label.toUpperCase()}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
