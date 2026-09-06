import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { IconCalendar, IconPin, IconTicket, IconUsers, IconHeart } from "@/components/shared/Icons";
import RealtimeRefresh from "@/components/shared/RealtimeRefresh";
import { getColetLetters, LETTERS_MEDIUM_URL } from "@/lib/letters";
import HomeLettersGrid from "@/components/public/HomeLettersGrid";

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
  // Whole-day count based on the calendar date, not the raw ms delta.
  // Otherwise Math.ceil turns "event today at 3pm, now 10am" into 1,
  // and an event 7.4 days away renders as "8 days" — confusing.
  const nextDaysAway = (() => {
    if (!nextEvent) return null;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const target = new Date(nextEvent.date); target.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  })();

  return (
    <div className="scrap-paper" style={{ minHeight: "100vh" }}>
      <RealtimeRefresh tables="events" />

      {/* ── HERO ── cozy scrapbook: warm lamp glow, washi tape label,
          polaroid, framed "next event" card, subtle stamp watermark */}
      <section style={{ position: "relative", overflow: "hidden", padding: "56px 24px 72px" }}>
        <div className="scrap-glow" />
        <div className="scrap-glow" style={{ top: "auto", bottom: "-120px", left: "auto", right: "-120px", background: "radial-gradient(circle, rgba(240, 180, 200, 0.30), transparent 65%)" }} />
        {/* Dot-grid texture — barely-there noise that keeps the paper
            from feeling flat but stays out of the way. */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(26,128,64,0.055) 1px, transparent 1px)", backgroundSize: "22px 22px", pointerEvents: "none", maskImage: "linear-gradient(180deg, rgba(0,0,0,0.7), transparent 85%)" }} />

        <div className="hero-grid" style={{ position: "relative", maxWidth: "1120px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "48px", alignItems: "center" }}>

          {/* Left: copy + CTAs */}
          <div>
            <div style={{ marginBottom: "22px" }}>
              <span className="scrap-tape scrap-tape-mint">Bini Colet Fan Society</span>
            </div>

            <h1 style={{ fontFamily: S, fontSize: "clamp(2.6rem, 7vw, 4.6rem)", color: "#1B3A2D", margin: "0 0 10px", lineHeight: 1.05, letterSpacing: "-1.5px" }}>
              Colet <span style={{ position: "relative", display: "inline-block" }}>
                Fan
                <span aria-hidden="true" style={{ position: "absolute", top: "-14px", right: "-18px", fontFamily: H, fontSize: "1.6rem", color: "#E85D75", transform: "rotate(12deg)" }}>✦</span>
              </span> Suporta
            </h1>

            <p className="scrap-note" style={{ fontSize: "clamp(1.5rem, 3.4vw, 2rem)", color: "#4A7C59", margin: "0 0 20px", lineHeight: 1.15 }}>
              The Ace is on her way — and we&apos;re here for her.
            </p>

            <p style={{ fontFamily: B, fontSize: "15px", color: "#1B3A2D", maxWidth: "480px", margin: "0 0 28px", lineHeight: 1.75 }}>
              A community for Cocacolets — where we buy tickets together, throw fan events, and cheer Colet on. Come hang out.
            </p>

            {/* CTA row */}
            <div className="hero-cta-row" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "22px" }}>
              <Link href="/events" className="btn-fx btn-fx-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, background: "#1B3A2D", color: "#ffffff", padding: "13px 26px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px" }}>
                <IconCalendar size={14} color="#ffffff" /> SEE ALL EVENTS
              </Link>
              <Link href="/sign-up" className="btn-fx btn-fx-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, color: "#1B3A2D", background: "#FFFFFF", border: "1.5px solid #1B3A2D", padding: "12px 24px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px", boxShadow: "0 2px 6px rgba(27,58,45,0.08)" }}>
                <IconHeart size={14} color="#1B3A2D" /> JOIN THE FAM ✦
              </Link>
            </div>

            {/* Proof pills — all three get a visible pill bg so nothing
                disappears against the cream paper. */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", fontFamily: B, fontSize: "12px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#FFFFFF", border: "1px solid #DDE8DD", padding: "5px 12px", borderRadius: "999px", color: "#1B3A2D" }}>
                <IconUsers size={12} color="#4A7C59" />
                <strong style={{ color: "#0F2A1E" }}>{(memberCount ?? 0).toLocaleString()}</strong> members strong
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#FFFFFF", border: "1px solid #DDE8DD", padding: "5px 12px", borderRadius: "999px", color: "#1B3A2D" }}>
                <IconCalendar size={12} color="#4A7C59" />
                <strong style={{ color: "#0F2A1E" }}>{upcomingCount}</strong> upcoming event{upcomingCount === 1 ? "" : "s"}
              </span>
              {nextEvent && nextDaysAway !== null && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#FFF3D6", border: "1px solid #F0C48A", padding: "5px 12px", borderRadius: "999px", color: "#8B5E1F" }}>
                  <span className="hero-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#1A8040" }} />
                  Next event in <strong style={{ color: "#5A4020" }}>{nextDaysAway === 0 ? "today" : `${nextDaysAway} day${nextDaysAway === 1 ? "" : "s"}`}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Right: framed collage — polaroid + next-event poster.
              Card sits BEHIND polaroid on the right, polaroid pinned
              to the LEFT so it never clips the card title. Rotating
              "OFFICIAL FAN CLUB" stamp watermark sits deepest. */}
          <div className="hero-collage" style={{ position: "relative", height: "460px" }}>

            {/* Circular ring-text stamp watermark — deepest layer */}
            <div aria-hidden="true" style={{ position: "absolute", top: "50%", right: "42%", transform: "translate(50%, -50%)", width: "260px", height: "260px", opacity: 0.18, pointerEvents: "none", zIndex: 0 }}>
              <svg viewBox="0 0 260 260" width="260" height="260" style={{ animation: "hero-spin 60s linear infinite" }}>
                <defs>
                  <path id="stamp-ring" d="M 130,130 m -108,0 a 108,108 0 1,1 216,0 a 108,108 0 1,1 -216,0" fill="none" />
                </defs>
                <text style={{ fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)", fontSize: "13px", fontWeight: 700, letterSpacing: "6px", fill: "#1A8040" }}>
                  <textPath href="#stamp-ring" startOffset="0">OFFICIAL FAN CLUB ✦ EST. 2026 ✦ COLET FAN SUPORTA ✦ </textPath>
                </text>
              </svg>
            </div>

            {/* Framed "next event" card — anchored to the right/top so it
                stays the primary visual weight on this side */}
            {nextEvent ? (() => {
              // Smart-split "Prefix | Title" so the card doesn't wrap to 5
              // lines when the admin encodes context in the title.
              const t: string = nextEvent.title ?? "";
              const [pre, ...rest] = t.split(" | ");
              const hasPrefix = rest.length > 0;
              const eyebrow = hasPrefix ? pre.trim() : null;
              const mainTitle = hasPrefix ? rest.join(" | ").trim() : t;
              return (
              <Link href={`/events/${nextEvent.id}`} className="scrap-frame btn-fx" style={{ position: "absolute", top: "80px", right: "2%", width: "300px", transform: "rotate(2.5deg)", textDecoration: "none", display: "block", zIndex: 1, borderRadius: 4 }}>
                <div className="scrap-frame-inner" style={{ padding: "14px 14px 16px" }}>
                  <div style={{ display: "inline-block", background: "#1A8040", color: "#ffffff", fontFamily: SG, fontSize: "9px", fontWeight: 700, letterSpacing: "1.5px", padding: "3px 10px", borderRadius: "999px", marginBottom: "10px" }}>
                    NEXT UP
                  </div>
                  {eyebrow && (
                    <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#1A8040", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>{eyebrow}</div>
                  )}
                  <div style={{ fontFamily: S, fontSize: "18px", color: "#1B3A2D", lineHeight: 1.2, marginBottom: "10px" }}>{mainTitle}</div>
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
              );
            })() : (
              <div className="scrap-frame" style={{ position: "absolute", top: "80px", right: "2%", width: "260px", transform: "rotate(2.5deg)", zIndex: 1, borderRadius: 4 }}>
                <div className="scrap-frame-inner" style={{ padding: "22px 18px", textAlign: "center" }}>
                  <div className="scrap-note" style={{ fontSize: "18px", color: "#0F2A1E" }}>Next event coming soon ✦</div>
                </div>
              </div>
            )}

            {/* Polaroid — bottom-LEFT so it never covers the card
                title. Layers over the stamp watermark. */}
            <div className="scrap-polaroid scrap-polaroid-tilt-left hero-polaroid" style={{ position: "absolute", bottom: "0px", left: "0%", width: "158px", zIndex: 2, borderRadius: 2 }}>
              <div className="scrap-polaroid-photo" style={{ borderRadius: 2, padding: 0, overflow: "hidden", position: "relative" }}>
                <Image
                  src="https://media.coletfs.com/products/user_3F9O7q2MyuHGi78PSxQJR4ix5gI/aYpvBMfbTeGqhSMPr4dpD.webp"
                  alt="Colet"
                  fill
                  sizes="158px"
                  priority
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="scrap-polaroid-caption">colet ✦</div>
            </div>

            {/* Small washi note — floats above the polaroid */}
            <div style={{ position: "absolute", top: "40px", left: "18%", zIndex: 3 }}>
              <span className="scrap-tape scrap-tape-pink" style={{ transform: "rotate(-8deg)" }}>cocacolets hangout</span>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes hero-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes hero-pulse {
            0%,100% { box-shadow: 0 0 0 0 rgba(26,128,64,0.55); }
            50%     { box-shadow: 0 0 0 6px rgba(26,128,64,0);    }
          }
          .hero-pulse { animation: hero-pulse 1.8s ease-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .hero-pulse { animation: none; }
            .hero-collage svg { animation: none !important; }
          }
          @media (max-width: 900px) {
            .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; text-align: center; }
            .hero-cta-row { justify-content: center; }
            .hero-collage { height: 360px !important; max-width: 520px; margin: 0 auto; }
          }
          /* Buttons stack full-width on phones so both CTAs feel equally
             tappable and the row breaks cleanly */
          @media (max-width: 560px) {
            .hero-cta-row > a { flex: 1 1 100%; justify-content: center; }
          }
          @media (max-width: 560px) {
            .hero-collage { height: 340px !important; }
            /* Center the framed card and untilt it slightly so the wood
               border doesn't spill past the container. */
            .hero-collage .scrap-frame {
              width: 260px !important;
              max-width: calc(100vw - 80px) !important;
              left: 50% !important;
              right: auto !important;
              top: 12px !important;
              transform: translateX(-50%) rotate(1deg) !important;
            }
            /* Polaroid tucks into the bottom-left corner below the card. */
            .hero-collage .hero-polaroid {
              width: 112px !important;
              left: 6% !important;
              bottom: 0 !important;
            }
          }
          @media (max-width: 380px) {
            .hero-collage { height: 320px !important; }
            .hero-collage .scrap-frame { width: 230px !important; }
            .hero-collage .hero-polaroid { width: 96px !important; }
          }
        `}</style>
      </section>

      {/* ── UPCOMING EVENTS ── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 24px 48px" }}>
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
