import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Transparency Reports" };
const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default async function AdminReportsPage() {
  const supabase = createAdminClient();
  const { data: reportsRaw } = await supabase
    .from("transparency_reports").select("*")
    .order("year", { ascending: false }).order("quarter", { ascending: false });
  const reports = (reportsRaw ?? []) as any[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>TRANSPARENCY REPORTS</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>{reports?.length ?? 0} reports · {reports?.filter(r => r.is_published).length ?? 0} published</p>
        </div>
        <Link href="/admin/reports/create" style={{ textDecoration: "none", position: "relative", display: "inline-block" }}>
          <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
          <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "12px", background: "#3CCE2A", color: "#080F06", padding: "8px 18px", border: "2px solid #080F06", borderRadius: "6px", letterSpacing: "1.5px" }}>+ UPLOAD REPORT</span>
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {(reports ?? []).map((r: any) => (
          <div key={r.id} style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", letterSpacing: "1px", marginBottom: "6px" }}>{r.title}</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: R, fontSize: "11px", color: "#3CCE2A", background: "#1A3D14", border: "1px solid #2C4820", borderRadius: "4px", padding: "2px 8px", letterSpacing: "1px" }}>Q{r.quarter} {r.year}</span>
                <span style={{ fontFamily: R, fontSize: "11px", color: r.is_published ? "#3CCE2A" : "#F5C82A", background: r.is_published ? "#1A3D14" : "#3D3000", borderRadius: "20px", padding: "2px 10px", letterSpacing: "1px" }}>
                  {r.is_published ? "PUBLISHED" : "DRAFT"}
                </span>
                {r.summary && <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{r.summary.slice(0, 50)}{r.summary.length > 50 ? "..." : ""}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
              {r.pdf_url && (
                <a href={r.pdf_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: R, fontSize: "10px", color: "#3CCE2A", border: "1.5px solid #2C4820", borderRadius: "4px", padding: "5px 12px", textDecoration: "none", letterSpacing: "1px" }}>
                  VIEW PDF
                </a>
              )}
              <Link href={`/admin/reports/${r.id}/edit`} style={{ textDecoration: "none", fontFamily: B, fontSize: "11px", color: "#8AAA78", border: "1px solid #2C4820", borderRadius: "6px", padding: "6px 12px", letterSpacing: "1px" }}>
                ✏ EDIT
              </Link>
            </div>
          </div>
        ))}
        {!reports?.length && (
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A50" }}>NO REPORTS YET</div>
        )}
      </div>
    </div>
  );
}
