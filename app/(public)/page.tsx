import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { IconCalendar, IconPin, IconTicket, IconUsers, IconHeart } from "@/components/shared/Icons";
import RealtimeRefresh from "@/components/shared/RealtimeRefresh";
import { getColetLetters, LETTERS_MEDIUM_URL } from "@/lib/letters";
import HomeLettersGrid from "@/components/public/HomeLettersGrid";
import HomeCountdown from "@/components/public/HomeCountdown";

export const revalidate = 300;


export const metadata: Metadata = {
  title: "Home",
  description: "CFS (Colet Fan Suporta) — the Bini Colet fan-support community. See our upcoming events.",
};

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

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
  const [{ data: rawEvents }, { count: memberCount }, allLetters] = await Promise.all([
    (supabase.from("events") as any)
      .select("id, title, date, banner_url, location, price, capacity")
      .eq("status", "upcoming")
      .eq("is_hidden", false)
      .order("date", { ascending: true })
      .limit(6),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    getColetLetters(),
  ]);
  const letters = allLetters.slice(0, 3);

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

  return (
    <div className="scrap-paper" style={{ minHeight: "100vh" }}>
      <RealtimeRefresh tables="events" />

      {/* ── HERO ── watercolor branding banner is the star. The artwork
          already contains the wordmark + characters, so no h1 competes
          with it. Corner scrapbook decorations sit in safe zones; a
          marquee ticker + live countdown + CTAs sit below. */}
      <section className="home-hero" style={{ position: "relative", padding: "0 0 24px" }}>
        {/* Full-bleed watercolor banner, with corner decorations layered
            in the outer corners so they never cover the wordmark. */}
        <div className="hero-banner" style={{ position: "relative", width: "100%", aspectRatio: "1710 / 604", overflow: "hidden" }}>
          <Image
            src="https://media.coletfs.com/products/user_3F9O7q2MyuHGi78PSxQJR4ix5gI/u5mQXqE-UVCyWNbDnUFJZ.webp"
            alt="Colet Fan Suporta"
            fill
            sizes="100vw"
            priority
            style={{ objectFit: "cover", objectPosition: "center" }}
          />

          {/* Drifting sparkle stickers — random-ish positions in the
              corners so they never hover over the wordmark or characters.
              Each ✦ has its own duration/delay so they feel organic. */}
          <span aria-hidden="true" className="hero-spark" style={{ top: "12%", left: "6%", animationDelay: "0s" }}>✦</span>
          <span aria-hidden="true" className="hero-spark" style={{ top: "68%", left: "14%", animationDelay: "-2.4s", fontSize: "18px" }}>✦</span>
          <span aria-hidden="true" className="hero-spark" style={{ top: "22%", right: "10%", animationDelay: "-1.1s", color: "#E85D75" }}>✦</span>
          <span aria-hidden="true" className="hero-spark" style={{ top: "74%", right: "8%", animationDelay: "-3.3s", fontSize: "22px" }}>✦</span>
          <span aria-hidden="true" className="hero-spark" style={{ top: "48%", left: "3%", animationDelay: "-1.8s", fontSize: "14px", color: "#F0C48A" }}>✦</span>

          {/* Washi tape corner tag — pinned top-right, angled like it's
              taping the banner to the page */}
          <div className="hero-washi-corner" aria-hidden="true">
            <span className="scrap-tape scrap-tape-pink">cocacolets hangout</span>
          </div>

          {/* Tilted polaroid peeking from bottom-left corner. Small so
              it doesn't compete with the artwork. */}
          <div className="hero-polaroid-corner scrap-polaroid scrap-polaroid-tilt-left" aria-hidden="true">
            <div className="scrap-polaroid-photo" style={{ borderRadius: 2, padding: 0, overflow: "hidden", position: "relative" }}>
              <Image
                src="https://media.coletfs.com/products/user_3F9O7q2MyuHGi78PSxQJR4ix5gI/aYpvBMfbTeGqhSMPr4dpD.webp"
                alt=""
                fill
                sizes="128px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="scrap-polaroid-caption">colet ✦</div>
          </div>
        </div>

        {/* Marquee ticker just under the banner — infinite loop of
            community facts. Pure CSS, no JS. */}
        <div className="hero-marquee" aria-hidden="true">
          <div className="hero-marquee-track">
            {Array.from({ length: 2 }).map((_, dupIndex) => (
              <div key={dupIndex} className="hero-marquee-group">
                <span className="hero-marquee-item">✦ {(memberCount ?? 0).toLocaleString()} Cocacolets strong</span>
                <span className="hero-marquee-item">✦ {upcomingCount} upcoming event{upcomingCount === 1 ? "" : "s"}</span>
                <span className="hero-marquee-item">✦ para kay Colet, buong araw</span>
                <span className="hero-marquee-item">✦ live from the Philippines</span>
                <span className="hero-marquee-item">✦ EST. 2026</span>
                <span className="hero-marquee-item">✦ join the fam →</span>
              </div>
            ))}
          </div>
        </div>

        {/* Copy strip — sits below the artwork so nothing overlaps the
            painting. Centered, minimal, and mobile-friendly. */}
        <div className="hero-copy" style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 24px 0", textAlign: "center" }}>
          <p className="scrap-note" style={{ fontSize: "clamp(1.5rem, 3.4vw, 2rem)", color: "#4A7C59", margin: "0 0 14px", lineHeight: 1.15 }}>
            The Ace is on her way — and we&apos;re here for her.
          </p>

          <p style={{ fontFamily: B, fontSize: "15px", color: "#1B3A2D", margin: "0 auto 24px", lineHeight: 1.7, maxWidth: "560px" }}>
            A community for Cocacolets — where we buy tickets together, throw fan events, and cheer Colet on. Come hang out.
          </p>

          <div className="hero-cta-row" style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginBottom: "22px" }}>
            <Link href="/events" className="btn-fx btn-fx-primary hero-cta-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, background: "#1B3A2D", color: "#ffffff", padding: "13px 26px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px", position: "relative", overflow: "hidden" }}>
              <IconCalendar size={14} color="#ffffff" /> SEE ALL EVENTS
            </Link>
            <Link href="/sign-up" className="btn-fx btn-fx-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, color: "#1B3A2D", background: "#FFFFFF", border: "1.5px solid #1B3A2D", padding: "12px 24px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px", boxShadow: "0 2px 6px rgba(27,58,45,0.08)" }}>
              <IconHeart size={14} color="#1B3A2D" /> JOIN THE FAM ✦
            </Link>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", alignItems: "center", fontFamily: B, fontSize: "12px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#FFFFFF", border: "1px solid #DDE8DD", padding: "5px 12px", borderRadius: "999px", color: "#1B3A2D" }}>
              <IconUsers size={12} color="#4A7C59" />
              <strong style={{ color: "#0F2A1E" }}>{(memberCount ?? 0).toLocaleString()}</strong> members strong
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#FFFFFF", border: "1px solid #DDE8DD", padding: "5px 12px", borderRadius: "999px", color: "#1B3A2D" }}>
              <IconCalendar size={12} color="#4A7C59" />
              <strong style={{ color: "#0F2A1E" }}>{upcomingCount}</strong> upcoming event{upcomingCount === 1 ? "" : "s"}
            </span>
            {nextEvent && (
              <HomeCountdown target={nextEvent.date} label="Next event in" />
            )}
          </div>

          {/* Scroll cue — soft bouncing chevron to invite the eye down */}
          {upcoming.length > 0 && (
            <a href="#upcoming-events" className="hero-scroll-cue" aria-label="Scroll to upcoming events">
              <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "2px" }}>SCROLL FOR EVENTS</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A7C59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </a>
          )}
        </div>

        <style>{`
          @keyframes hero-pulse {
            0%,100% { box-shadow: 0 0 0 0 rgba(26,128,64,0.55); }
            50%     { box-shadow: 0 0 0 6px rgba(26,128,64,0);    }
          }
          .hero-pulse { animation: hero-pulse 1.8s ease-out infinite; }

          /* Drifting sparkle stickers */
          @keyframes hero-spark-drift {
            0%,100% { transform: translate3d(0,0,0) rotate(0deg); opacity: 0.55; }
            50%     { transform: translate3d(4px,-8px,0) rotate(18deg); opacity: 1; }
          }
          .hero-spark {
            position: absolute; z-index: 2;
            font-family: var(--font-caveat, cursive);
            font-size: 20px; color: #ffffff;
            text-shadow: 0 1px 3px rgba(0,0,0,0.25);
            animation: hero-spark-drift 4.5s ease-in-out infinite;
            pointer-events: none;
          }

          /* Corner scrapbook decorations */
          .hero-washi-corner {
            position: absolute; top: 14px; right: 22px; z-index: 3;
            transform: rotate(6deg);
            transform-origin: top right;
          }
          .hero-polaroid-corner {
            position: absolute; bottom: 14px; left: 22px; z-index: 3;
            width: 118px;
            transition: transform 0.25s ease;
          }
          .hero-polaroid-corner:hover { transform: rotate(-1deg) translateY(-4px); }

          /* Marquee ticker */
          @keyframes hero-marquee-scroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .hero-marquee {
            background: #1B3A2D; color: #F5F7EC;
            overflow: hidden; position: relative;
            border-top: 1px solid #0F2A1E; border-bottom: 1px solid #0F2A1E;
          }
          .hero-marquee-track {
            display: flex; width: max-content;
            animation: hero-marquee-scroll 32s linear infinite;
          }
          .hero-marquee:hover .hero-marquee-track { animation-play-state: paused; }
          .hero-marquee-group { display: flex; flex-shrink: 0; }
          .hero-marquee-item {
            font-family: ${SG}; font-size: 12px; font-weight: 700;
            letter-spacing: 2px; text-transform: uppercase;
            padding: 12px 24px; white-space: nowrap;
          }

          /* Scroll cue */
          @keyframes hero-scroll-bounce {
            0%,100% { transform: translateY(0); }
            50%     { transform: translateY(4px); }
          }
          .hero-scroll-cue {
            display: inline-flex; flex-direction: column; align-items: center;
            gap: 4px; margin-top: 26px; text-decoration: none;
            animation: hero-scroll-bounce 1.6s ease-in-out infinite;
            transition: opacity 0.15s;
          }
          .hero-scroll-cue:hover { opacity: 0.7; }

          @media (prefers-reduced-motion: reduce) {
            .hero-pulse,
            .hero-spark,
            .hero-marquee-track,
            .hero-scroll-cue { animation: none !important; }
          }
          /* On tall/narrow phones, the wide banner shrinks to a short
             strip. Bump min-height so the wordmark stays legible. */
          @media (max-width: 640px) {
            .hero-banner { min-height: 220px; }
            .hero-polaroid-corner { width: 88px; bottom: 10px; left: 10px; }
            .hero-washi-corner { top: 10px; right: 10px; }
            .hero-marquee-item { padding: 10px 16px; font-size: 11px; letter-spacing: 1.5px; }
          }
          /* Buttons stack full-width on phones so both CTAs feel equally
             tappable and the row breaks cleanly */
          @media (max-width: 560px) {
            .hero-cta-row > a { flex: 1 1 100%; justify-content: center; }
          }
        `}</style>
      </section>

      {/* ── UPCOMING EVENTS ── */}
      <section id="upcoming-events" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 24px 48px", scrollMarginTop: "16px" }}>
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
            {upcoming.map((ev, i) => {
              const date = new Date(ev.date);
              const isNext = i === 0;
              return (
                <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "#ffffff", border: isNext ? "2px solid #1A8040" : `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", boxShadow: isNext ? "0 8px 24px rgba(26,128,64,0.14)" : "0 2px 12px rgba(0,0,0,0.04)", transition: "transform 0.15s, border-color 0.15s", position: "relative" }} className="home-event-card">
                  {isNext && (
                    <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 2, background: "#1A8040", color: "#ffffff", fontFamily: SG, fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", padding: "4px 10px", borderRadius: "999px", boxShadow: "0 2px 6px rgba(26,128,64,0.35)" }}>
                      NEXT UP
                    </div>
                  )}
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

      {/* ── LETTERS FROM COLET — grid of most recent posts pulled
          from the Medium feed. Only renders when the RSS returns
          at least one item. */}
      {letters.length > 0 && (
        <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 96px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
            <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "3px" }}>LETTERS FROM COLET</span>
            <div style={{ flex: 1, height: "1px", background: C.border }} />
            <a href={LETTERS_MEDIUM_URL} target="_blank" rel="noopener noreferrer" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.green, letterSpacing: "2px", textDecoration: "none" }}>
              READ ALL →
            </a>
          </div>

          <HomeLettersGrid letters={letters} />
        </section>
      )}
    </div>
  );
}
