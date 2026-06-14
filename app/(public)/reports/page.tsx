import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Transparency Reports — CFS" };

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

const QUARTER_LABELS: Record<number, string> = { 1: "JAN–MAR", 2: "APR–JUN", 3: "JUL–SEP", 4: "OCT–DEC" };

export default async function ReportsPage() {
  const supabase = createAdminClient();
  const { data: reports } = await supabase
    .from("transparency_reports")
    .select("id, title, year, quarter, summary, published_at, is_published, fund_breakdown")
    .eq("is_published", true)
    .order("year", { ascending: false })
    .order("quarter", { ascending: false });

  const display = reports ?? [];
  const years   = Array.from(new Set(display.map((r: any) => r.year)));

  function getTotals(r: any) {
    const raw = r.fund_breakdown;
    if (!raw) return null;
    if (!Array.isArray(raw) && ("total_inflow" in raw || "total_outflow" in raw)) {
      return { inflow: Number(raw.total_inflow ?? 0), outflow: Number(raw.total_outflow ?? 0), remaining: Number(raw.remaining ?? 0) };
    }
    if (Array.isArray(raw)) {
      const total = raw.reduce((s: number, b: any) => s + Number(b.amount), 0);
      return { inflow: total, outflow: 0, remaining: 0 };
    }
    return null;
  }

  const totalAllTime = display.reduce((sum: number, r: any) => sum + (getTotals(r)?.inflow ?? 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: C.paper }}>
      <style>{`
        .report-card { transition: box-shadow 0.2s, transform 0.2s; }
        .report-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:"420px", overflow:"hidden", maxWidth:"1400px", margin:"0 auto", width:"100%" }}>
        <div style={{ padding:"64px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
          
          <h1 style={{ fontFamily:S, fontSize:"clamp(2.4rem,4vw,3.6rem)", color:C.forest, lineHeight:1.05, marginBottom:"16px" }}>
            Every Peso.<br /><em style={{ fontStyle:"italic", color:C.sage }}>Accounted For.</em>
          </h1>
          <p style={{ fontFamily:B, fontSize:"15px", color:C.muted, maxWidth:"440px", lineHeight:1.9, marginBottom:"40px" }}>
            Every peso donated is accounted for. Here is how CFS uses your support — openly, honestly, always.
          </p>
          <div style={{ display:"flex", gap:"16px", flexWrap:"wrap" }}>
            {[
              { label:"Reports Published", value:String(display.length), color:C.forest },
              { label:"Total Funds Raised", value:`₱${(totalAllTime/1000000).toFixed(2)}M`, color:C.sage },
            ].map((s) => (
              <div key={s.label} style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"12px", padding:"16px 24px", textAlign:"center", minWidth:"120px" }}>
                <div style={{ fontFamily:S, fontSize:"1.8rem", color:s.color, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontFamily:B, fontSize:"11px", color:C.muted, marginTop:"6px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:C.mist, position:"relative", overflow:"hidden" }}>
          <img src="https://media.coletfs.com/assets/hero/reports/cfs-reports-hero.png" alt="CFS Reports" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", position:"absolute", inset:0 }} />
        </div>
      </section>

      {/* ── REPORTS LIST ── */}
      <div style={{ maxWidth:"1400px", margin:"0 auto", padding:"48px 64px" }}>
        {display.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 0", fontFamily:B, fontSize:"14px", color:C.muted }}>No reports published yet.</div>
        )}

        {years.map((year: any) => {
          const yearReports = display.filter((r: any) => r.year === year);
          return (
            <div key={year} style={{ marginBottom:"48px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"20px" }}>
                <div style={{ fontFamily:S, fontSize:"clamp(1.4rem,3vw,1.8rem)", color:C.forest }}>{year}</div>
                <div style={{ flex:1, height:"1px", background:C.border }} />
                <span style={{ fontFamily:B, fontSize:"11px", color:C.muted }}>{yearReports.length} REPORT{yearReports.length !== 1 ? "S" : ""}</span>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                {yearReports.map((r: any) => {
                  const totals = getTotals(r);
                  return (
                    <Link key={r.id} href={`/reports/${r.id}`} style={{ textDecoration:"none" }}>
                      <div className="report-card" style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", display:"flex", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
                        {/* Quarter badge - dark header */}
                        <div style={{ background:C.forest, padding:"24px 20px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minWidth:"90px", flexShrink:0 }}>
                          <div style={{ fontFamily:S, fontSize:"24px", color:C.green, lineHeight:1 }}>Q{r.quarter}</div>
                          <div style={{ fontFamily:B, fontSize:"9px", color:"rgba(255,255,255,0.5)", letterSpacing:"1px", marginTop:"4px" }}>{QUARTER_LABELS[r.quarter]}</div>
                        </div>

                        {/* Content */}
                        <div style={{ flex:1, padding:"20px 24px", minWidth:0 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px", flexWrap:"wrap", marginBottom:"8px" }}>
                            <h3 style={{ fontFamily:S, fontSize:"16px", color:C.forest, margin:0, lineHeight:1.3 }}>{r.title}</h3>
                            {r.published_at && (
                              <span style={{ fontFamily:B, fontSize:"11px", color:C.muted, flexShrink:0 }}>
                                {new Date(r.published_at).toLocaleDateString("en-PH", { month:"short", day:"numeric", year:"numeric" })}
                              </span>
                            )}
                          </div>

                          {r.summary && (
                            <p style={{ fontFamily:B, fontSize:"13px", color:C.muted, lineHeight:1.7, margin:"0 0 12px" }}>
                              {r.summary.length > 180 ? r.summary.slice(0, 180) + "..." : r.summary}
                            </p>
                          )}

                          {totals && (
                            <div style={{ display:"flex", gap:"16px", flexWrap:"wrap", marginBottom:"12px" }}>
                              {[
                                { label:"Inflow",    value:totals.inflow,    color:C.green },
                                { label:"Outflow",   value:totals.outflow,   color:"#F04060" },
                                { label:"Remaining", value:totals.remaining, color:"#F5C82A" },
                              ].filter(i => i.value > 0).map((item) => (
                                <div key={item.label} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                                  <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:item.color, flexShrink:0 }} />
                                  <span style={{ fontFamily:B, fontSize:"11px", color:C.muted }}>{item.label}:</span>
                                  <span style={{ fontFamily:SG, fontSize:"11px", fontWeight:600, color:item.color }}>₱{item.value.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", fontFamily:B, fontSize:"11px", fontWeight:600, color:C.sage }}>
                            Read Full Report
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={C.sage} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={{ textAlign:"center", padding:"24px 0 0", borderTop:`1px solid ${C.border}` }}>
          <p style={{ fontFamily:S, fontStyle:"italic", fontSize:"13px", color:C.muted, lineHeight:1.8 }}>
            CFS is committed to full financial transparency. All fund movements are recorded and published quarterly.
          </p>
        </div>
      </div>
    </div>
  );
}
