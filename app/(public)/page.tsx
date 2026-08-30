import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { IconCalendar, IconPin, IconTicket } from "@/components/shared/Icons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const { data: events } = await (supabase.from("events") as any)
    .select("id, title, date, banner_url, location, price, capacity")
    .eq("status", "upcoming")
    .order("date", { ascending: true })
    .limit(6);

  const upcoming = (events ?? []) as any[];

  return (
    <div style={{ background: C.paper, minHeight: "100vh" }}>

      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "72px 24px 64px" }}>
        <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%, -50%)", width: "820px", height: "820px", background: "radial-gradient(circle, #E4F0E4 0%, transparent 65%)", pointerEvents: "none" }} />
        {[560, 400, 260].map((size, i) => (
          <div key={i} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: `${size}px`, height: `${size}px`, borderRadius: "50%", border: "1px solid #DDE8DD", pointerEvents: "none" }} />
        ))}

        <div style={{ position: "relative", maxWidth: "760px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-block", fontFamily: B, fontSize: "10px", color: C.sage, letterSpacing: "3px", textTransform: "uppercase", border: `1px solid ${C.border}`, borderRadius: "20px", padding: "5px 18px", marginBottom: "28px", background: C.cream }}>
            BINI COLET FAN SOCIETY
          </div>

          <h1 style={{ fontFamily: S, fontSize: "clamp(2.6rem, 8vw, 4.6rem)", color: C.forest, margin: "0 0 6px", lineHeight: 1.05, letterSpacing: "-1px" }}>
            Colet Fan Suporta
          </h1>

          <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "clamp(1.1rem, 3vw, 1.5rem)", color: C.sage, margin: "0 0 28px", lineHeight: 1.3 }}>
            The Ace is on her way — and we&apos;re here for her.
          </p>

          <p style={{ fontFamily: B, fontSize: "15px", color: C.muted, maxWidth: "540px", margin: "0 auto 32px", lineHeight: 1.9 }}>
            Our full site is still coming — but our upcoming events are open now. Book your slot below.
          </p>

          <Link href="/events" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "13px", fontWeight: 700, background: C.forest, color: "#ffffff", padding: "13px 28px", borderRadius: "10px", textDecoration: "none", letterSpacing: "1.5px" }}>
            <IconCalendar size={14} color="#ffffff" /> SEE ALL EVENTS
          </Link>
        </div>
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
                      <span style={{ fontFamily: S, fontSize: "17px", color: ev.price > 0 ? C.green : C.sage }}>
                        {ev.price > 0 ? `₱${Number(ev.price).toLocaleString()}` : "FREE"}
                      </span>
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
