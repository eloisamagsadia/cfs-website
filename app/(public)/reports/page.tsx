import type { Metadata } from "next";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Link from "next/link";

export const metadata: Metadata = { title: "Transparency Reports — CFS" };

const R = "var(--font-righteous,'Righteous',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const QUARTER_LABELS: Record<number, string> = { 1: "JAN–MAR", 2: "APR–JUN", 3: "JUL–SEP", 4: "OCT–DEC" };

export default async function ReportsPage() {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: reports } = await supabase
    .from("transparency_reports")
    .select("id, title, year, quarter, summary, published_at, is_published, fund_breakdown")
    .eq("is_published", true)
    .order("year", { ascending: false })
    .order("quarter", { ascending: false });

  const display = reports ?? [];
  const years = [...new Set(display.map((r: any) => r.year))];

  // Compute totals from fund_breakdown for each report
  function getTotals(r: any) {
    const raw = r.fund_breakdown;
    if (!raw) return null;
    if (!Array.isArray(raw) && ("total_inflow" in raw || "total_outflow" in raw)) {
      return {
        inflow: Number(raw.total_inflow ?? 0),
        outflow: Number(raw.total_outflow ?? 0),
        remaining: Number(raw.remaining ?? 0),
      };
    }
    if (Array.isArray(raw)) {
      const total = raw.reduce((s: number, b: any) => s + Number(b.amount), 0);
      return { inflow: total, outflow: 0, remaining: 0 };
    }
    return null;
  }

  const totalAllTime = display.reduce((sum: number, r: any) => {
    const t = getTotals(r);
    return sum + (t?.inflow ?? 0);
  }, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0F1A0B" }}>
      <style>{`.report-card { transition: border-color 0.2s; } .report-card:hover { border-color: #3CCE2A !important; }`}</style>

      {/* ── HERO ── */}
      <div style={{ background: "#1A3D14", borderBottom: "2px solid #2C4820", padding: "56px 24px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(60,206,42,0.1) 1.5px,transparent 1.5px)", backgroundSize: "18px 18px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#0F1A0B", border: "1.5px solid #3CCE2A", borderRadius: "20px", padding: "4px 16px", marginBottom: "20px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3CCE2A" }} />
            <span style={{ fontFamily: R, fontSize: "10px", color: "#3CCE2A", letterSpacing: "2.5px" }}>FULL TRANSPARENCY</span>
          </div>
          <h1 style={{ fontFamily: R, fontSize: "clamp(2rem,5vw,3.2rem)", color: "#F0EAD6", letterSpacing: "4px", marginBottom: "14px" }}>
            TRANSPARENCY REPORTS
          </h1>
          <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "15px", color: "#8AAA78", maxWidth: "520px", margin: "0 auto 32px", lineHeight: 1.8 }}>
            Every peso donated is accounted for. Here's how CFS uses your support — openly, honestly, always.
          </p>

          {/* Stats row */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            {[
              { label: "REPORTS PUBLISHED", value: String(display.length) },
              { label: "TOTAL FUNDS RAISED", value: `₱${(totalAllTime / 1000000).toFixed(2)}M` },
              { label: "QUARTERS COVERED", value: `Q4 2024 – Q3 2025` },
            ].map((s) => (
              <div key={s.label} style={{ background: "#0F2A0B", border: "1.5px solid #2C4820", borderRadius: "10px", padding: "14px 24px", textAlign: "center" }}>
                <div style={{ fontFamily: R, fontSize: "clamp(1.1rem,3vw,1.4rem)", color: "#3CCE2A", letterSpacing: "1px" }}>{s.value}</div>
                <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1.5px", marginTop: "4px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── REPORTS LIST ── */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px" }}>

        {display.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", fontFamily: B, fontSize: "14px", color: "#3A5A30" }}>
            No reports published yet.
          </div>
        )}

        {years.map((year: any) => {
          const yearReports = display.filter((r: any) => r.year === year);
          return (
            <div key={year} style={{ marginBottom: "48px" }}>

              {/* Year header */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
                <div style={{ fontFamily: R, fontSize: "clamp(1.4rem,3vw,1.8rem)", color: "#F0EAD6", letterSpacing: "3px" }}>{year}</div>
                <div style={{ flex: 1, height: "1px", background: "#2C4820" }} />
                <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30", letterSpacing: "1px" }}>
                  {yearReports.length} REPORT{yearReports.length !== 1 ? "S" : ""}
                </span>
              </div>

              {/* Report cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {yearReports.map((r: any) => {
                  const totals = getTotals(r);
                  return (
                    <Link key={r.id} href={`/reports/${r.id}`} style={{ textDecoration: "none" }}>
                      <div className="report-card" style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "14px", padding: "22px 24px", display: "flex", gap: "20px", alignItems: "flex-start" }}>
                        {/* Quarter badge */}
                        <div style={{ flexShrink: 0, textAlign: "center" }}>
                          <div style={{ background: "#0F2A0B", border: "1.5px solid #3CCE2A", borderRadius: "10px", padding: "10px 14px", minWidth: "64px" }}>
                            <div style={{ fontFamily: R, fontSize: "18px", color: "#3CCE2A", letterSpacing: "1px" }}>Q{r.quarter}</div>
                            <div style={{ fontFamily: B, fontSize: "9px", color: "#5A7A50", letterSpacing: "1px", marginTop: "2px" }}>{QUARTER_LABELS[r.quarter]}</div>
                          </div>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
                            <h3 style={{ fontFamily: R, fontSize: "15px", color: "#F0EAD6", letterSpacing: "1px", margin: 0 }}>{r.title}</h3>
                            {r.published_at && (
                              <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30", flexShrink: 0 }}>
                                {new Date(r.published_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            )}
                          </div>

                          {r.summary && (
                            <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78", lineHeight: 1.7, margin: "0 0 14px" }}>
                              {r.summary.length > 180 ? r.summary.slice(0, 180) + "..." : r.summary}
                            </p>
                          )}

                          {/* Cashflow mini summary */}
                          {totals && (
                            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "14px" }}>
                              {[
                                { label: "Inflow", value: totals.inflow, color: "#3CCE2A" },
                                { label: "Outflow", value: totals.outflow, color: "#F04060" },
                                { label: "Remaining", value: totals.remaining, color: "#F5C82A" },
                              ].filter(i => i.value > 0).map((item) => (
                                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                                  <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{item.label}:</span>
                                  <span style={{ fontFamily: R, fontSize: "11px", color: item.color }}>₱{item.value.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: R, fontSize: "11px", color: "#3CCE2A", letterSpacing: "1.5px" }}>
                            READ FULL REPORT
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M5 12h14M12 5l7 7-7 7" stroke="#3CCE2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
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

        {/* Bottom note */}
        <div style={{ textAlign: "center", padding: "24px 0 0", borderTop: "1px solid #2C4820" }}>
          <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "13px", color: "#3A5A30", lineHeight: 1.8 }}>
            CFS is committed to full financial transparency. All fund movements are recorded and published quarterly.
          </p>
        </div>
      </div>
    </div>
  );
}