"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { IconCalendar, IconPin, IconX } from "@/components/shared/Icons";

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

const STATUS_META: Record<string, { label: string; color: string }> = {
  upcoming:  { label: "UPCOMING",  color: "#1A8040" },
  ongoing:   { label: "ONGOING",   color: "#B78A1F" },
  completed: { label: "COMPLETED", color: "#7A8E7A" },
  cancelled: { label: "CANCELLED", color: "#CC3344" },
};

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

type Filter = "all" | "upcoming" | "ongoing" | "completed" | "cancelled";

export default function EventsBrowser({ events }: { events: any[] }) {
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter(e => {
      if (filter !== "all" && e.status !== filter) return false;
      if (!q) return true;
      const title = (e.title ?? "").toLowerCase();
      const loc = (e.location ?? "").toLowerCase();
      return title.includes(q) || loc.includes(q);
    });
  }, [events, filter, search]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all",       label: "ALL",       count: events.length },
    { key: "upcoming",  label: "UPCOMING",  count: events.filter(e => e.status === "upcoming").length },
    { key: "ongoing",   label: "ONGOING",   count: events.filter(e => e.status === "ongoing").length },
    { key: "completed", label: "COMPLETED", count: events.filter(e => e.status === "completed").length },
  ];

  return (
    <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "40px 48px 96px" }}>
      <style>{`
        .evb-card { transition: transform 0.2s, border-color 0.2s; }
        .evb-card:hover { transform: translateY(-2px); border-color: #1A8040 !important; }
        @media (max-width: 720px) {
          .evb-shell { padding: 24px !important; }
          .evb-toolbar { flex-direction: column !important; align-items: stretch !important; }
          .evb-search-wrap { max-width: 100% !important; }
        }
      `}</style>

      {/* Filter + search */}
      <div className="evb-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {filters.map(f => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  fontFamily: SG, fontSize: "11px", fontWeight: 700, letterSpacing: "1.2px",
                  color: active ? "#ffffff" : C.forest,
                  background: active ? C.green : C.mist,
                  border: `1.5px solid ${active ? C.green : "transparent"}`,
                  borderRadius: "999px",
                  padding: "9px 16px",
                  cursor: "pointer",
                  outline: "none",
                  transition: "background 0.15s, color 0.15s",
                  boxShadow: active ? "0 2px 8px rgba(26,128,64,0.25)" : "none",
                }}>
                {f.label}
                <span style={{ fontSize: "10px", background: active ? "rgba(255,255,255,0.22)" : "rgba(26,128,64,0.14)", borderRadius: "999px", padding: "1px 7px", color: active ? "#ffffff" : C.green }}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="evb-search-wrap" style={{ position: "relative", maxWidth: "320px", width: "100%" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A8E7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events or location…"
            style={{ width: "100%", background: "#ffffff", border: `1.5px solid ${C.border}`, borderRadius: "999px", padding: "10px 40px 10px 40px", color: C.forest, fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              aria-label="Clear search"
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: C.mist, border: "1px solid " + C.border, borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <IconX size={10} color="#5A7A60" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: `1.5px dashed ${C.border}`, borderRadius: "16px", padding: "72px 24px", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: C.mist, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
            <IconCalendar size={26} color={C.sage} />
          </div>
          <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: C.forest, letterSpacing: "2px", marginBottom: "6px" }}>
            {events.length ? "NO EVENTS MATCH THIS FILTER" : "NO EVENTS YET"}
          </div>
          <p style={{ fontFamily: B, fontSize: "13px", color: C.muted, margin: "0 0 16px" }}>
            {events.length ? "Try a different filter or clear your search." : "Check back soon — something exciting is coming!"}
          </p>
          {(search || filter !== "all") && events.length > 0 && (
            <button type="button" onClick={() => { setSearch(""); setFilter("all"); }}
              style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: C.green, border: "none", borderRadius: "10px", padding: "9px 18px", cursor: "pointer", letterSpacing: "1.2px", boxShadow: "0 2px 8px rgba(26,128,64,0.25)" }}>
              CLEAR FILTERS
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "20px", alignItems: "stretch" }}>
          {filtered.map(event => {
            const d = new Date(event.date);
            const status = STATUS_META[event.status] ?? STATUS_META.upcoming;
            return (
              <Link key={event.id} href={`/events/${event.id}`} style={{ textDecoration: "none", height: "100%", display: "block" }}>
                <div className="evb-card" style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", boxShadow: "0 2px 12px rgba(15,42,30,0.04)" }}>
                  <div style={{ position: "relative", aspectRatio: "16/9", background: C.mist }}>
                    {event.banner_url ? (
                      <img src={event.banner_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IconCalendar size={36} color="#B7CDB7" />
                      </div>
                    )}
                    {/* Fade so date badge + status pill stay readable on busy banners */}
                    {event.banner_url && (
                      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(15,42,30,0.55) 0%, transparent 40%)" }} />
                    )}
                    <div style={{ position: "absolute", top: "10px", left: "10px", background: "rgba(255,255,255,0.96)", borderRadius: "10px", padding: "6px 10px", textAlign: "center", minWidth: "50px", boxShadow: "0 4px 12px rgba(0,0,0,0.25)", zIndex: 2 }}>
                      <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: C.sage, letterSpacing: "1.4px" }}>{MONTHS[d.getMonth()]}</div>
                      <div style={{ fontFamily: S, fontSize: "20px", color: C.forest, lineHeight: 1 }}>{d.getDate()}</div>
                    </div>
                    <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 2 }}>
                      <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: status.color, borderRadius: "999px", padding: "3px 10px", letterSpacing: "1.5px", boxShadow: "0 4px 12px rgba(0,0,0,0.35)" }}>{status.label}</span>
                    </div>
                  </div>

                  <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                    <h3 style={{ fontFamily: S, fontSize: "17px", color: C.forest, margin: 0, lineHeight: 1.25 }}>{event.title}</h3>

                    {event.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <IconPin size={12} color={C.sage} />
                        <span style={{ fontFamily: B, fontSize: "12px", color: C.muted }}>{event.location}</span>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "auto", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
                      {(() => {
                        const hasTiers = event.tier_min !== null && event.tier_min !== undefined;
                        const min = hasTiers ? Number(event.tier_min) : Number(event.price ?? 0);
                        const max = hasTiers ? Number(event.tier_max) : min;
                        const isFree = min === 0 && (!hasTiers || max === 0);
                        const label = isFree
                          ? "Free"
                          : hasTiers && min !== max
                            ? `From ₱${min.toLocaleString()}`
                            : `₱${min.toLocaleString()}`;
                        return (
                          <span style={{ fontFamily: S, fontSize: "16px", color: isFree ? C.sage : C.green }}>
                            {label}
                          </span>
                        );
                      })()}
                      {event.is_members_only && (
                        <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#B78A1F", background: "rgba(183,138,31,0.14)", border: "1px solid rgba(183,138,31,0.35)", borderRadius: "999px", padding: "2px 8px", letterSpacing: "1.4px" }}>
                          MEMBERS ONLY
                        </span>
                      )}
                      <span style={{ marginLeft: "auto", fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.green, letterSpacing: "1.4px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        VIEW →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
