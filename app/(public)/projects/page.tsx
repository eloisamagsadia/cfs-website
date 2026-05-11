import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const metadata: Metadata = { title: "Projects — CFS" };

const R = "var(--font-righteous,'Righteous',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ongoing:   { label: "ONGOING",   color: "#F5C82A", bg: "#3D3000" },
  completed: { label: "COMPLETED", color: "#3CCE2A", bg: "#0F2A0B" },
  upcoming:  { label: "UPCOMING",  color: "#F07228", bg: "#3D1A00" },
};

const CATEGORY_COLORS: Record<string, string> = {
  "Charity":       "#F04060",
  "Fan Project":   "#3CCE2A",
  "Donation Drive":"#F5C82A",
  "Birthday":      "#F07228",
  "Promo":         "#8EE440",
};

export default async function ProjectsPage() {
  const supabase = createAdminClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const display = projects ?? [];

  const completed = display.filter((p: any) => p.status === "completed").length;
  const ongoing   = display.filter((p: any) => p.status === "ongoing").length;
  const upcoming  = display.filter((p: any) => p.status === "upcoming").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0F1A0B" }}>
      <style>{`
        .project-card { transition: border-color 0.2s, transform 0.2s; }
        .project-card:hover { border-color: #3CCE2A !important; transform: translateY(-2px); }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ background: "#1A3D14", borderBottom: "2px solid #2C4820", padding: "56px 24px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(60,206,42,0.1) 1.5px,transparent 1.5px)", backgroundSize: "18px 18px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#0F1A0B", border: "1.5px solid #3CCE2A", borderRadius: "20px", padding: "4px 16px", marginBottom: "20px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3CCE2A" }} />
            <span style={{ fontFamily: R, fontSize: "10px", color: "#3CCE2A", letterSpacing: "2.5px" }}>CFS FAN PROJECTS</span>
          </div>
          <h1 style={{ fontFamily: R, fontSize: "clamp(2rem,5vw,3.2rem)", color: "#F0EAD6", letterSpacing: "4px", marginBottom: "14px" }}>
            OUR PROJECTS
          </h1>
          <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "15px", color: "#8AAA78", maxWidth: "520px", margin: "0 auto 32px", lineHeight: 1.8 }}>
            From charity outreach to concert fan projects — everything we do, we do for Colet and the community.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            {[
              { label: "TOTAL PROJECTS", value: String(display.length), color: "#F0EAD6" },
              { label: "COMPLETED", value: String(completed), color: "#3CCE2A" },
              { label: "ONGOING", value: String(ongoing), color: "#F5C82A" },
              { label: "UPCOMING", value: String(upcoming), color: "#F07228" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#0F2A0B", border: "1.5px solid #2C4820", borderRadius: "10px", padding: "14px 20px", textAlign: "center", minWidth: "80px" }}>
                <div style={{ fontFamily: R, fontSize: "1.4rem", color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1.5px", marginTop: "4px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROJECTS GRID ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px" }}>

        {display.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", fontFamily: B, fontSize: "14px", color: "#3A5A30" }}>
            No projects yet — check back soon!
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "16px" }}>
          {display.map((p: any) => {
            const status = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.ongoing;
            const catColor = CATEGORY_COLORS[p.category] ?? "#5A7A50";

            return (
              <div key={p.id} className="project-card" style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>

                {/* Card top bar */}
                <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #2C4820" }}>
                  {/* Category */}
                  <span style={{ fontFamily: R, fontSize: "10px", color: catColor, letterSpacing: "1.5px", background: "#0F1A0B", border: `1.5px solid ${catColor}40`, borderRadius: "4px", padding: "2px 8px" }}>
                    {p.category ?? "PROJECT"}
                  </span>
                  {/* Status */}
                  <span style={{ fontFamily: R, fontSize: "10px", color: status.color, background: status.bg, border: `1.5px solid ${status.color}60`, borderRadius: "4px", padding: "2px 8px", letterSpacing: "1px" }}>
                    {status.label}
                  </span>
                </div>

                {/* Cover image if exists */}
                {p.cover_image && (
                  <div style={{ height: "160px", overflow: "hidden" }}>
                    <img src={p.cover_image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}

                {/* Body */}
                <div style={{ padding: "18px 18px 0", flex: 1 }}>
                  <h3 style={{ fontFamily: R, fontSize: "15px", color: "#F0EAD6", letterSpacing: "1px", marginBottom: "8px", lineHeight: 1.4 }}>{p.title}</h3>
                  <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78", lineHeight: 1.7, marginBottom: "16px" }}>
                    {p.description?.length > 160 ? p.description.slice(0, 160) + "..." : p.description}
                  </p>
                </div>

                {/* Footer */}
                <div style={{ padding: "0 18px 18px" }}>
                  {/* Progress bar for ongoing */}
                  {p.status === "ongoing" && (
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px" }}>PROGRESS</span>
                        <span style={{ fontFamily: R, fontSize: "11px", color: "#F5C82A" }}>{p.progress_percent ?? 0}%</span>
                      </div>
                      <div style={{ background: "#243520", borderRadius: "20px", height: "8px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p.progress_percent ?? 0}%`, background: "linear-gradient(90deg,#3CCE2A,#F5C82A)", borderRadius: "20px", transition: "width 0.5s" }} />
                      </div>
                    </div>
                  )}

                  {/* Date range */}
                  {(p.start_date || p.end_date) && (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "12px" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#3A5A30" strokeWidth="2"/><path d="M3 9h18M8 2v4M16 2v4" stroke="#3A5A30" strokeWidth="2" strokeLinecap="round"/></svg>
                      <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30" }}>
                        {p.start_date ? new Date(p.start_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : ""}
                        {p.end_date && p.end_date !== p.start_date ? ` – ${new Date(p.end_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Completed badge */}
                  {p.status === "completed" && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#0F2A0B", border: "1.5px solid #3CCE2A40", borderRadius: "6px", padding: "5px 12px", marginBottom: "12px" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#3CCE2A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span style={{ fontFamily: R, fontSize: "10px", color: "#3CCE2A", letterSpacing: "1.5px" }}>COMPLETED</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}