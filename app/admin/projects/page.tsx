import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Manage Projects" };
const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const SC: any = { ongoing: "#1A8040", completed: "#5A7A60" };

export default async function AdminProjectsPage() {
  const supabase = createAdminClient();
  const { data: projectsRaw } = await (((supabase.from("projects") as any) as any) as any).select("*").order("created_at", { ascending: false });
  const projects = projectsRaw as any;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>PROJECTS</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>{projects?.length ?? 0} total projects</p>
        </div>
        <Link href="/admin/projects/create" style={{ textDecoration: "none", position: "relative", display: "inline-block" }}>
          <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
          <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "12px", background: "#1A8040", color: "#1B3A2D", padding: "8px 18px", border: "2px solid #1B3A2D", borderRadius: "6px", letterSpacing: "1.5px" }}>+ ADD PROJECT</span>
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {(projects ?? []).map((p: any) => {
          const color = SC[p.status] ?? "#5A7A60";
          return (
            <div key={p.id} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1px" }}>{p.title}</span>
                  {p.category && <span style={{ fontFamily: B, fontSize: "10px", color: "#4A7C59", background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "4px", padding: "1px 8px" }}>{p.category}</span>}
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: R, fontSize: "11px", color, background: color + "20", borderRadius: "20px", padding: "1px 8px", letterSpacing: "1px" }}>{p.status.toUpperCase()}</span>
                  {p.status === "ongoing" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "80px", height: "6px", background: "#F2F7F2", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p.progress_percent ?? 0}%`, background: "#1A8040" }} />
                      </div>
                      <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{p.progress_percent ?? 0}%</span>
                    </div>
                  )}
                  {p.description && <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>{p.description.slice(0, 60)}{p.description.length > 60 ? "..." : ""}</span>}
                </div>
              </div>
              <Link href={`/admin/projects/${p.id}/edit`} style={{ textDecoration: "none", fontFamily: B, fontSize: "11px", color: "#4A7C59", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "6px 12px", letterSpacing: "1px", flexShrink: 0 }}>
                ✏ EDIT
              </Link>
            </div>
          );
        })}
        {!projects?.length && <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A60", letterSpacing: "2px" }}>NO PROJECTS YET</div>}
      </div>
    </div>
  );
}
