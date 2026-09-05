import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import EventRegisterButton from "@/components/public/EventRegisterButton";
import { enrichTiersWithRemaining } from "@/lib/event-tier-slots";
import type { Metadata } from "next";
import { IconCalendar, IconPin, IconUsers, IconTicket, IconSparkle, IconTag, IconClipboard, IconStar, IconCheck } from "@/components/shared/Icons";
import EventShareRow from "@/components/public/EventShareRow";
export const revalidate = 300;

// Hide the "X registered / Y" counts and the capacity progress bar from
// the public event page. The Fully-booked state is still surfaced (so
// buyers know they can't register) but the exact counts stay internal.
// Admins still see full capacity on /admin/events dashboards.
// Flip to true to show them publicly again.
const SHOW_PUBLIC_CAPACITY = false;

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
  const { data: e } = await (supabase.from("events") as any).select("title, description").eq("id", params.id).maybeSingle();
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
    (supabase as any).from("event_tickets").select("id", { count: "exact", head: true }).eq("event_id", params.id).in("status", ["active", "used"]),
  ]);

  if (!event) notFound();

  const { data: tiersRaw } = await (supabase as any).from("event_tiers").select("*").eq("event_id", params.id).eq("is_active", true).order("price", { ascending: true });
  // Overlay live per-tier remaining count; stored slots_remaining is not decremented anywhere.
  const tiers = await enrichTiersWithRemaining(supabase, params.id, (tiersRaw ?? []) as any[]);

  let isRegistered = false;
  let existingTicketId: string | null = null;
  if (user) {
    const { data: regs } = await (supabase as any).from("event_tickets").select("id").eq("event_id", params.id).eq("user_id", userId).order("created_at", { ascending: true }).limit(1);
    const reg = regs?.[0];
    isRegistered = !!reg;
    existingTicketId = reg?.id ?? null;
  }

  // Tier-aware price: when tiers exist they are the source of truth. Fall
  // back to event.price for events without tiers. Never show the raw
  // event.price when tiers exist — it drifts from real ticket prices.
  const activeTiers = ((tiers ?? []) as any[]).filter((t) => t && Number(t.price) >= 0);
  const tierPrices = activeTiers.map((t) => Number(t.price)).filter((p) => !Number.isNaN(p));
  const tierMin = tierPrices.length ? Math.min(...tierPrices) : null;
  const tierMax = tierPrices.length ? Math.max(...tierPrices) : null;
  const hasTiers = tierMin !== null;
  const priceIsFree = hasTiers ? tierMin === 0 : !(event.price > 0);
  const fmt = (n: number) => `₱${Number(n).toLocaleString()}`;
  const priceHeadline = priceIsFree
    ? "Free"
    : hasTiers
      ? tierMin === tierMax
        ? fmt(tierMin!)
        : `${fmt(tierMin!)} – ${fmt(tierMax!)}`
      : fmt(Number(event.price));
  const priceHeadlineLabel = priceIsFree
    ? undefined
    : hasTiers && tierMin !== tierMax
      ? "price range"
      : "per person";
  const priceTileValue = priceIsFree ? "Free" : hasTiers && tierMin !== tierMax ? `From ${fmt(tierMin!)}` : fmt(hasTiers ? tierMin! : Number(event.price));
  const priceTileSub = priceIsFree ? undefined : hasTiers && tierMin !== tierMax ? "starting from" : "per ticket";

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

  // Countdown chip: "14 days to go", "2 hours to go", "starting now"
  const msLeft = eventDate.getTime() - Date.now();
  const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
  let countdown: string | null = null;
  if (!isPast) {
    if (daysLeft > 1) countdown = `${daysLeft} days to go`;
    else if (daysLeft === 1) countdown = "Tomorrow";
    else if (hoursLeft > 1) countdown = `${hoursLeft} hours to go`;
    else if (hoursLeft >= 0) countdown = "Starting soon";
  }

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
                <Image src={event.banner_url} alt={event.title} fill sizes="(max-width: 768px) 100vw, 720px" priority style={{ objectFit: "cover" }} />
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
                {SHOW_PUBLIC_CAPACITY ? (
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
                ) : (
                  isFull && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#CC334425", border: "1px solid #CC334480", borderRadius: "999px", padding: "6px 14px" }}>
                      <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffcccc", letterSpacing: "1.5px" }}>FULLY BOOKED</span>
                    </div>
                  )
                )}
              </div>

              {/* Availability bar — internal only */}
              {SHOW_PUBLIC_CAPACITY && event.capacity && (
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "2.5px" }}>EVENT DETAILS</div>
              {countdown && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.green, background: C.mist, borderRadius: "999px", padding: "5px 12px", letterSpacing: "1px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.green, boxShadow: `0 0 0 4px ${C.mist}` }} />
                  {countdown.toUpperCase()}
                </span>
              )}
            </div>

            <div className="evd-details-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {(() => {
                const tiles: { icon: React.ReactNode; label: string; value: string; sub?: string }[] = [
                  { icon: <IconCalendar size={16} color={C.green} />, label: "Date",      value: dateShort,                                         sub: dateWeekday },
                  { icon: <IconClipboard size={16} color={C.green} />, label: "Time",     value: dateTime,                                          sub: "Manila time" },
                  { icon: <IconPin size={16} color={C.green} />,      label: "Location", value: event.location || "TBA" },
                  { icon: <IconTag size={16} color={C.green} />,      label: "Price",    value: priceTileValue,                                    sub: priceTileSub },
                ];
                if (SHOW_PUBLIC_CAPACITY) {
                  tiles.push({ icon: <IconUsers size={16} color={C.green} />,  label: "Capacity",   value: event.capacity ? `${event.capacity}` : "Unlimited", sub: event.capacity ? "attendees" : undefined });
                  tiles.push({ icon: <IconTicket size={16} color={C.green} />, label: "Registered", value: `${regCount ?? 0}`,                              sub: event.capacity ? `of ${event.capacity}` : undefined });
                }
                if (event.sponsor_access_at) tiles.push({ icon: <IconSparkle size={16} color={C.green} />, label: "Sponsor early access", value: new Date(event.sponsor_access_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }), sub: "PHT" });
                if (event.member_access_at)  tiles.push({ icon: <IconStar size={16} color={C.green} />,    label: "General registration", value: new Date(event.member_access_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" }), sub: "PHT" });
                return tiles.map(({ icon, label, value, sub }) => (
                  <div key={label} style={{ background: C.cream, border: `1px solid ${C.hair}`, borderRadius: "12px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#ffffff", border: `1px solid ${C.hair}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {icon}
                      </div>
                      <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase" }}>{label}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: B, fontSize: "14px", color: C.deep, fontWeight: 600, lineHeight: 1.25 }}>{value}</div>
                      {sub && <div style={{ fontFamily: B, fontSize: "11px", color: C.muted, marginTop: "2px" }}>{sub}</div>}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Right column — register card */}
        <div className="evd-register-card" style={{ position: "sticky", top: "88px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#ffffff", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 0 rgba(15,42,30,0.04), 0 20px 44px rgba(15,42,30,0.10)" }}>
            {/* Price header */}
            <div style={{ background: `linear-gradient(135deg, ${C.forest} 0%, ${C.deep} 100%)`, padding: "24px 26px 22px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(500px 260px at 100% 0%, rgba(74,203,110,0.22), transparent 60%)" }} />
              {/* decorative sparkle grid */}
              <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "14px 14px", opacity: 0.4 }} />

              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "2.5px" }}>
                    {priceIsFree ? "REGISTRATION" : "TICKET PRICE"}
                  </div>
                  {countdown && (
                    <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4ACB6E", background: "rgba(74,203,110,0.16)", border: "1px solid rgba(74,203,110,0.3)", borderRadius: "999px", padding: "3px 9px", letterSpacing: "1px" }}>
                      {countdown.toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ fontFamily: S, fontSize: "2.4rem", color: "#ffffff", lineHeight: 1, letterSpacing: "-1px" }}>
                    {priceHeadline}
                  </div>
                  {priceHeadlineLabel && <div style={{ fontFamily: B, fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>{priceHeadlineLabel}</div>}
                </div>
              </div>
            </div>

            {/* Availability + perks + button */}
            <div style={{ padding: "22px 24px" }}>
              {SHOW_PUBLIC_CAPACITY && event.capacity && (
                <div style={{ marginBottom: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.muted, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                      {isFull ? "Fully booked" : `${spotsLeft} spots left`}
                    </span>
                    <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: isFull ? "#CC3344" : C.green }}>{regCount ?? 0}/{event.capacity}</span>
                  </div>
                  <div style={{ background: C.mist, borderRadius: "999px", height: "8px", overflow: "hidden", position: "relative" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: isFull ? "#CC3344" : "linear-gradient(90deg, #1A8040, #4ACB6E)", borderRadius: "999px", transition: "width 0.5s", boxShadow: isFull ? "none" : "0 0 12px rgba(74,203,110,0.5)" }} />
                  </div>
                </div>
              )}
              {!SHOW_PUBLIC_CAPACITY && isFull && (
                <div style={{ marginBottom: "18px", padding: "10px 14px", background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#CC3344", letterSpacing: "1.5px" }}>FULLY BOOKED</span>
                </div>
              )}

              {/* Perks */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px", padding: "14px 16px", background: C.cream, borderRadius: "12px", border: `1px solid ${C.hair}` }}>
                {[
                  event.price > 0 ? "Instant e-ticket after payment" : "Instant e-ticket confirmation",
                  "QR-code check-in at the venue",
                  event.is_members_only ? "Members-only exclusive access" : "Open to all fans",
                ].map(p => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <IconCheck size={10} color="#ffffff" />
                    </div>
                    <span style={{ fontFamily: B, fontSize: "12px", color: C.deep, fontWeight: 500 }}>{p}</span>
                  </div>
                ))}
              </div>

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
            <EventShareRow title={event.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
