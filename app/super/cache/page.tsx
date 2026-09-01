"use client";
import { useState } from "react";
import Link from "next/link";
import { IconCheck, IconWarning, IconLightning } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Result { path: string; ok: boolean; error?: string; }

const GROUPS: { label: string; description: string; paths: string[] }[] = [
  {
    label: "PUBLIC SURFACES",
    description: "The most common re-cache targets. Use after publishing an event, adding a product, or updating a report.",
    paths: ["/", "/events", "/shop", "/donate", "/reports", "/projects", "/terms"],
  },
  {
    label: "MEMBERS AREA",
    description: "Refresh member-facing dashboards. Rare unless a shared piece of data changed.",
    paths: ["/members", "/members/community", "/members/events", "/members/tickets", "/members/orders", "/members/donations"],
  },
  {
    label: "STAFF SURFACES",
    description: "For when an admin/super dashboard feels stale after a data edit.",
    paths: ["/admin", "/admin/events", "/super"],
  },
];

export default function CachePage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy]         = useState(false);
  const [results, setResults]   = useState<Result[]>([]);
  const [error, setError]       = useState("");

  const toggle = (p: string) => setSelected(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
  const selectGroup = (paths: string[]) => setSelected(prev => { const n = new Set(prev); for (const p of paths) n.add(p); return n; });
  const clearAll = () => setSelected(new Set());

  async function revalidate(paths: string[]) {
    if (paths.length === 0) return;
    setBusy(true); setError(""); setResults([]);
    try {
      const r = await fetch("/api/super/cache", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paths }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "failed");
      setResults(d.results ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  const selectedList = Array.from(selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px" }}>
        <Link href="/super" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← COMMAND CENTER</Link>
        <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#156530", letterSpacing: "2.5px", marginTop: "4px" }}>CACHE INVALIDATION</h1>
        <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "2px" }}>Force a fresh render for cached pages without redeploying. Nothing on this page is destructive — worst case, the next visitor pays a small render cost.</p>
      </div>

      {error   && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {results.length > 0 && (
        <div style={{ background: "#F7FAF5", border: "1px solid #DDE8DD", borderRadius: "10px", padding: "12px 14px" }}>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginBottom: "8px" }}>RESULTS</div>
          {results.map(r => (
            <div key={r.path} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", fontFamily: B, fontSize: "12px", color: r.ok ? "#156530" : "#8A1E27" }}>
              {r.ok ? <IconCheck size={11} color="#156530" /> : <IconWarning size={11} color="#8A1E27" />}
              <code style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}>{r.path}</code>
              {!r.ok && <span style={{ color: "#7A8E7A" }}>· {r.error}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Selection action bar */}
      <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "14px", padding: "12px 14px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", position: "sticky", top: "16px", zIndex: 5 }}>
        <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#7A5A0F", letterSpacing: "1.5px" }}>
          {selectedList.length === 0 ? "PICK PATHS BELOW" : `${selectedList.length} SELECTED`}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          {selectedList.length > 0 && (
            <button onClick={clearAll} disabled={busy}
              style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>CLEAR</button>
          )}
          <button onClick={() => revalidate(selectedList)} disabled={busy || selectedList.length === 0}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: busy || selectedList.length === 0 ? "#B7CDB7" : "#1A8040", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: busy || selectedList.length === 0 ? "not-allowed" : "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <IconLightning size={11} color="#ffffff" /> {busy ? "REVALIDATING…" : "REVALIDATE SELECTED"}
          </button>
        </div>
      </div>

      {GROUPS.map(g => (
        <div key={g.label} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>{g.label}</div>
              <div style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A", marginTop: "3px", maxWidth: "620px" }}>{g.description}</div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => selectGroup(g.paths)}
                style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#1B3A2D", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", letterSpacing: "1.2px" }}>SELECT GROUP</button>
              <button onClick={() => revalidate(g.paths)} disabled={busy}
                style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: busy ? "wait" : "pointer", letterSpacing: "1.2px" }}>REVALIDATE ALL</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "6px" }}>
            {g.paths.map(p => {
              const on = selected.has(p);
              return (
                <button key={p} onClick={() => toggle(p)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", background: on ? "#E8F0E4" : "#F7FAF5", border: `1.5px solid ${on ? "#1A8040" : "#E4EDE4"}`, cursor: "pointer", textAlign: "left" as const }}>
                  <span style={{ width: "14px", height: "14px", borderRadius: "4px", border: `1.5px solid ${on ? "#1A8040" : "#B7CDB7"}`, background: on ? "#1A8040" : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {on && <IconCheck size={9} color="#ffffff" />}
                  </span>
                  <code style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "11px", color: "#1B3A2D" }}>{p}</code>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
