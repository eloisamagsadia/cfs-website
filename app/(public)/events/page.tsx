import type { Metadata } from "next";
import Link from "next/link";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const metadata: Metadata = { title: "Events — CFS" };

const R = "var(--font-righteous,'Righteous',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  upcoming:  { label: "UPCOMING",  color: "#F5C82A", bg: "#3D3000" },
  ongoing:   { label: "ONGOING",   color: "#3CCE2A", bg: "#0F2A0B" },
  completed: { label: "COMPLETED", color: "#5A7A50", bg: "#1A2614" },
  cancelled: { label: "CANCELLED", color: "#F04060", bg: "#3D0A14" },
};

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

export default async function EventsPage() {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  const display = events ?? [];
  const upcoming  = display.filter((e: any) => e.status === "upcoming").length;
  const completed = display.filter((e: any) => e.status === "completed").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0F1A0B" }}>
      <style>{`
        .event-card { transition: border-color 0.2s, transform 0.2s; }
        .event-card:hover { border-color: #3CCE2A !important; transform: translateY(-2px); }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ background: "#1A3D14", borderBottom: "2px solid #2C4820", padding: "56px 24px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(60,206,42,0.1) 1.5px,transparent 1.5px)", backgroundSize: "18px 18px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#0F1A0B", border: "1.5px solid #3CCE2A", borderRadius: "20px", padding: "4px 16px", marginBottom: "20px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3CCE2A" }} />
            <span style={{ fontFamily: R, fontSize: "10px", color: "#3CCE2A", letterSpacing: "2.5px" }}>CFS EVENTS</span>
          </div>
          <h1 style={{ fontFamily: R, fontSize: "clamp(2rem,5vw,3.2rem)", color: "#F0EAD6", letterSpacing: "4px", marginBottom: "14px" }}>
            EVENTS
          </h1>
          <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "15px", color: "#8AAA78", maxWidth: "460px", margin: "0 auto 32px", lineHeight: 1.8 }}>
            Fan meets, concerts, and exclusive CFS gatherings — be part of every moment.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            {[
              { label: "TOTAL EVENTS", value: String(display.length), color: "#F0EAD6" },
              { label: "UPCOMING",     value: String(upcoming),       color: "#F5C82A" },
              { label: "COMPLETED",    value: String(completed),      color: "#3CCE2A" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#0F2A0B", border: "1.5px solid #2C4820", borderRadius: "10px", padding: "14px 24px", textAlign: "center" }}>
                <div style={{ fontFamily: R, fontSize: "1.4rem", color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1.5px", marginTop: "4px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── EVENTS GRID ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px" }}>

        {display.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: R, fontSize: "14px", color: "#3A5A30", letterSpacing: "2px" }}>NO EVENTS YET</div>
            <p style={{ fontFamily: B, fontSize: "13px", color: "#2C4820", marginTop: "8px" }}>Check back soon — something exciting is coming!</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "16px", alignItems: "stretch" }}>
          {display.map((event: any) => {
            const d = new Date(event.date);
            const status = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.upcoming;
            return (
              <Link key={event.id} href={`/events/${event.id}`} style={{ textDecoration: "none", height: "100%", display: "block" }}>
                <div className="event-card" style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>

                  {/* Banner / date block */}
                  {event.banner_url ? (
                    <div style={{ position: "relative", height: "160px" }}>
                      <img src={event.banner_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #1A2614 0%, transparent 60%)" }} />
                      {/* Date pill over banner */}
                      <div style={{ position: "absolute", top: "12px", left: "12px", background: "#0F1A0B", border: "1.5px solid #2C4820", borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                        <div style={{ fontFamily: R, fontSize: "20px", color: "#3CCE2A", lineHeight: 1 }}>{d.getDate()}</div>
                        <div style={{ fontFamily: B, fontSize: "9px", color: "#5A7A50", letterSpacing: "1.5px" }}>{MONTHS[d.getMonth()]}</div>
                      </div>
                    </div>
                  ) : (
                    /* No banner — styled date block */
                    <div style={{ background: "#0F2A0B", borderBottom: "1px solid #2C4820", padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ background: "#1A2614", border: "1.5px solid #3CCE2A40", borderRadius: "10px", padding: "10px 16px", textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontFamily: R, fontSize: "28px", color: "#3CCE2A", lineHeight: 1 }}>{d.getDate()}</div>
                        <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1.5px" }}>{MONTHS[d.getMonth()]}</div>
                        <div style={{ fontFamily: B, fontSize: "10px", color: "#3A5A30" }}>{d.getFullYear()}</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", marginBottom: "4px" }}>
                          {d.toLocaleDateString("en-PH", { weekday: "long" }).toUpperCase()}
                        </div>
                        <div style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", letterSpacing: "0.5px" }}>
                          {d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Title + badges row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <h3 style={{ fontFamily: R, fontSize: "15px", color: "#F0EAD6", letterSpacing: "0.5px", margin: 0, lineHeight: 1.4 }}>{event.title}</h3>
                      <span style={{ fontFamily: R, fontSize: "9px", color: status.color, background: status.bg, border: `1.5px solid ${status.color}50`, borderRadius: "4px", padding: "2px 7px", letterSpacing: "1px", flexShrink: 0 }}>
                        {status.label}
                      </span>
                    </div>

                    {/* Location */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#5A7A50" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="#5A7A50" strokeWidth="2"/></svg>
                      <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50" }}>{event.location}</span>
                    </div>

                    {/* Price + members only */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: R, fontSize: "13px", color: event.price === 0 ? "#3CCE2A" : "#F07228", letterSpacing: "0.5px" }}>
                        {event.price === 0 ? "FREE" : `₱${Number(event.price).toLocaleString()}`}
                      </span>
                      {event.is_members_only && (
                        <span style={{ fontFamily: R, fontSize: "9px", color: "#F5C82A", background: "#3D3000", border: "1px solid #F5C82A40", borderRadius: "4px", padding: "2px 7px", letterSpacing: "1px" }}>
                          MEMBERS ONLY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA footer */}
                  <div style={{ padding: "0 18px 16px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: R, fontSize: "11px", color: "#3CCE2A", letterSpacing: "1.5px" }}>
                      VIEW DETAILS
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="#3CCE2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
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