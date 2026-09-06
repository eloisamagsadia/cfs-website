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

        {/* Bento collage — asymmetric scrapbook grid of tiles.
            Each tile has its own color, tilt, and voice so nothing
            reads like a SaaS dashboard card. */}
        <div className="hero-bento-wrap" style={{ maxWidth: "1080px", margin: "0 auto", padding: "44px 24px 0" }}>
          <div className="hero-bento">

            {/* MISSION tile — cream paper, handwritten headline, spans 2 cols */}
            <div className="bento-tile bento-mission" style={{ background: "#F5F7EC", border: "1px dashed #C7D5C0" }}>
              {/* Paper grain texture */}
              <span aria-hidden="true" className="bento-grain" />
              {/* Yellow tape corner peeling off */}
              <span aria-hidden="true" className="bento-corner-tape" />
              <span aria-hidden="true" style={{ position: "absolute", top: "16px", left: "84px", fontFamily: H, fontSize: "22px", color: "#E85D75", transform: "rotate(-10deg)" }}>✦</span>
              <div className="scrap-note" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "#1B3A2D", lineHeight: 1.1, letterSpacing: "-0.5px", position: "relative" }}>
                The Ace is on her way — and we&apos;re <span className="bento-underline">here for her</span>.
              </div>
              <p style={{ fontFamily: B, fontSize: "13.5px", color: "#4A7C59", margin: "16px 0 0", lineHeight: 1.65, maxWidth: "460px", position: "relative" }}>
                A home base for Cocacolets — where we buy tickets together, throw fan events, and cheer Colet on. From anywhere in the Philippines.
              </p>
              {/* Hand-drawn heart doodle in bottom-right */}
              <svg aria-hidden="true" className="bento-doodle bento-doodle-heart" viewBox="0 0 32 28" width="36" height="32" fill="none" stroke="#E85D75" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 25 C 2 15, 2 4, 10 4 C 13 4, 15 6, 16 9 C 17 6, 19 4, 22 4 C 30 4, 30 15, 16 25 Z" />
              </svg>
            </div>

            {/* MEMBERS tile — forest-green contrast, big cream number */}
            <div className="bento-tile bento-members" style={{ background: "#1B3A2D", color: "#F5F7EC" }}>
              {/* Radial spotlight glow behind the number */}
              <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 55%, rgba(74,203,110,0.22), transparent 55%)", pointerEvents: "none" }} />
              {/* Faux inner stitched border */}
              <span aria-hidden="true" style={{ position: "absolute", inset: "10px", border: "1px dashed rgba(183,205,183,0.28)", borderRadius: "12px", pointerEvents: "none" }} />
              <div style={{ position: "relative", fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "2px", color: "#B7CDB7", marginBottom: "8px" }}>
                COCACOLETS STRONG
              </div>
              <div style={{ position: "relative", fontFamily: S, fontSize: "clamp(3.2rem, 8vw, 5rem)", lineHeight: 0.95, letterSpacing: "-2px", color: "#F5F7EC", textShadow: "0 2px 20px rgba(74,203,110,0.35)" }}>
                {(memberCount ?? 0).toLocaleString()}
              </div>
              <div style={{ position: "relative", display: "flex", marginTop: "auto", paddingTop: "16px", alignItems: "center", gap: "6px" }}>
                <div style={{ display: "flex" }}>
                  {[0,1,2,3,4].map(i => (
                    <div key={i} aria-hidden="true" style={{ width: 24, height: 24, borderRadius: "50%", background: ["#4ACB6E","#F0C48A","#F8BFC8","#B7DCF0","#C4A6D6"][i], border: "2px solid #1B3A2D", marginLeft: i === 0 ? 0 : -8, boxShadow: "0 2px 4px rgba(0,0,0,0.15)" }} />
                  ))}
                </div>
                <span style={{ fontFamily: H, fontSize: "16px", color: "#B7CDB7", marginLeft: "8px", transform: "rotate(-2deg)", display: "inline-block" }}>
                  &amp; counting ✦
                </span>
              </div>
            </div>

            {/* VIBE tile — pink pastel, big handwritten mantra */}
            <div className="bento-tile bento-vibe" style={{ background: "#FDE9EC", border: "1px solid #F3C4CC" }}>
              <span aria-hidden="true" className="bento-grain" />
              {/* Floating drift sparkles */}
              <span aria-hidden="true" className="bento-spark" style={{ top: "18%", right: "12%", animationDelay: "0s" }}>✦</span>
              <span aria-hidden="true" className="bento-spark" style={{ top: "36%", right: "26%", fontSize: "14px", animationDelay: "-1.5s" }}>✦</span>
              <span aria-hidden="true" className="bento-spark" style={{ top: "58%", right: "8%", fontSize: "18px", animationDelay: "-2.8s" }}>✦</span>
              <div style={{ position: "relative", fontFamily: H, fontSize: "clamp(1.6rem, 3.6vw, 2.2rem)", color: "#8A2E45", lineHeight: 1.1 }}>
                para kay Colet,<br />buong araw ✦
              </div>
              <div style={{ position: "relative", fontFamily: SG, fontSize: "9.5px", fontWeight: 700, letterSpacing: "2px", color: "#B85268", marginTop: "auto", textTransform: "uppercase" }}>
                — cocacolets mantra
              </div>
            </div>

            {/* COUNTDOWN tile — clickable if there's a next event, live countdown */}
            {nextEvent ? (
              <Link href={`/events/${nextEvent.id}`} className="bento-tile bento-countdown bento-countdown-link" style={{ background: "#FFF3D6", border: "1px solid #F0C48A", textDecoration: "none", color: "inherit" }}>
                <span aria-hidden="true" className="bento-grain" />
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", position: "relative" }}>
                  <span aria-hidden="true" className="hero-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#1A8040", display: "inline-block" }} />
                  <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "2.5px", color: "#8B5E1F" }}>
                    NEXT EVENT IN
                  </span>
                </div>
                <div style={{ position: "relative" }}>
                  <HomeCountdown target={nextEvent.date} variant="bento" />
                </div>
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px", gap: "10px" }}>
                  <span style={{ fontFamily: H, fontSize: "17px", color: "#8B5E1F", transform: "rotate(-1deg)", display: "inline-block" }}>
                    handa na ba kayo? 🌱
                  </span>
                  <span className="bento-countdown-arrow" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "1.8px", color: "#8B5E1F" }}>
                    BOOK NOW
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </Link>
            ) : (
              <div className="bento-tile bento-countdown" style={{ background: "#FFF3D6", border: "1px solid #F0C48A" }}>
                <span aria-hidden="true" className="bento-grain" />
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", position: "relative" }}>
                  <span aria-hidden="true" className="hero-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "#1A8040", display: "inline-block" }} />
                  <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "2.5px", color: "#8B5E1F" }}>STAY TUNED</span>
                </div>
                <div style={{ position: "relative", fontFamily: S, fontSize: "clamp(1.6rem, 3.6vw, 2.2rem)", color: "#8B5E1F" }}>
                  next drop coming
                </div>
                <div style={{ position: "relative", fontFamily: H, fontSize: "17px", color: "#8B5E1F", marginTop: "12px" }}>
                  we&apos;ll announce soon
                </div>
              </div>
            )}

            {/* CTA strip — full width, ticket-stub styling */}
            <div className="bento-tile bento-cta">
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
                <Link href="/events" className="btn-fx btn-fx-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, background: "#1B3A2D", color: "#ffffff", padding: "14px 30px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px" }}>
                  <IconCalendar size={14} color="#ffffff" /> SEE ALL EVENTS
                </Link>
                <Link href="/sign-up" className="btn-fx btn-fx-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, color: "#1B3A2D", background: "#FFFFFF", border: "1.5px solid #1B3A2D", padding: "13px 28px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px", boxShadow: "0 2px 6px rgba(27,58,45,0.08)" }}>
                  <IconHeart size={14} color="#1B3A2D" /> JOIN THE FAM ✦
                </Link>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes hero-pulse {
            0%,100% { box-shadow: 0 0 0 0 rgba(26,128,64,0.55); }
            50%     { box-shadow: 0 0 0 6px rgba(26,128,64,0);    }
          }
          .hero-pulse { animation: hero-pulse 1.8s ease-out infinite; }

          /* Bento grid — explicit template areas for a clean asymmetric
             layout. Desktop 3 cols:
                mission mission members
                vibe    countdown countdown
                cta     cta       cta */
          .hero-bento {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            grid-template-areas:
              "mission   mission    members"
              "vibe      countdown  countdown"
              "cta       cta        cta";
            gap: 16px;
          }
          .bento-tile {
            position: relative;
            border-radius: 18px;
            padding: 26px 24px;
            box-shadow: 0 6px 20px rgba(15,42,30,0.07);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            min-width: 0;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .bento-tile:hover { transform: translateY(-3px) rotate(0deg) !important; box-shadow: 0 14px 30px rgba(15,42,30,0.11); }

          /* Paper grain — near-invisible noise pattern that adds warmth */
          .bento-grain {
            position: absolute; inset: 0; pointer-events: none;
            background-image:
              radial-gradient(rgba(107,74,158,0.05) 1px, transparent 1px),
              radial-gradient(rgba(232,93,117,0.04) 1px, transparent 1px);
            background-size: 22px 22px, 34px 34px;
            background-position: 0 0, 11px 17px;
            opacity: 0.6;
          }

          /* Yellow tape corner peeling off the mission tile */
          .bento-corner-tape {
            position: absolute; top: -10px; left: 20px;
            width: 58px; height: 20px;
            background:
              linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.06) 100%),
              repeating-linear-gradient(45deg, rgba(255,255,255,0.20) 0 3px, transparent 3px 9px),
              #FFD98A;
            transform: rotate(-6deg);
            box-shadow: 0 3px 6px rgba(60,40,10,0.15);
            border-radius: 2px;
          }

          /* Hand-drawn wavy underline under specific words in the tagline */
          .bento-underline {
            position: relative;
            background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 8' preserveAspectRatio='none'%3E%3Cpath d='M2 5 Q 25 1, 50 5 T 98 5' fill='none' stroke='%23E85D75' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat left bottom -6px / 100% 8px;
            padding-bottom: 10px;
          }

          /* Floating drift sparkles inside vibe tile */
          @keyframes bento-spark-drift {
            0%,100% { transform: translate3d(0,0,0) rotate(0deg) scale(1); opacity: 0.55; }
            50%     { transform: translate3d(3px,-6px,0) rotate(18deg) scale(1.15); opacity: 1; }
          }
          .bento-spark {
            position: absolute; z-index: 1;
            font-family: var(--font-caveat, cursive);
            font-size: 16px; color: #E85D75;
            animation: bento-spark-drift 4.5s ease-in-out infinite;
            pointer-events: none;
          }

          /* Doodle in bottom-right corner of the mission tile */
          .bento-doodle {
            position: absolute;
            pointer-events: none;
          }
          .bento-doodle-heart {
            bottom: 16px; right: 20px;
            transform: rotate(8deg);
            opacity: 0.85;
          }

          /* Countdown link hover state — arrow slides right */
          .bento-countdown-link { cursor: pointer; }
          .bento-countdown-link:hover .bento-countdown-arrow svg { transform: translateX(3px); }
          .bento-countdown-arrow svg { transition: transform 0.2s ease; }
          .bento-mission   { grid-area: mission;   transform: rotate(-0.4deg); padding-top: 44px; }
          .bento-members   { grid-area: members;   transform: rotate(1.2deg); justify-content: space-between; }
          .bento-vibe      { grid-area: vibe;      transform: rotate(-1.6deg); justify-content: space-between; }
          .bento-countdown { grid-area: countdown; transform: rotate(0.6deg); justify-content: center; }
          .bento-cta       { grid-area: cta;       background: transparent; box-shadow: none; padding: 8px 0 0; justify-content: center; align-items: center; }
          .bento-cta:hover { transform: none !important; box-shadow: none !important; }

          @media (prefers-reduced-motion: reduce) {
            .hero-pulse,
            .bento-spark { animation: none !important; }
            .bento-tile { transform: none !important; }
          }
          @media (max-width: 640px) {
            .hero-banner { min-height: 200px; }
            .hero-bento {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              grid-template-areas:
                "mission   mission"
                "members   vibe"
                "countdown countdown"
                "cta       cta";
              gap: 10px;
            }
            .bento-tile { padding: 20px 18px; border-radius: 14px; transform: none !important; }
            .bento-mission { padding-top: 32px; }
          }
          @media (max-width: 560px) {
            .bento-cta > div > a { flex: 1 1 100%; justify-content: center; }
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
                  <>
                    {/* Blurred copy of the banner fills the media area so
                        the mint frame disappears and the sharp banner
                        feels like part of a poster. */}
                    <img
                      src={ev.banner_url}
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%",
                        objectFit: "cover", objectPosition: "center",
                        filter: "blur(24px) saturate(1.15)",
                        transform: "scale(1.15)",
                      }}
                    />
                    {/* Soft dark scrim so the sharp banner reads against
                        any bright blurred backdrop. */}
                    <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "rgba(15,42,30,0.10)" }} />
                    <img
                      src={ev.banner_url}
                      alt={ev.title}
                      style={{
                        position: "relative",
                        width: "100%", height: "100%",
                        objectFit: "contain", objectPosition: "center",
                      }}
                    />
                  </>
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
