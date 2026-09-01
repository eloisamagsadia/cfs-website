"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconDownload, IconWarning, IconCheck, IconShield, IconLink } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface TableRow { name: string; count: number; error: string | null; }

export default function BackupPage() {
  const [tables, setTables]   = useState<TableRow[]>([]);
  const [totalRows, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [lastExport, setLast] = useState<Date | null>(null);

  useEffect(() => {
    fetch("/api/super/backup/tables").then(r => r.json()).then(d => {
      if (d.error) setError(d.error);
      else { setTables(d.tables ?? []); setTotal(d.total_rows ?? 0); }
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function exportSnapshot() {
    if (!confirm(`Download a JSON snapshot of ${totalRows.toLocaleString()} rows across ${tables.length} tables?\n\nThis reads every row and can take up to a minute. Nothing on the server is deleted or changed.`)) return;
    setExporting(true); setError(""); setStatus("Preparing snapshot… this may take a while.");
    try {
      const r = await fetch("/api/super/backup/export", { method: "POST" });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error ?? `Export failed (${r.status})`); }
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const now  = new Date();
      a.href = url;
      a.download = `cfs-backup-${now.toISOString().slice(0, 10)}-${now.toISOString().slice(11, 16).replace(":", "")}.json`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      setLast(now);
      setStatus(`Snapshot downloaded · ${(blob.size / 1024).toFixed(1)} KB`);
    } catch (e: any) { setError(e.message); }
    finally { setExporting(false); }
  }

  const nonEmpty = useMemo(() => tables.filter(t => t.count > 0).sort((a, b) => b.count - a.count), [tables]);
  const empty = useMemo(() => tables.filter(t => t.count === 0), [tables]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

      {/* Header */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px" }}>
        <Link href="/super" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← COMMAND CENTER</Link>
        <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#156530", letterSpacing: "2.5px", marginTop: "4px" }}>DATABASE BACKUP</h1>
        <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "2px" }}>On-demand JSON snapshot of every row in every public table. Restore is intentionally not here — use the Supabase dashboard for that.</p>
      </div>

      {/* Reality check */}
      <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <IconWarning size={16} color="#7A5A0F" />
        <div style={{ fontFamily: B, fontSize: "12px", color: "#7A5A0F", lineHeight: 1.6 }}>
          <strong>What this is:</strong> a client-triggered read of every row in every public table, streamed as a JSON file for you to archive locally. It doesn't include schema (columns/indexes/functions), and it isn't a substitute for Supabase's own point-in-time recovery.<br/><br/>
          <strong>For actual restore:</strong> use the <a href="https://supabase.com/dashboard/project/kwwmnnjqarwjbpmeywos/database/backups" target="_blank" rel="noopener noreferrer" style={{ color: "#7A5A0F", fontWeight: 700 }}>Supabase Backups dashboard</a> (Database → Backups). Supabase runs automatic daily backups; on paid plans you also get point-in-time recovery.
        </div>
      </div>

      {error  && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {/* Action card */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>SNAPSHOT NOW</div>
            <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", marginTop: "3px" }}>
              {loading ? "Counting rows…"
                : `${totalRows.toLocaleString()} rows across ${tables.length} tables${nonEmpty.length ? ` (${nonEmpty.length} non-empty)` : ""}`}
            </div>
          </div>
          <button onClick={exportSnapshot} disabled={loading || exporting}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: exporting ? "#B7CDB7" : "#1A8040", border: "none", borderRadius: "10px", padding: "10px 18px", cursor: exporting || loading ? "wait" : "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <IconDownload size={12} color="#ffffff" />
            {exporting ? "PREPARING…" : "DOWNLOAD JSON SNAPSHOT"}
          </button>
        </div>
        {lastExport && (
          <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>
            Last downloaded from this browser: {lastExport.toLocaleString("en-PH", { timeZone: "Asia/Manila" })} PHT
          </div>
        )}
      </div>

      {/* Restore link */}
      <a href="https://supabase.com/dashboard/project/kwwmnnjqarwjbpmeywos/database/backups" target="_blank" rel="noopener noreferrer"
        style={{ textDecoration: "none", background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#E8F0E4", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <IconShield size={16} color="#1A8040" />
          </div>
          <div>
            <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "1.5px" }}>SUPABASE BACKUP DASHBOARD</div>
            <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "2px" }}>View automatic daily backups, download older ones, or trigger a restore.</div>
          </div>
        </div>
        <IconLink size={14} color="#1A8040" />
      </a>

      {/* Table overview */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: "#F7FAF5", borderBottom: "1px solid #E4EDE4", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>TABLE OVERVIEW</div>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.2px" }}>{tables.length} TABLES</div>
        </div>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>COUNTING ROWS…</div>
        ) : (
          <>
            {nonEmpty.map((t, i) => (
              <div key={t.name} style={{ padding: "8px 20px", borderTop: i === 0 ? "none" : "1px solid #F0F5F0", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "10px", alignItems: "center" }}>
                <span style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "12px", color: "#1B3A2D" }}>{t.name}</span>
                <span style={{ fontFamily: R, fontSize: "13px", color: "#1A8040", letterSpacing: "0.5px", textAlign: "right" }}>{t.count.toLocaleString()}</span>
              </div>
            ))}
            {empty.length > 0 && (
              <details style={{ padding: "10px 20px", borderTop: "1px dashed #E4EDE4", background: "#FBFDFB" }}>
                <summary style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#7A8E7A", letterSpacing: "1.2px", cursor: "pointer" }}>
                  {empty.length} EMPTY TABLE{empty.length === 1 ? "" : "S"} · SHOW
                </summary>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                  {empty.map(t => (
                    <code key={t.name} style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "10px", color: "#5A7A60", background: "#F2F7F2", borderRadius: "4px", padding: "3px 7px" }}>{t.name}</code>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}
