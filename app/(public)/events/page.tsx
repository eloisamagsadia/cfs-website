import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import EventsBrowser from "@/components/public/EventsBrowser";
import RealtimeRefresh from "@/components/shared/RealtimeRefresh";
import { IconCalendar, IconPin, IconTicket, IconUsers } from "@/components/shared/Icons";

export const metadata: Metadata = { title: "Events — CFS" };
export const revalidate = 300;

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  paper:  "#FAFDF9",
  cream:  "#F2F7F2",
  mist:   "#E8F0E4",
  forest: "#1B3A2D",
  deep:   "#0F2A1E",
  sage:   "#4A7C59",
  border: "#DDE8DD",
  muted:  "#7A8E7A",
  green:  "#1A8040",
};

export default async function EventsPage() {
  const supabase = createAdminClient();
  const [{ data: allEvents }, { data: featured }] = await Promise.all([
    (supabase as any).from("events")
      .select("*")
      .eq("is_hidden", false)
      .order("date", { ascending: false }),
    (supabase as any).from("events")
      .select("id, title, date, banner_url, location, price, capacity, is_members_only, status")
      .eq("status", "upcoming")
      .eq("is_hidden", false)
      .order("date", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const rawEvents = (allEvents ?? []) as any[];
  const eventIds = rawEvents.map((e) => e.id);
  const { data: tiersRows } = eventIds.length
    ? await (supabase as any)
        .from("event_tiers")
        .select("event_id, price")
        .in("event_id", eventIds)
        .eq("is_active", true)
    : { data: [] as any[] };
  const tierPricesByEvent = new Map<string, number[]>();
  for (const t of (tiersRows ?? []) as any[]) {
    const arr = tierPricesByEvent.get(t.event_id) ?? [];
    arr.push(Number(t.price));
    tierPricesByEvent.set(t.event_id, arr);
  }
  const events = rawEvents.map((e) => {
    const prices = tierPricesByEvent.get(e.id);
    return {
      ...e,
      tier_min: prices?.length ? Math.min(...prices) : null,
      tier_max: prices?.length ? Math.max(...prices) : null,
    };
  });
  const upcoming  = events.filter(e => e.status === "upcoming").length;
  const ongoing   = events.filter(e => e.status === "ongoing").length;
  const completed = events.filter(e => e.status === "completed").length;

  const nextRaw = featured as any;
  const nextTiers = nextRaw ? tierPricesByEvent.get(nextRaw.id) : undefined;
  const next = nextRaw
    ? {
        ...nextRaw,
        tier_min: nextTiers?.length ? Math.min(...nextTiers) : null,
        tier_max: nextTiers?.length ? Math.max(...nextTiers) : null,
      }
    : null;
  const nextDate = next ? new Date(next.date) : null;
  const msLeft = nextDate ? nextDate.getTime() - Date.now() : 0;
  const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor(msLeft / (1000 * 60 * 60));
  const countdown = next
    ? daysLeft > 1 ? `${daysLeft} DAYS TO GO`
    : daysLeft === 1 ? "TOMORROW"
    : hoursLeft > 1 ? `${hoursLeft} HOURS TO GO`
    : "STARTING SOON"
    : null;

  return (
    <div style={{ minHeight: "100vh", background: C.paper }}>
      <RealtimeRefresh tables="events" />
      <style>{`
        @media (max-width: 900px) {
          .evl-hero-grid { grid-template-columns: 1fr !important; padding: 40px 24px !important; }
          .evl-hero-title { font-size: clamp(2rem, 8vw, 2.6rem) !important; }
          .evl-hero-stats { justify-content: flex-start !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", background: C.cream, borderBottom: `1px solid ${C.border}` }}>
        {/* Ambient background */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(700px 500px at 15% 20%, rgba(26,128,64,0.10), transparent 60%), radial-gradient(600px 400px at 100% 100%, rgba(74,124,89,0.08), transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(44,72,32,0.04) 1.5px,transparent 1.5px)", backgroundSize: "22px 22px" }} />

        <div className="evl-hero-grid" style={{ position: "relative", maxWidth: "1240px", margin: "0 auto", padding: "72px 48px", display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: "48px", alignItems: "center" }}>

          {/* Left: intro + stats */}
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.green, background: C.mist, border: `1px solid ${C.green}30`, borderRadius: "999px", padding: "5px 12px", letterSpacing: "2px", marginBottom: "24px" }}>
              <IconCalendar size={11} color={C.green} /> EVENTS HUB
            </span>

            <h1 className="evl-hero-title" style={{ fontFamily: S, fontSize: "clamp(2.6rem, 5vw, 4rem)", color: C.forest, lineHeight: 1.02, letterSpacing: "-1px", margin: "0 0 16px" }}>
              We Show Up.<br /><em style={{ fontStyle: "italic", color: C.sage }}>Together.</em>
            </h1>

            <p style={{ fontFamily: B, fontSize: "15px", color: C.muted, lineHeight: 1.9, maxWidth: "440px", margin: "0 0 28px" }}>
              Cup-sleeve events, meet-ups, and CFS-produced fan gatherings. Book your slot, show your card at the door, and pull up.
            </p>

            {/* Stat chips */}
            <div className="evl-hero-stats" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                { label: "TOTAL",     value: events.length, color: C.forest },
                { label: "UPCOMING",  value: upcoming,      color: "#1A8040" },
                { label: "ONGOING",   value: ongoing,       color: "#B78A1F" },
                { label: "COMPLETED", value: completed,     color: C.sage },
              ].map(s => (
                <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: `${s.color}12`, border: `1px solid ${s.color}30`, borderRadius: "999px" }}>
                  <span style={{ fontFamily: SG, fontSize: "18px", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: s.color, letterSpacing: "1.4px" }}>{s.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Right: featured next event card OR CTA */}
          {next ? (
            <Link href={`/events/${next.id}`} style={{ textDecoration: "none", display: "block" }}>
              <div style={{ background: C.deep, borderRadius: "20px", overflow: "hidden", boxShadow: "0 20px 60px rgba(15,42,30,0.25), 0 0 0 1px rgba(255,255,255,0.06)", position: "relative", transition: "transform 0.2s", cursor: "pointer" }}>
                {/* Banner */}
                <div style={{ position: "relative", aspectRatio: "16/9", background: C.forest }}>
                  {next.banner_url ? (
                    <img src={next.banner_url} alt={next.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${C.forest}, ${C.deep})` }}>
                      <IconCalendar size={54} color="rgba(255,255,255,0.25)" />
                    </div>
                  )}
                  {/* Top-fade + bottom-fade overlays so the pills + info panel stay readable over busy artwork */}
                  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(15,42,30,0.72) 0%, rgba(15,42,30,0.32) 22%, transparent 45%, transparent 60%, rgba(15,42,30,0.55) 100%)" }} />
                  {/* Overlay chip */}
                  <div style={{ position: "absolute", top: "16px", left: "16px", display: "flex", gap: "6px", zIndex: 2 }}>
                    <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: "#1A8040", borderRadius: "999px", padding: "5px 12px", letterSpacing: "1.5px", boxShadow: "0 2px 10px rgba(0,0,0,0.35)" }}>NEXT UP</span>
                    {countdown && (
                      <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: "rgba(15,42,30,0.85)", border: "1px solid rgba(74,203,110,0.55)", borderRadius: "999px", padding: "5px 12px", letterSpacing: "1.5px", backdropFilter: "blur(6px)", boxShadow: "0 2px 10px rgba(0,0,0,0.35)" }}>
                        {countdown}
                      </span>
                    )}
                  </div>
                  {/* Date badge */}
                  <div style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.98)", borderRadius: "12px", padding: "10px 14px", textAlign: "center", minWidth: "62px", boxShadow: "0 8px 20px rgba(0,0,0,0.35)", zIndex: 2 }}>
                    <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: C.sage, letterSpacing: "1.5px" }}>
                      {nextDate!.toLocaleDateString("en-PH", { month: "short", timeZone: "Asia/Manila" }).toUpperCase()}
                    </div>
                    <div style={{ fontFamily: S, fontSize: "24px", color: C.forest, lineHeight: 1 }}>
                      {nextDate!.toLocaleDateString("en-PH", { day: "numeric", timeZone: "Asia/Manila" })}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "20px 22px 22px" }}>
                  <h2 style={{ fontFamily: S, fontSize: "22px", color: "#ffffff", lineHeight: 1.15, margin: "0 0 12px", letterSpacing: "-0.3px" }}>{next.title}</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontFamily: B, fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <IconCalendar size={12} color="rgba(255,255,255,0.55)" />
                      {nextDate!.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })} · {nextDate!.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })}
                    </span>
                    {next.location && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <IconPin size={12} color="rgba(255,255,255,0.55)" /> {next.location}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {(() => {
                      const hasTiers = next.tier_min !== null && next.tier_min !== undefined;
                      const min = hasTiers ? Number(next.tier_min) : Number(next.price ?? 0);
                      const max = hasTiers ? Number(next.tier_max) : min;
                      const isFree = min === 0 && (!hasTiers || max === 0);
                      const label = isFree
                        ? "FREE"
                        : hasTiers && min !== max
                          ? `FROM ₱${min.toLocaleString()}`
                          : `₱${min.toLocaleString()}`;
                      return (
                        <span style={{ fontFamily: S, fontSize: "20px", color: isFree ? "#ffffff" : "#4ACB6E" }}>
                          {label}
                        </span>
                      );
                    })()}
                    <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#4ACB6E", letterSpacing: "1.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <IconTicket size={11} color="#4ACB6E" /> BOOK NOW →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            /* No upcoming events — decorative placeholder */
            <div style={{ background: "#ffffff", borderRadius: "20px", border: `1.5px dashed ${C.border}`, padding: "48px 32px", textAlign: "center" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: C.mist, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <IconCalendar size={32} color={C.sage} />
              </div>
              <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: C.forest, letterSpacing: "2px", marginBottom: "6px" }}>NOTHING SCHEDULED YET</div>
              <p style={{ fontFamily: B, fontSize: "13px", color: C.muted, margin: 0, lineHeight: 1.7 }}>Follow us on socials — we&apos;ll announce the next drop soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── FILTER + GRID (client) ── */}
      <EventsBrowser events={events} />
    </div>
  );
}
