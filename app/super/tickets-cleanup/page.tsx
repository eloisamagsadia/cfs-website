"use client";
import { useEffect, useState } from "react";
import { IconTicket, IconWarning, IconTrash } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Row = {
  id: string;
  ticket_number: string;
  user_id: string;
  event_id: string;
  created_at: string;
  events?: { title: string; date: string } | null;
};

function ageHours(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
}

export default function PendingCleanupPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [hours, setHours] = useState("24");
  const [running, setRunning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/super/tickets/cleanup", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      setRows(data.tickets ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function cleanup() {
    setRunning(true); setError(""); setStatus("");
    try {
      const res = await fetch("/api/super/tickets/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: Number(hours) || 24 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cleanup failed");
      setStatus(`Cancelled ${data.cancelled} pending ticket${data.cancelled === 1 ? "" : "s"} older than ${data.hours}h.`);
      setConfirmOpen(false);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setRunning(false); }
  }

  const eligible = rows.filter(r => ageHours(r.created_at) >= (Number(hours) || 24)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", margin: 0 }}>PENDING TICKETS</h1>
        <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "4px 0 0" }}>
          Unpaid tickets holding registration state. Cancel stale ones to free capacity signals and reduce clutter.
        </p>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530" }}>{status}</div>}

      {/* Cleanup controls */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", display: "block", marginBottom: "6px" }}>CANCEL PENDING OLDER THAN (HOURS)</label>
          <input type="number" min="1" max="720" step="1" value={hours} onChange={e => setHours(e.target.value)}
            style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            onWheel={e => (e.currentTarget as HTMLInputElement).blur()} onKeyDown={e => { if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault(); }} />
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>{eligible} eligible</span>
          <button onClick={() => setConfirmOpen(true)} disabled={running || eligible === 0}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: eligible > 0 ? "#CC3344" : "#B7A0A0", border: "1.5px solid " + (eligible > 0 ? "#CC3344" : "#B7A0A0"), borderRadius: "10px", padding: "10px 16px", cursor: eligible > 0 && !running ? "pointer" : "not-allowed", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <IconTrash size={12} color="#ffffff" /> {running ? "CANCELLING..." : `CANCEL ${eligible}`}
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div onClick={() => setConfirmOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,42,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "16px", padding: "24px", maxWidth: "420px", width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <IconWarning size={18} color="#CC3344" />
              <h2 style={{ fontFamily: R, fontSize: "1.1rem", color: "#1B3A2D", letterSpacing: "2px", margin: 0 }}>CANCEL {eligible} TICKETS?</h2>
            </div>
            <p style={{ fontFamily: B, fontSize: "13px", color: "#5A7A60", margin: 0, lineHeight: 1.5 }}>
              This will mark {eligible} pending ticket{eligible === 1 ? "" : "s"} older than {hours}h as cancelled. Members lose their held registration and will need to start over if they still want to attend. This cannot be undone in bulk.
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmOpen(false)} style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px" }}>KEEP</button>
              <button onClick={cleanup} disabled={running} style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#CC3344", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 16px", cursor: running ? "wait" : "pointer", letterSpacing: "1.2px" }}>
                {running ? "CANCELLING..." : "YES, CANCEL"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4EDE4", background: "#F7FAF5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconTicket size={14} color="#1A8040" />
            <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>{rows.length} PENDING</span>
          </div>
          <button onClick={load} style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>REFRESH</button>
        </div>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A", fontSize: "12px" }}>LOADING…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", fontFamily: B, color: "#7A8E7A", fontSize: "13px" }}>No pending tickets. All caught up.</div>
        ) : (
          <div>
            {rows.map(r => {
              const age = ageHours(r.created_at);
              const stale = age >= (Number(hours) || 24);
              return (
                <div key={r.id} style={{ padding: "14px 18px", borderBottom: "1px solid #F0F4F0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.events?.title ?? "(unknown event)"}</div>
                    <div style={{ fontFamily: SG, fontSize: "10px", color: "#7A8E7A", letterSpacing: "1px", marginTop: "3px" }}>{r.ticket_number} · user {r.user_id.slice(0, 12)}…</div>
                  </div>
                  <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: stale ? "#CC3344" : "#4A7C59", background: stale ? "#FFE8EC" : "#E8F0E4", borderRadius: "999px", padding: "4px 10px", letterSpacing: "1.2px" }}>
                    {age}h ago{stale ? " · STALE" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
