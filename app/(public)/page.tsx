import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { IconCalendar, IconPin, IconTicket, IconHeart } from "@/components/shared/Icons";
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
          with it. Copy + CTAs + proof pills sit below in a clean strip. */}
      <section className="home-hero" style={{ position: "relative", padding: "0 0 24px" }}>
        {/* Full-bleed watercolor banner. Container aspect-ratio is
            deliberately shorter than the source (1710:604) so cover +
            "center top" crops the bottom ~13% — that hides the social
            icons and "COLETFANSUPORTA" text baked into the artwork. */}
        <div className="hero-banner" style={{ position: "relative", width: "100%", aspectRatio: "1710 / 525", overflow: "hidden" }}>
          <Image
            src="https://media.coletfs.com/products/user_3F9O7q2MyuHGi78PSxQJR4ix5gI/u5mQXqE-UVCyWNbDnUFJZ.webp"
            alt="Colet Fan Suporta"
            fill
            sizes="100vw"
            priority
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
        </div>

        {/* Copy strip — designed layout: pull-quote → mission line →
            3 stat index cards → CTAs → scroll cue. */}
        <div className="hero-copy" style={{ maxWidth: "960px", margin: "0 auto", padding: "44px 24px 0", textAlign: "center" }}>

          {/* Handwritten pull quote flanked by soft dividers */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "18px", margin: "0 0 14px" }}>
            <span aria-hidden="true" style={{ display: "inline-block", width: "clamp(24px, 6vw, 60px)", height: "1px", background: "#B7CDB7" }} />
            <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "3px" }}>THE MISSION</span>
            <span aria-hidden="true" style={{ display: "inline-block", width: "clamp(24px, 6vw, 60px)", height: "1px", background: "#B7CDB7" }} />
          </div>

          <p className="scrap-note" style={{ fontSize: "clamp(1.9rem, 4.4vw, 2.8rem)", color: "#1B3A2D", margin: "0 0 14px", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
            The Ace is on her way — and we&apos;re here for her.
          </p>

          <p style={{ fontFamily: B, fontSize: "15px", color: "#4A7C59", margin: "0 auto 36px", lineHeight: 1.7, maxWidth: "540px" }}>
            A community for Cocacolets — where we buy tickets together, throw fan events, and cheer Colet on. Come hang out.
          </p>

          {/* Stat index cards — three white paper cards with colored
              top strips. Slight opposing tilts on desktop for a
              scrapbook feel; straightened on mobile so nothing clips. */}
          <div className="hero-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px", margin: "0 0 40px" }}>
            <div className="hero-stat hero-stat-tilt-l">
              <span aria-hidden="true" className="hero-stat-strip" style={{ background: "#1A8040" }} />
              <div className="hero-stat-num" style={{ fontFamily: S, color: "#1B3A2D", lineHeight: 1, letterSpacing: "-1px" }}>
                {(memberCount ?? 0).toLocaleString()}
              </div>
              <div className="hero-stat-label" style={{ fontFamily: SG, fontWeight: 700, color: "#4A7C59", letterSpacing: "1.8px", textTransform: "uppercase" }}>
                Cocacolets Strong
              </div>
            </div>

            <div className="hero-stat">
              <span aria-hidden="true" className="hero-stat-strip" style={{ background: "#E85D75" }} />
              <div className="hero-stat-num" style={{ fontFamily: S, color: "#1B3A2D", lineHeight: 1, letterSpacing: "-1px" }}>
                {upcomingCount}
              </div>
              <div className="hero-stat-label" style={{ fontFamily: SG, fontWeight: 700, color: "#4A7C59", letterSpacing: "1.8px", textTransform: "uppercase" }}>
                Upcoming Event{upcomingCount === 1 ? "" : "s"}
              </div>
            </div>

            <div className="hero-stat hero-stat-tilt-r">
              <span aria-hidden="true" className="hero-stat-strip" style={{ background: "#E5B547" }} />
              {nextEvent ? (
                <HomeCountdown target={nextEvent.date} variant="stat" />
              ) : (
                <>
                  <div className="hero-stat-num" style={{ fontFamily: S, color: "#1B3A2D", lineHeight: 1 }}>—</div>
                  <div className="hero-stat-label" style={{ fontFamily: SG, fontWeight: 700, color: "#4A7C59", letterSpacing: "1.8px", textTransform: "uppercase" }}>
                    No event yet
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="hero-cta-row" style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginBottom: "14px" }}>
            <Link href="/events" className="btn-fx btn-fx-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, background: "#1B3A2D", color: "#ffffff", padding: "14px 28px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px" }}>
              <IconCalendar size={14} color="#ffffff" /> SEE ALL EVENTS
            </Link>
            <Link href="/sign-up" className="btn-fx btn-fx-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, color: "#1B3A2D", background: "#FFFFFF", border: "1.5px solid #1B3A2D", padding: "13px 26px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px", boxShadow: "0 2px 6px rgba(27,58,45,0.08)" }}>
              <IconHeart size={14} color="#1B3A2D" /> JOIN THE FAM ✦
            </Link>
          </div>

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

          /* Stat index cards */
          .hero-stat {
            position: relative; background: #FFFFFF;
            border: 1px solid #DDE8DD; border-radius: 14px;
            padding: 30px 20px 22px;
            box-shadow: 0 6px 18px rgba(15,42,30,0.06);
            overflow: hidden; text-align: left;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            min-width: 0;
          }
          .hero-stat:hover { transform: translateY(-3px) rotate(0deg); box-shadow: 0 12px 26px rgba(15,42,30,0.10); }
          .hero-stat-tilt-l { transform: rotate(-1.2deg); }
          .hero-stat-tilt-r { transform: rotate(1.2deg); }
          .hero-stat-strip {
            position: absolute; top: 0; left: 0; right: 0;
            height: 6px; display: block;
          }
          .hero-stat-num {
            font-size: clamp(2.4rem, 5vw, 3.4rem);
            margin-bottom: 12px;
          }
          .hero-stat-label {
            font-size: 10px;
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
            .hero-scroll-cue { animation: none !important; }
            .hero-stat-tilt-l, .hero-stat-tilt-r { transform: none !important; }
          }
          /* On tall/narrow phones, the wide banner shrinks to a short
             strip. Bump min-height so the wordmark stays legible. */
          @media (max-width: 640px) {
            .hero-banner { min-height: 200px; }
            .hero-stats { gap: 8px !important; }
            .hero-stat { padding: 22px 12px 16px !important; border-radius: 12px !important; }
            .hero-stat-tilt-l, .hero-stat-tilt-r { transform: none !important; }
            .hero-stat-num { font-size: 1.6rem !important; margin-bottom: 8px !important; }
            .hero-stat-label { font-size: 8.5px !important; letter-spacing: 1.2px !important; }
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
        ) : upcoming.length === 1 ? (() => {
          // Featured layout for the single-event case — grid leaves too
          // much dead space when a lone card sits at 280px minimum. This
          // horizontal card fills the section like a hero.
          const ev = upcoming[0];
          const date = new Date(ev.date);
          const hasTiers = ev.tier_min !== null && ev.tier_min !== undefined;
          const min = hasTiers ? Number(ev.tier_min) : Number(ev.price ?? 0);
          const max = hasTiers ? Number(ev.tier_max) : min;
          const isFree = min === 0 && (!hasTiers || max === 0);
          const priceLabel = isFree ? "FREE" : hasTiers && min !== max ? `FROM ₱${min.toLocaleString()}` : `₱${min.toLocaleString()}`;
          const t: string = ev.title ?? "";
          const [pre, ...rest] = t.split(" | ");
          const hasPrefix = rest.length > 0;
          const eyebrow = hasPrefix ? pre.trim() : null;
          const mainTitle = hasPrefix ? rest.join(" | ").trim() : t;
          return (
            <Link href={`/events/${ev.id}`} className="home-event-featured" style={{ textDecoration: "none", display: "grid", gridTemplateColumns: "1.05fr 1fr", background: "#ffffff", border: "2px solid #1A8040", borderRadius: "18px", overflow: "hidden", boxShadow: "0 12px 32px rgba(26,128,64,0.14)", transition: "transform 0.15s, box-shadow 0.15s", position: "relative" }}>
              <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 2, background: "#1A8040", color: "#ffffff", fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", padding: "5px 12px", borderRadius: "999px", boxShadow: "0 2px 8px rgba(26,128,64,0.4)" }}>
                NEXT UP
              </div>
              <div className="home-event-featured-media" style={{ aspectRatio: "4 / 3", background: C.mist, position: "relative", overflow: "hidden" }}>
                {ev.banner_url ? (
                  <img src={ev.banner_url} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", padding: "8px" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IconCalendar size={48} color="#B7CDB7" />
                  </div>
                )}
                <div style={{ position: "absolute", top: "16px", left: "16px", background: "rgba(255,255,255,0.96)", borderRadius: "10px", padding: "8px 14px", textAlign: "center", minWidth: "56px", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
                  <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "2px" }}>
                    {date.toLocaleDateString("en-PH", { month: "short", timeZone: "Asia/Manila" }).toUpperCase()}
                  </div>
                  <div style={{ fontFamily: S, fontSize: "26px", color: C.forest, lineHeight: 1 }}>
                    {date.toLocaleDateString("en-PH", { day: "numeric", timeZone: "Asia/Manila" })}
                  </div>
                </div>
              </div>
              <div style={{ padding: "36px 40px", display: "flex", flexDirection: "column", gap: "16px", justifyContent: "center" }}>
                {eyebrow && (
                  <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.green, letterSpacing: "2.5px", textTransform: "uppercase" }}>{eyebrow}</div>
                )}
                <div style={{ fontFamily: S, fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: C.forest, lineHeight: 1.15 }}>
                  {mainTitle}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontFamily: B, fontSize: "14px", color: C.forest }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <IconCalendar size={14} color="#4A7C59" />
                    <span>{date.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })} · {date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" })}</span>
                  </div>
                  {ev.location && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <IconPin size={14} color="#4A7C59" />
                      <span>{ev.location}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "18px", borderTop: `1px dashed ${C.border}` }}>
                  <span style={{ fontFamily: S, fontSize: "22px", color: isFree ? C.sage : C.green }}>
                    {priceLabel}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#ffffff", background: "#1A8040", padding: "10px 20px", borderRadius: "10px", letterSpacing: "1.5px", boxShadow: "0 4px 12px rgba(26,128,64,0.25)" }}>
                    <IconTicket size={12} color="#ffffff" /> BOOK YOUR SLOT →
                  </span>
                </div>
              </div>
            </Link>
          );
        })() : (
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
          .home-event-featured:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(26,128,64,0.20) !important; }
          @media (max-width: 820px) {
            .home-event-featured { grid-template-columns: 1fr !important; }
            .home-event-featured-media { aspect-ratio: 16/9 !important; }
            .home-event-featured > div:last-child { padding: 24px 22px !important; }
          }
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
