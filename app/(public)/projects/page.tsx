import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Projects — CFS" };

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
  green:  "#3CCE2A",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ongoing:   { label: "ONGOING",   color: "#F5C82A", bg: "#FFF8E1" },
  completed: { label: "COMPLETED", color: C.sage,    bg: C.mist },
  upcoming:  { label: "UPCOMING",  color: "#F07228", bg: "#FFF3EE" },
};

export default async function ProjectsPage() {
  const supabase = createAdminClient();
  const { data: projects } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
  const display   = projects ?? [];
  const completed = display.filter((p: any) => p.status === "completed").length;
  const ongoing   = display.filter((p: any) => p.status === "ongoing").length;
  const upcoming  = display.filter((p: any) => p.status === "upcoming").length;

  return (
    <div style={{ minHeight: "100vh", background: C.paper }}>
      <style>{`
        .project-card { transition: box-shadow 0.2s, transform 0.2s; }
        .project-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:"420px", overflow:"hidden", maxWidth:"1400px", margin:"0 auto", width:"100%" }}>
        <div style={{ padding:"64px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
 
          <h1 style={{ fontFamily:S, fontSize:"clamp(2.4rem,4vw,3.6rem)", color:C.forest, lineHeight:1.05, marginBottom:"16px" }}>
            We Show Up.<br /><em style={{ fontStyle:"italic", color:C.sage }}>For Colet.</em>
          </h1>
          <p style={{ fontFamily:B, fontSize:"15px", color:C.muted, maxWidth:"440px", lineHeight:1.9, marginBottom:"40px" }}>
            From charity outreach to concert fan projects — everything we do, we do for Colet and the community.
          </p>
          <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
            {[
              { label:"Total", value:String(display.length), color:C.forest },
              { label:"Completed", value:String(completed), color:C.sage },
              { label:"Ongoing", value:String(ongoing), color:"#F5C82A" },
              { label:"Upcoming", value:String(upcoming), color:"#F07228" },
            ].map((s) => (
              <div key={s.label} style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"12px", padding:"14px 20px", textAlign:"center", minWidth:"80px" }}>
                <div style={{ fontFamily:S, fontSize:"1.8rem", color:s.color, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontFamily:B, fontSize:"11px", color:C.muted, marginTop:"4px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:C.mist, position:"relative", overflow:"hidden" }}>
          <img src="https://media.coletfs.com/assets/hero/projects/cfs-projects-hero.png" alt="CFS Projects" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", position:"absolute", inset:0 }} />
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {[280, 180, 100].map((size, i) => (
              <div key={i} style={{ position:"absolute", width:`${size}px`, height:`${size}px`, borderRadius:"50%", border:"1px solid rgba(44,72,32,0.12)" }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PROJECTS GRID ── */}
      <div style={{ maxWidth:"1400px", margin:"0 auto", padding:"48px 64px" }}>
        {display.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 0", fontFamily:B, fontSize:"14px", color:C.muted }}>No projects yet — check back soon!</div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:"20px" }}>
          {display.map((p: any) => {
            const status = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.ongoing;
            return (
              <div key={p.id} className="project-card" style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>

                {/* Dark header */}
                <div style={{ background:C.forest, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontFamily:SG, fontSize:"9px", fontWeight:700, color:"rgba(255,255,255,0.6)", letterSpacing:"2px" }}>{p.category ?? "PROJECT"}</span>
                  <span style={{ fontFamily:B, fontSize:"9px", fontWeight:700, color:status.color, background:status.color + "20", border:`1px solid ${status.color}40`, borderRadius:"4px", padding:"2px 8px", letterSpacing:"1px" }}>{status.label}</span>
                </div>

                {/* Cover image */}
                {p.cover_image && (
                  <div style={{ height:"160px", overflow:"hidden" }}>
                    <img src={p.cover_image} alt={p.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  </div>
                )}

                {/* Body */}
                <div style={{ padding:"18px 20px", flex:1, display:"flex", flexDirection:"column", gap:"10px" }}>
                  <h3 style={{ fontFamily:S, fontSize:"16px", color:C.forest, lineHeight:1.3, margin:0 }}>{p.title}</h3>
                  <p style={{ fontFamily:B, fontSize:"13px", color:C.muted, lineHeight:1.7, margin:0 }}>
                    {p.description?.length > 160 ? p.description.slice(0, 160) + "..." : p.description}
                  </p>

                  {/* Progress bar */}
                  {p.status === "ongoing" && (
                    <div style={{ marginTop:"4px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                        <span style={{ fontFamily:B, fontSize:"10px", color:C.muted, letterSpacing:"0.5px" }}>Progress</span>
                        <span style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"#F5C82A" }}>{p.progress_percent ?? 0}%</span>
                      </div>
                      <div style={{ background:C.mist, borderRadius:"20px", height:"6px", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${p.progress_percent ?? 0}%`, background:"linear-gradient(90deg,#3CCE2A,#F5C82A)", borderRadius:"20px" }} />
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  {(p.start_date || p.end_date) && (
                    <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke={C.muted} strokeWidth="2"/><path d="M3 9h18M8 2v4M16 2v4" stroke={C.muted} strokeWidth="2" strokeLinecap="round"/></svg>
                      <span style={{ fontFamily:B, fontSize:"11px", color:C.muted }}>
                        {p.start_date ? new Date(p.start_date).toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" }) : ""}
                        {p.end_date && p.end_date !== p.start_date ? ` – ${new Date(p.end_date).toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" })}` : ""}
                      </span>
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
