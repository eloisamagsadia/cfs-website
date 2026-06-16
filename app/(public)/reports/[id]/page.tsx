import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BreakdownChart, CashflowBar } from "@/components/public/ReportCharts";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function renderMarkdown(text: string): string {
  return text
    .replace(/^## (.+)$/gm, `<h2 style="font-family:${SG};font-size:1rem;font-weight:700;color:${C.forest};letter-spacing:2px;margin:24px 0 10px;border-bottom:1px solid ${C.border};padding-bottom:8px">$1</h2>`)
    .replace(/^### (.+)$/gm, `<h3 style="font-family:${SG};font-size:0.9rem;font-weight:700;color:${C.sage};letter-spacing:1.5px;margin:20px 0 8px">$1</h3>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:${C.forest};font-weight:700">$1</strong>`)
    .replace(/^\|[-| :]+\|$/gm, "")
    .replace(/^\|(.+)\|$/gm, (_: string, row: string) => {
      const cells = row.split("|").map((c: string) => c.trim());
      return (
        `<div style="display:flex;border-bottom:1px solid ${C.border}">` +
        cells.map((c: string, i: number) =>
          `<div style="flex:${i === 0 ? 2 : 1};padding:8px 12px;font-family:${B};font-size:13px;color:${i === 0 ? C.forest : C.sage}">${c}</div>`
        ).join("") +
        `</div>`
      );
    })
    .replace(/^- (.+)$/gm, `<div style="display:flex;gap:8px;align-items:flex-start;margin:4px 0;padding-left:4px"><span style="color:${C.sage}">•</span><span style="font-family:${B};font-size:13px;color:${C.muted};line-height:1.7">$1</span></div>`)
    .replace(/^\s*$/gm, `<div style="height:8px"></div>`);
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data: rRaw } = await (supabase.from("transparency_reports") as any).select("title").eq("id", params.id).single();
  return { title: (rRaw as any)?.title ?? "Transparency Report" };
}

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { data: reportRaw } = await supabase.from("transparency_reports").select("*").eq("id", params.id).eq("is_published", true).single();
  if (!reportRaw) notFound();
  const report = reportRaw as any;

  const raw = report.fund_breakdown ?? null;
  const isStructured = raw && !Array.isArray(raw) && ("inflow" in raw || "outflow" in raw);
  const inflow: { label: string; amount: number }[]  = isStructured ? (raw.inflow ?? [])  : [];
  const outflow: { label: string; amount: number }[] = isStructured ? (raw.outflow ?? []) : [];
  const flatBreakdown: { label: string; amount: number; color?: string }[] = Array.isArray(raw) ? raw : [];

  const totalInflow  = isStructured ? Number(raw.total_inflow  ?? 0) : flatBreakdown.reduce((s, b) => s + Number(b.amount), 0);
  const totalOutflow = isStructured ? Number(raw.total_outflow ?? 0) : 0;
  const remaining    = isStructured ? Number(raw.remaining     ?? 0) : 0;

  const colors = [C.sage, "#F07228", "#F5C82A", "#8EE440", "#F04060"];

  function BreakdownBar({ items, total }: { items: { label: string; amount: number; color?: string }[]; total: number; accent?: string }) {
    if (!items.length) return null;
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
        {items.map((item, i) => {
          const pct   = total > 0 ? Math.round((Number(item.amount) / total) * 100) : 0;
          const color = item.color || colors[i % colors.length];
          return (
            <div key={i}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                <span style={{ fontFamily:B, fontSize:"13px", color:C.forest }}>{item.label}</span>
                <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
                  <span style={{ fontFamily:SG, fontSize:"13px", fontWeight:600, color }}> ₱{Number(item.amount).toLocaleString()}</span>
                  <span style={{ fontFamily:B, fontSize:"11px", color:C.muted, width:"36px", textAlign:"right" }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height:"8px", background:C.mist, borderRadius:"20px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:"20px" }} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const QUARTER_LABELS: Record<number, string> = { 1:"JAN–MAR", 2:"APR–JUN", 3:"JUL–SEP", 4:"OCT–DEC" };

  return (
    <div style={{ minHeight:"100vh", background:C.paper }}>

      {/* Header */}
      <div style={{ background:C.cream, borderBottom:`1px solid ${C.border}`, padding:"48px 64px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle,rgba(44,72,32,0.05) 1.5px,transparent 1.5px)", backgroundSize:"18px 18px" }} />
        <div style={{ position:"relative", zIndex:1, maxWidth:"1400px", margin:"0 auto" }}>
          <Link href="/reports" style={{ fontFamily:B, fontSize:"11px", color:C.sage, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:"6px", marginBottom:"24px" }}>
            <svg width="6" height="10" viewBox="0 0 6 10"><path d="M5 1L1 5L5 9" stroke={C.sage} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
            Back to Reports
          </Link>
          <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
            <span style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:C.sage, background:C.mist, border:`1px solid ${C.border}`, borderRadius:"6px", padding:"3px 12px", letterSpacing:"1px" }}>
              Q{report.quarter} {report.year} — {QUARTER_LABELS[report.quarter]}
            </span>
            <span style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"#F5C82A", background:"#FFF8E1", border:"1px solid #F5C82A40", borderRadius:"6px", padding:"3px 12px" }}>
              TRANSPARENCY REPORT
            </span>
          </div>
          <h1 style={{ fontFamily:S, fontSize:"clamp(1.6rem,4vw,2.6rem)", color:C.forest, lineHeight:1.05, marginBottom:"12px" }}>{report.title}</h1>
          {report.published_at && (
            <p style={{ fontFamily:B, fontSize:"13px", color:C.muted }}>
              Published {new Date(report.published_at).toLocaleDateString("en-PH", { month:"long", day:"numeric", year:"numeric" })}
            </p>
          )}
        </div>
      </div>

      <div style={{ maxWidth:"1400px", margin:"0 auto", padding:"40px 64px", display:"flex", flexDirection:"column", gap:"20px" }}>

        {/* Summary */}
        {report.summary && (
          <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ background:C.forest, padding:"16px 24px" }}>
              <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.7)", letterSpacing:"3px" }}>SUMMARY</div>
            </div>
            <div style={{ padding:"24px" }}>
              <p style={{ fontFamily:S, fontStyle:"italic", fontSize:"16px", color:C.muted, lineHeight:1.9, margin:0 }}>{report.summary}</p>
            </div>
          </div>
        )}

        {/* Cashflow summary cards */}
        {isStructured && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px" }}>
            {[
              { label:"Total Inflow",    amount:totalInflow,  color:C.green },
              { label:"Total Outflow",   amount:totalOutflow, color:"#F04060" },
              { label:"Remaining Funds", amount:remaining,    color:"#F5C82A" },
            ].map((item) => (
              <div key={item.label} style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
                <div style={{ background:C.forest, padding:"12px 20px" }}>
                  <div style={{ fontFamily:SG, fontSize:"9px", fontWeight:700, color:"rgba(255,255,255,0.6)", letterSpacing:"2px" }}>{item.label.toUpperCase()}</div>
                </div>
                <div style={{ padding:"20px" }}>
                  <div style={{ fontFamily:S, fontSize:"clamp(1rem,2.5vw,1.4rem)", color:item.color }}>
                    ₱{item.amount.toLocaleString("en-PH", { minimumFractionDigits:2 })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inflow breakdown */}
        {isStructured && inflow.length > 0 && (
          <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ background:C.forest, padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.7)", letterSpacing:"3px" }}>INFLOW BREAKDOWN</div>
              <span style={{ fontFamily:SG, fontSize:"11px", fontWeight:600, color:C.green }}>₱{totalInflow.toLocaleString()}</span>
            </div>
            <div style={{ padding:"24px" }}>
              <CashflowBar inflow={totalInflow} outflow={totalOutflow} remaining={remaining} />
              <div style={{ marginTop:"32px" }}>
                <BreakdownChart items={inflow} total={totalInflow} title="Inflow Breakdown" accentColor={C.green} />
              </div>
            </div>
          </div>
        )}

        {/* Outflow breakdown */}
        {isStructured && outflow.length > 0 && (
          <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ background:C.forest, padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.7)", letterSpacing:"3px" }}>OUTFLOW BREAKDOWN</div>
              <span style={{ fontFamily:SG, fontSize:"11px", fontWeight:600, color:"#F04060" }}>₱{totalOutflow.toLocaleString()}</span>
            </div>
            <div style={{ padding:"24px" }}>
              <BreakdownChart items={outflow} total={totalOutflow} title="Outflow Breakdown" accentColor="#F04060" />
            </div>
          </div>
        )}

        {/* Flat breakdown */}
        {!isStructured && flatBreakdown.length > 0 && (
          <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ background:C.forest, padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.7)", letterSpacing:"3px" }}>FUND BREAKDOWN</div>
              <span style={{ fontFamily:SG, fontSize:"11px", fontWeight:600, color:C.green }}>₱{totalInflow.toLocaleString()}</span>
            </div>
            <div style={{ padding:"24px" }}>
              <BreakdownChart items={flatBreakdown} total={totalInflow} title="Fund Breakdown" accentColor={C.green} />
            </div>
          </div>
        )}

        {/* Detailed expense breakdown by project */}
        {isStructured && Array.isArray(raw.outflow_detailed) && raw.outflow_detailed.length > 0 && (
          <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ background:C.forest, padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.7)", letterSpacing:"3px" }}>EXPENSE BREAKDOWN BY PROJECT</div>
              <span style={{ fontFamily:SG, fontSize:"11px", fontWeight:600, color:"#F04060" }}>₱{totalOutflow.toLocaleString("en-PH", { minimumFractionDigits:2 })}</span>
            </div>
            <div style={{ padding:"16px 24px", display:"flex", flexDirection:"column", gap:"16px" }}>
              {(raw.outflow_detailed as { project: string; items: { description: string; amount: number; notes?: string }[] }[]).map((proj, pi) => {
                const projTotal = proj.items.reduce((s, i) => s + Number(i.amount), 0);
                const pct = totalOutflow > 0 ? Math.round((projTotal / totalOutflow) * 100) : 0;
                const color = colors[pi % colors.length];
                return (
                  <div key={pi} style={{ border:`1px solid ${C.border}`, borderRadius:"12px", overflow:"hidden" }}>
                    <div style={{ background:C.cream, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${C.border}` }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:color, flexShrink:0 }} />
                        <span style={{ fontFamily:SG, fontSize:"12px", fontWeight:700, color:C.forest }}>{proj.project}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <span style={{ fontFamily:B, fontSize:"11px", color:C.muted }}>{pct}%</span>
                        <span style={{ fontFamily:SG, fontSize:"12px", fontWeight:700, color }}> ₱{projTotal.toLocaleString("en-PH", { minimumFractionDigits:2 })}</span>
                      </div>
                    </div>
                    <div style={{ padding:"8px 0" }}>
                      {proj.items.map((item, ii) => (
                        <div key={ii} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"6px 16px", borderBottom: ii < proj.items.length - 1 ? `1px solid ${C.mist}` : "none", gap:"12px" }}>
                          <div style={{ flex:1 }}>
                            <span style={{ fontFamily:B, fontSize:"12px", color:C.forest }}>{item.description}</span>
                            {item.notes && <span style={{ fontFamily:B, fontSize:"11px", color:C.muted, display:"block", marginTop:"1px" }}>{item.notes}</span>}
                          </div>
                          <span style={{ fontFamily:SG, fontSize:"12px", fontWeight:600, color:"#F04060", flexShrink:0 }}>₱{Number(item.amount).toLocaleString("en-PH", { minimumFractionDigits:2 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content body */}
        {report.content && (
          <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ background:C.forest, padding:"16px 24px" }}>
              <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.7)", letterSpacing:"3px" }}>FULL REPORT</div>
            </div>
            <div style={{ padding:"24px", fontFamily:B, fontSize:"14px", color:C.muted, lineHeight:1.9 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(report.content) }} />
          </div>
        )}

        {/* Projects covered */}
        {report.projects_covered && (report.projects_covered as string[]).length > 0 && (
          <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ background:C.forest, padding:"16px 24px" }}>
              <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.7)", letterSpacing:"3px" }}>PROJECTS COVERED</div>
            </div>
            <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:"8px" }}>
              {(report.projects_covered as string[]).map((p: string, i: number) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 14px", background:C.cream, borderRadius:"8px", border:`1px solid ${C.border}` }}>
                  <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:C.sage, flexShrink:0 }} />
                  <span style={{ fontFamily:B, fontSize:"13px", color:C.forest }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF download */}
        {report.pdf_url && (
          <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
            <div>
              <div style={{ fontFamily:SG, fontSize:"12px", fontWeight:700, color:C.forest, marginBottom:"4px" }}>Download Full Report</div>
              <div style={{ fontFamily:B, fontSize:"12px", color:C.muted }}>PDF version of Q{report.quarter} {report.year} report</div>
            </div>
            <a href={report.pdf_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none", display:"inline-flex", alignItems:"center", gap:"8px", fontFamily:SG, fontSize:"12px", fontWeight:700, background:C.forest, color:"#ffffff", padding:"10px 20px", borderRadius:"8px", letterSpacing:"1px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              DOWNLOAD PDF
            </a>
          </div>
        )}

        {/* Bottom nav */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:"8px" }}>
          <Link href="/reports" style={{ fontFamily:B, fontSize:"12px", fontWeight:600, color:C.sage, textDecoration:"none", border:`1px solid ${C.border}`, borderRadius:"8px", padding:"10px 24px", display:"inline-flex", alignItems:"center", gap:"6px" }}>
            <svg width="6" height="10" viewBox="0 0 6 10"><path d="M5 1L1 5L5 9" stroke={C.sage} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
            All Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
