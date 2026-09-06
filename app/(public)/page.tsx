import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { IconCalendar, IconPin, IconTicket, IconUsers, IconHeart } from "@/components/shared/Icons";
import RealtimeRefresh from "@/components/shared/RealtimeRefresh";

export const revalidate = 300;


export const metadata: Metadata = {
  title: "Home",
  description: "CFS (Colet Fan Suporta) — the Bini Colet fan-support community. See our upcoming events.",
};

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const H  = "var(--font-caveat, cursive)";

const C = {
  paper:  "#FAFDF9",
  cream:  "#F2F7F2",
  mist:   "#E8F0E4",
  forest: "#1B3A2D",
  sage:   "#4A7C59",
  border: "#DDE8DD",
  muted:  "#7A8E7A",
  green:  "#1A8040",
};

export default async function HomePage() {
  const supabase = createAdminClient();
  const [{ data: rawEvents }, { count: memberCount }] = await Promise.all([
    (supabase.from("events") as any)
      .select("id, title, date, banner_url, location, price, capacity")
      .eq("status", "upcoming")
      .eq("is_hidden", false)
      .order("date", { ascending: true })
      .limit(6),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  const homeEventIds = (rawEvents ?? []).map((e: any) => e.id);
  const { data: homeTiersRows } = homeEventIds.length
    ? await (supabase as any)
        .from("event_tiers")
        .select("event_id, price")
        .in("event_id", homeEventIds)
        .eq("is_active", true)
    : { data: [] as any[] };
  const homeTierPrices = new Map<string, number[]>();
  for (const t of (homeTiersRows ?? []) as any[]) {
    const arr = homeTierPrices.get(t.event_id) ?? [];
    arr.push(Number(t.price));
    homeTierPrices.set(t.event_id, arr);
  }
  const upcoming = ((rawEvents ?? []) as any[]).map((e) => {
    const prices = homeTierPrices.get(e.id);
    return {
      ...e,
      tier_min: prices?.length ? Math.min(...prices) : null,
      tier_max: prices?.length ? Math.max(...prices) : null,
    };
  });

  const nextEvent = upcoming[0];
  const upcomingCount = upcoming.length;
  const nextDaysAway = nextEvent ? Math.max(0, Math.ceil((new Date(nextEvent.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div className="scrap-paper" style={{ minHeight: "100vh" }}>
      <RealtimeRefresh tables="events" />

      {/* ── HERO ── cozy scrapbook: warm lamp glow, washi tape label,
          polaroid placeholder, framed "next event" card */}
      <section style={{ position: "relative", overflow: "hidden", padding: "56px 24px 72px" }}>
        <div className="scrap-glow" />
        <div className="scrap-glow" style={{ top: "auto", bottom: "-120px", left: "auto", right: "-120px", background: "radial-gradient(circle, rgba(240, 180, 200, 0.30), transparent 65%)" }} />

        <div className="hero-grid" style={{ position: "relative", maxWidth: "1120px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "48px", alignItems: "center" }}>

          {/* Left: copy + CTAs */}
          <div>
            <div style={{ marginBottom: "22px" }}>
              <span className="scrap-tape scrap-tape-mint">Bini Colet Fan Society</span>
            </div>

            <h1 style={{ fontFamily: S, fontSize: "clamp(2.6rem, 7vw, 4.6rem)", color: "#1B3A2D", margin: "0 0 10px", lineHeight: 1.05, letterSpacing: "-1px" }}>
              Colet Fan Suporta
            </h1>

            <p className="scrap-note" style={{ fontSize: "clamp(1.5rem, 3.4vw, 2rem)", color: "#4A7C59", margin: "0 0 20px", lineHeight: 1.15 }}>
              The Ace is on her way — and we&apos;re here for her.
            </p>

            <p style={{ fontFamily: B, fontSize: "15px", color: "#1B3A2D", maxWidth: "480px", margin: "0 0 28px", lineHeight: 1.75 }}>
              A community for Iu-ers — where we buy tickets together, throw fan events, and cheer Colet on. Come hang out.
            </p>

            {/* CTA row */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "22px" }}>
              <Link href="/events" className="btn-fx btn-fx-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, background: "#1B3A2D", color: "#ffffff", padding: "13px 26px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px" }}>
                <IconCalendar size={14} color="#ffffff" /> SEE ALL EVENTS
              </Link>
              <Link href="/sign-up" className="btn-fx btn-fx-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, color: "#1B3A2D", background: "#FFFFFF", border: "1.5px solid #DDE8DD", padding: "12px 24px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px" }}>
                <IconHeart size={14} color="#1B3A2D" /> JOIN THE FAM ✦
              </Link>
            </div>

            {/* Proof pills */}
            <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", alignItems: "center", fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <IconUsers size={12} color="#4A7C59" />
                <strong style={{ color: "#0F2A1E" }}>{(memberCount ?? 0).toLocaleString()}</strong> members strong
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <IconCalendar size={12} color="#4A7C59" />
                <strong style={{ color: "#0F2A1E" }}>{upcomingCount}</strong> upcoming event{upcomingCount === 1 ? "" : "s"}
              </span>
              {nextEvent && nextDaysAway !== null && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#FFF3D6", border: "1px solid #F0C48A", padding: "3px 10px", borderRadius: "999px", color: "#4A7C59" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1A8040" }} />
                  Next event in <strong>{nextDaysAway === 0 ? "today" : `${nextDaysAway} day${nextDaysAway === 1 ? "" : "s"}`}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Right: framed collage — polaroid + next-event poster */}
          <div className="hero-collage" style={{ position: "relative", height: "440px" }}>
            {/* Polaroid — top-left, tilted left */}
            <div className="scrap-polaroid scrap-polaroid-tilt-left" style={{ position: "absolute", top: "12px", left: "8%", width: "168px", zIndex: 2, borderRadius: 2 }}>
              <div className="scrap-polaroid-photo" style={{ borderRadius: 2 }}>♥</div>
              <div className="scrap-polaroid-caption">colet ✦</div>
            </div>

            {/* Small washi note — top-right */}
            <div style={{ position: "absolute", top: "0px", right: "12%", zIndex: 3 }}>
              <span className="scrap-tape scrap-tape-pink" style={{ transform: "rotate(6deg)" }}>iu-ers hangout</span>
            </div>

            {/* Framed "next event" card — center-right, tilted right */}
            {nextEvent ? (
              <Link href={`/events/${nextEvent.id}`} className="scrap-frame" style={{ position: "absolute", top: "90px", right: "6%", width: "295px", transform: "rotate(2.5deg)", textDecoration: "none", display: "block", zIndex: 1, borderRadius: 4 }}>
                <div className="scrap-frame-inner" style={{ padding: "14px 14px 16px" }}>
                  <div style={{ display: "inline-block", background: "#1A8040", color: "#ffffff", fontFamily: SG, fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", padding: "3px 10px", borderRadius: "999px", marginBottom: "10px" }}>
                    NEXT UP
                  </div>
                  <div style={{ fontFamily: S, fontSize: "20px", color: "#1B3A2D", lineHeight: 1.15, marginBottom: "10px" }}>{nextEvent.title}</div>
                  <div style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <IconCalendar size={11} color="#7A5A0F" />
                      {new Date(nextEvent.date).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Manila" })}
                      {" · "}
                      {new Date(nextEvent.date).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })}
                    </span>
                    {nextEvent.location && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <IconPin size={11} color="#7A5A0F" /> {nextEvent.location}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #DDE8DD", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040", letterSpacing: "1px" }}>
                    <span>BOOK YOUR SLOT</span>
                    <IconTicket size={12} color="#1A8040" />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="scrap-frame" style={{ position: "absolute", top: "90px", right: "6%", width: "260px", transform: "rotate(2.5deg)", zIndex: 1, borderRadius: 4 }}>
                <div className="scrap-frame-inner" style={{ padding: "22px 18px", textAlign: "center" }}>
                  <div className="scrap-note" style={{ fontSize: "18px", color: "#0F2A1E" }}>Next event coming soon ✦</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; text-align: center; }
            .hero-collage { height: 340px !important; max-width: 480px; margin: 0 auto; }
          }
          @media (max-width: 560px) {
            .hero-collage { height: 300px !important; }
            .hero-collage .scrap-polaroid { width: 130px !important; left: 4% !important; }
            .hero-collage .scrap-frame { width: 220px !important; right: 4% !important; top: 70px !important; }
          }
        `}</style>
      </section>

      {/* ── UPCOMING EVENTS ── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 24px 96px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
          <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "3px" }}>UPCOMING EVENTS</span>
          <div style={{ flex: 1, height: "1px", background: C.border }} />
        </div>

        {upcoming.length === 0 ? (
          <div style={{ background: "#ffffff", border: `1px dashed ${C.border}`, borderRadius: "14px", padding: "48px 24px", textAlign: "center" }}>
            <div style={{ marginBottom: "12px" }}>
              <IconCalendar size={32} color="#DDE8DD" />
            </div>
            <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: C.sage, letterSpacing: "2px", marginBottom: "6px" }}>NOTHING SCHEDULED YET</div>
            <p style={{ fontFamily: B, fontSize: "13px", color: C.muted, margin: 0, lineHeight: 1.6 }}>
              Follow us on socials — we&apos;ll announce the next drop soon.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {upcoming.map(ev => {
              const date = new Date(ev.date);
              return (
                <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", transition: "transform 0.15s, border-color 0.15s" }} className="home-event-card">
                  <div style={{ aspectRatio: "16/9", background: C.mist, position: "relative", overflow: "hidden" }}>
                    {ev.banner_url ? (
                      <img src={ev.banner_url} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IconCalendar size={36} color="#B7CDB7" />
                      </div>
                    )}
                    <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(255,255,255,0.94)", borderRadius: "8px", padding: "6px 10px", textAlign: "center", minWidth: "48px" }}>
                      <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: C.sage, letterSpacing: "1.5px" }}>
                        {date.toLocaleDateString("en-PH", { month: "short", timeZone: "Asia/Manila" }).toUpperCase()}
                      </div>
                      <div style={{ fontFamily: S, fontSize: "20px", color: C.forest, lineHeight: 1 }}>
                        {date.toLocaleDateString("en-PH", { day: "numeric", timeZone: "Asia/Manila" })}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                    <div style={{ fontFamily: S, fontSize: "18px", color: C.forest, lineHeight: 1.25 }}>{ev.title}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontFamily: B, fontSize: "12px", color: C.muted }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <IconCalendar size={12} color="#7A8E7A" />
                        <span>{date.toLocaleDateString("en-PH", { weekday: "short", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })} · {date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })}</span>
                      </div>
                      {ev.location && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <IconPin size={12} color="#7A8E7A" />
                          <span>{ev.location}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
                      {(() => {
                        const hasTiers = ev.tier_min !== null && ev.tier_min !== undefined;
                        const min = hasTiers ? Number(ev.tier_min) : Number(ev.price ?? 0);
                        const max = hasTiers ? Number(ev.tier_max) : min;
                        const isFree = min === 0 && (!hasTiers || max === 0);
                        const label = isFree
                          ? "FREE"
                          : hasTiers && min !== max
                            ? `FROM ₱${min.toLocaleString()}`
                            : `₱${min.toLocaleString()}`;
                        return (
                          <span style={{ fontFamily: S, fontSize: "17px", color: isFree ? C.sage : C.green }}>
                            {label}
                          </span>
                        );
                      })()}
                      <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: C.green, letterSpacing: "1.5px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <IconTicket size={11} color="#1A8040" /> BOOK →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <style>{`
          .home-event-card:hover { transform: translateY(-2px); border-color: #1A8040 !important; }
        `}</style>
      </section>
    </div>
  );
}
