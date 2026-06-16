import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Events — CFS" };
export const dynamic = "force-dynamic";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  paper:  "#FAFDF9",
  cream:  "#F2F7F2",
  mist:   "#E8F0E4",
  forest: "#1B3A2D",
  sage:   "#4A7C59",
  border: "#DDE8DD",
  muted:  "#7A8E7A",
  green:  "#3CCE2A",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  upcoming:  { label: "UPCOMING",  color: "#F5C82A", bg: "#3D3000" },
  ongoing:   { label: "ONGOING",   color: "#3CCE2A", bg: "#F2F7F2" },
  completed: { label: "COMPLETED", color: "#4A7C59", bg: "#ffffff" },
  cancelled: { label: "CANCELLED", color: "#F04060", bg: "#3D0A14" },
};

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

export default async function EventsPage() {
  const supabase = createAdminClient();
  const { data: events } = await (supabase as any)
    .from("events")
    .select("*")
    .order("date", { ascending: false });

  const display = events ?? [];
  const upcoming  = display.filter((e: any) => e.status === "upcoming").length;
  const completed = display.filter((e: any) => e.status === "completed").length;

  return (
    <div style={{ minHeight: "100vh", background: "#FAFDF9" }}>
      <style>{`
        .event-card { transition: border-color 0.2s, transform 0.2s; }
        .event-card:hover { border-color: #3CCE2A !important; transform: translateY(-2px); }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ position:"relative", minHeight:"520px", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", background:C.cream }}>
        <img src="https://media.coletfs.com/assets/hero/events/cfs-events-hero.png" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", opacity:0.15 }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:"1400px", width:"100%", margin:"0 auto", padding:"80px 64px 80px 64px" }}>
          <div style={{ maxWidth:"520px" }}>
            <h1 style={{ fontFamily:S, fontSize:"clamp(2.4rem,4vw,3.8rem)", color:C.forest, lineHeight:1.05, marginBottom:"16px" }}>
              We Show Up.<br /><em style={{ fontStyle:"italic", color:C.sage }}>Together.</em>
            </h1>
            <p style={{ fontFamily:B, fontSize:"15px", color:C.muted, lineHeight:1.9, marginBottom:"40px" }}>
              The official event hub for CFS — fan meets, concerts, and everything in between.
            </p>
            <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
              {[
                { label:"Total Events", value:String(display.length), color:C.forest },
                { label:"Upcoming",     value:String(upcoming),       color:"#F5C82A" },
                { label:"Completed",    value:String(completed),      color:C.sage },
              ].map((s) => (
                <div key={s.label} style={{ background:"rgba(255,255,255,0.9)", border:`1px solid ${C.border}`, borderRadius:"12px", padding:"16px 24px", textAlign:"center", minWidth:"100px", backdropFilter:"blur(8px)" }}>
                  <div style={{ fontFamily:S, fontSize:"2rem", color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontFamily:B, fontSize:"11px", color:C.muted, letterSpacing:"0.5px", marginTop:"6px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EVENTS GRID ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px" }}>

        {display.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: R, fontSize: "14px", color: "#3A5A30", letterSpacing: "2px" }}>NO EVENTS YET</div>
            <p style={{ fontFamily: B, fontSize: "13px", color: "#9AAA98", marginTop: "8px" }}>Check back soon — something exciting is coming!</p>
          </div>
        )}

        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "20px", alignItems: "stretch" }}>
          {display.map((event: any) => {
            const d = new Date(event.date);
            const status = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.upcoming;
            return (
              <Link key={event.id} href={`/events/${event.id}`} style={{ textDecoration: "none", height: "100%", display: "block" }}>
                <div className="event-card" style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>

                  {/* Banner or date header */}
                  {event.banner_url ? (
                    <div style={{ position: "relative", height: "180px" }}>
                      <img src={event.banner_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(27,58,45,0.7) 0%, transparent 50%)" }} />
                      <div style={{ position: "absolute", top: "12px", left: "12px", background: "rgba(255,255,255,0.95)", borderRadius: "10px", padding: "8px 12px", textAlign: "center", backdropFilter: "blur(8px)" }}>
                        <div style={{ fontFamily: S, fontSize: "22px", color: C.sage, lineHeight: 1 }}>{d.getDate()}</div>
                        <div style={{ fontFamily: B, fontSize: "9px", color: C.muted, letterSpacing: "1.5px" }}>{MONTHS[d.getMonth()]}</div>
                      </div>
                      <div style={{ position: "absolute", bottom: "12px", left: "16px", right: "16px" }}>
                        <h3 style={{ fontFamily: S, fontSize: "17px", color: "#ffffff", margin: 0, lineHeight: 1.3 }}>{event.title}</h3>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: C.forest, padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", textAlign: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,0.15)" }}>
                        <div style={{ fontFamily: S, fontSize: "28px", color: C.green, lineHeight: 1 }}>{d.getDate()}</div>
                        <div style={{ fontFamily: B, fontSize: "9px", color: "rgba(255,255,255,0.6)", letterSpacing: "1.5px" }}>{MONTHS[d.getMonth()]}</div>
                        <div style={{ fontFamily: B, fontSize: "9px", color: "rgba(255,255,255,0.4)" }}>{d.getFullYear()}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: B, fontSize: "10px", color: "rgba(255,255,255,0.5)", letterSpacing: "1px", marginBottom: "4px" }}>
                          {d.toLocaleDateString("en-PH", { weekday: "long" }).toUpperCase()}
                        </div>
                        <div style={{ fontFamily: S, fontSize: "15px", color: "#ffffff", lineHeight: 1.3 }}>
                          {d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                    {!event.banner_url && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <span style={{ fontFamily: B, fontSize: "9px", color: status.color, background: status.color + "18", border: `1px solid ${status.color}40`, borderRadius: "4px", padding: "2px 8px", letterSpacing: "1px", fontWeight: 700, alignSelf: "flex-start" }}>
                          {status.label}
                        </span>
                        <h3 style={{ fontFamily: S, fontSize: "16px", color: C.forest, margin: 0, lineHeight: 1.3 }}>{event.title}</h3>
                      </div>
                    )}
                    {event.banner_url && (
                      <span style={{ fontFamily: B, fontSize: "9px", color: status.color, background: status.color + "18", border: `1px solid ${status.color}40`, borderRadius: "4px", padding: "2px 8px", letterSpacing: "1px", fontWeight: 700, alignSelf: "flex-start" }}>
                        {status.label}
                      </span>
                    )}

                    {event.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={C.sage} strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke={C.sage} strokeWidth="2"/></svg>
                        <span style={{ fontFamily: B, fontSize: "12px", color: C.muted }}>{event.location}</span>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "auto" }}>
                      <span style={{ fontFamily: S, fontSize: "15px", color: event.price === 0 ? C.sage : "#F07228" }}>
                        {event.price === 0 ? "Free" : `₱${Number(event.price).toLocaleString()}`}
                      </span>
                      {event.is_members_only && (
                        <span style={{ fontFamily: B, fontSize: "9px", color: "#F5C82A", background: "#F5C82A18", border: "1px solid #F5C82A40", borderRadius: "4px", padding: "2px 8px", letterSpacing: "1px", fontWeight: 700 }}>
                          MEMBERS ONLY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${C.border}`, paddingTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: B, fontSize: "11px", color: C.sage, fontWeight: 600, letterSpacing: "0.5px" }}>View Details</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={C.sage} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}