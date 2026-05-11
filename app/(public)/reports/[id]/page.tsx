import { createClient as createAdminClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";


function renderMarkdown(text: string): string {
  const R = "var(--font-righteous,Righteous,sans-serif)";
  const B = "var(--font-barlow,Barlow,sans-serif)";
  return text
    .replace(/^## (.+)$/gm, `<h2 style="font-family:${R};font-size:1.2rem;color:#F0EAD6;letter-spacing:2px;margin:24px 0 10px;border-bottom:1px solid #2C4820;padding-bottom:8px">$1</h2>`)
    .replace(/^### (.+)$/gm, `<h3 style="font-family:${R};font-size:0.95rem;color:#3CCE2A;letter-spacing:1.5px;margin:20px 0 8px">$1</h3>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:#F0EAD6;font-weight:700">$1</strong>`)
    .replace(/^\|[-| :]+\|$/gm, "")
    .replace(/^\|(.+)\|$/gm, (_: string, row: string) => {
      const cells = row.split("|").map((c: string) => c.trim());
      return (
        `<div style="display:flex;border-bottom:1px solid #2C4820">` +
        cells.map((c: string, i: number) =>
          `<div style="flex:${i === 0 ? 2 : 1};padding:8px 12px;font-family:${B};font-size:13px;color:${i === 0 ? "#C8C0A8" : "#3CCE2A"}">${c}</div>`
        ).join("") +
        `</div>`
      );
    })
    .replace(/^- (.+)$/gm, `<div style="display:flex;gap:8px;align-items:flex-start;margin:4px 0;padding-left:4px"><span style="color:#3CCE2A">•</span><span style="font-family:${B};font-size:13px;color:#C8C0A8;line-height:1.7">$1</span></div>`)
    .replace(/^\s*$/gm, `<div style="height:8px"></div>`);
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: r } = await supabase.from("transparency_reports").select("title").eq("id", params.id).single();
  return { title: r?.title ?? "Transparency Report" };
}

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: report } = await supabase
    .from("transparency_reports")
    .select("*")
    .eq("id", params.id)
    .eq("is_published", true)
    .single();

  if (!report) notFound();

  // fund_breakdown can be either:
  // A) { total_inflow, total_outflow, remaining, inflow: [], outflow: [] }  ← our seeded data
  // B) a flat array [{ label, amount, color }]  ← legacy format
  const raw = report.fund_breakdown ?? null;
  const isStructured = raw && !Array.isArray(raw) && ("inflow" in raw || "outflow" in raw);
  const inflow: { label: string; amount: number }[] = isStructured ? (raw.inflow ?? []) : [];
  const outflow: { label: string; amount: number }[] = isStructured ? (raw.outflow ?? []) : [];
  const flatBreakdown: { label: string; amount: number; color?: string }[] = Array.isArray(raw) ? raw : [];

  const totalInflow = isStructured ? Number(raw.total_inflow ?? 0) : flatBreakdown.reduce((s, b) => s + Number(b.amount), 0);
  const totalOutflow = isStructured ? Number(raw.total_outflow ?? 0) : 0;
  const remaining = isStructured ? Number(raw.remaining ?? 0) : 0;

  const colors = ["#3CCE2A", "#F07228", "#F5C82A", "#8EE440", "#F04060", "#3CCE2A", "#F07228", "#F5C82A"];

  function BreakdownBar({ items, total, accent }: { items: { label: string; amount: number; color?: string }[]; total: number; accent: string }) {
    if (!items.length) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {items.map((item, i) => {
          const pct = total > 0 ? Math.round((Number(item.amount) / total) * 100) : 0;
          const color = item.color || colors[i % colors.length];
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6" }}>{item.label}</span>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontFamily: R, fontSize: "13px", color }}>₱{Number(item.amount).toLocaleString()}</span>
                  <span style={{ fontFamily: R, fontSize: "11px", color: "#5A7A50", width: "36px", textAlign: "right" }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: "8px", background: "#243520", borderRadius: "20px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "20px" }}/>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F1A0B" }}>

      {/* Header */}
      <div style={{ background: "#1A3D14", borderBottom: "2px solid #2C4820", padding: "48px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(60,206,42,0.12) 1.5px,transparent 1.5px)", backgroundSize: "18px 18px" }}/>
        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto" }}>
          <Link href="/reports" style={{ fontFamily: R, fontSize: "11px", color: "#5A7A50", textDecoration: "none", letterSpacing: "1px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
            <svg width="6" height="10" viewBox="0 0 6 10"><path d="M5 1L1 5L5 9" stroke="#5A7A50" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
            BACK TO REPORTS
          </Link>
          <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
            <span style={{ fontFamily: R, fontSize: "11px", color: "#3CCE2A", background: "#1A3D14", border: "1.5px solid #3CCE2A", borderRadius: "6px", padding: "3px 12px", letterSpacing: "1.5px" }}>
              Q{report.quarter} {report.year}
            </span>
            <span style={{ fontFamily: R, fontSize: "11px", color: "#F5C82A", background: "#3D3000", border: "1.5px solid #F5C82A40", borderRadius: "6px", padding: "3px 12px", letterSpacing: "1.5px" }}>
              TRANSPARENCY REPORT
            </span>
          </div>
          <h1 style={{ fontFamily: R, fontSize: "clamp(1.6rem,4vw,2.6rem)", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "12px" }}>
            {report.title}
          </h1>
          {report.published_at && (
            <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>
              Published {new Date(report.published_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* Summary */}
        {report.summary && (
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "24px" }}>
            <div style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "2px", marginBottom: "12px" }}>SUMMARY</div>
            <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "16px", color: "#C8C0A8", lineHeight: 1.9 }}>
              {report.summary}
            </p>
          </div>
        )}

        {/* Cashflow summary cards — structured data only */}
        {isStructured && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { label: "TOTAL INFLOW", amount: totalInflow, color: "#3CCE2A" },
              { label: "TOTAL OUTFLOW", amount: totalOutflow, color: "#F04060" },
              { label: "REMAINING FUNDS", amount: remaining, color: "#F5C82A" },
            ].map((item) => (
              <div key={item.label} style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "18px 20px" }}>
                <div style={{ fontFamily: R, fontSize: "10px", color: "#5A7A50", letterSpacing: "1.5px", marginBottom: "8px" }}>{item.label}</div>
                <div style={{ fontFamily: R, fontSize: "clamp(1rem,2.5vw,1.3rem)", color: item.color }}>
                  ₱{item.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inflow breakdown */}
        {isStructured && inflow.length > 0 && (
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "24px" }}>
            <div style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "2px", marginBottom: "6px" }}>INFLOW BREAKDOWN</div>
            <div style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78", marginBottom: "20px" }}>
              Total: <span style={{ color: "#3CCE2A", fontFamily: R }}>₱{totalInflow.toLocaleString()}</span>
            </div>
            <BreakdownBar items={inflow} total={totalInflow} accent="#3CCE2A" />
          </div>
        )}

        {/* Outflow breakdown */}
        {isStructured && outflow.length > 0 && (
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "24px" }}>
            <div style={{ fontFamily: R, fontSize: "12px", color: "#F04060", letterSpacing: "2px", marginBottom: "6px" }}>OUTFLOW BREAKDOWN</div>
            <div style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78", marginBottom: "20px" }}>
              Total: <span style={{ color: "#F04060", fontFamily: R }}>₱{totalOutflow.toLocaleString()}</span>
            </div>
            <BreakdownBar items={outflow} total={totalOutflow} accent="#F04060" />
          </div>
        )}

        {/* Flat breakdown — legacy format */}
        {!isStructured && flatBreakdown.length > 0 && (
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "24px" }}>
            <div style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "2px", marginBottom: "6px" }}>FUND BREAKDOWN</div>
            <div style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78", marginBottom: "20px" }}>
              Total: <span style={{ color: "#3CCE2A", fontFamily: R }}>₱{totalInflow.toLocaleString()}</span>
            </div>
            <BreakdownBar items={flatBreakdown} total={totalInflow} accent="#3CCE2A" />
          </div>
        )}

        {/* Content body */}
        {report.content && (
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "24px" }}>
            <div style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "2px", marginBottom: "16px" }}>FULL REPORT</div>
            <div
              style={{ fontFamily: B, fontSize: "14px", color: "#C8C0A8", lineHeight: 1.9 }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(report.content) }}
            />
          </div>
        )}

        {/* Projects covered */}
        {report.projects_covered && (report.projects_covered as string[]).length > 0 && (
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "24px" }}>
            <div style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "2px", marginBottom: "14px" }}>PROJECTS COVERED</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(report.projects_covered as string[]).map((p: string, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "#243520", borderRadius: "8px", border: "1px solid #2C4820" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3CCE2A", flexShrink: 0 }}/>
                  <span style={{ fontFamily: B, fontSize: "13px", color: "#F0EAD6" }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF download */}
        {report.pdf_url && (
          <div style={{ background: "#1A3D14", border: "2px solid #3CCE2A", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", letterSpacing: "1.5px", marginBottom: "4px" }}>DOWNLOAD FULL REPORT</div>
              <div style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>PDF version of Q{report.quarter} {report.year} report</div>
            </div>
            <a href={report.pdf_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", position: "relative", display: "inline-block" }}>
              <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }}/>
              <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "12px", background: "#3CCE2A", color: "#080F06", padding: "10px 20px", border: "2px solid #080F06", borderRadius: "6px", letterSpacing: "1.5px" }}>
                DOWNLOAD PDF ↓
              </span>
            </a>
          </div>
        )}

        {/* Bottom nav */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Link href="/reports" style={{ fontFamily: R, fontSize: "12px", color: "#5A7A50", textDecoration: "none", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "10px 24px", letterSpacing: "1.5px" }}>
            ← ALL REPORTS
          </Link>
        </div>
      </div>
    </div>
  );
}