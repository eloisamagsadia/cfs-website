"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconTicket, IconUsers } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Row {
  event: { id: string; title: string; date: string; capacity: number | null };
  waiting: number;
  notified: number;
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
}

export default function AdminWaitlistIndex() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch("/api/admin/waitlist")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setRows(d.summary ?? []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>WAITLISTS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Events with active waitlist entries. Click one to review, notify, or promote members.</p>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : rows.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center" }}>
          <IconUsers size={26} color="#B7CDB7" />
          <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#4A7C59", letterSpacing: "2px", marginTop: "10px" }}>NO ACTIVE WAITLISTS</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A", marginTop: "6px" }}>Members can join a waitlist from any sold-out event page.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rows.map(r => (
            <Link key={r.event.id} href={`/admin/waitlist/${r.event.id}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 20px", display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#E8F0E4", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <IconTicket size={18} color="#1A8040" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.event.title}</div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "3px" }}>
                    {fmtDate(r.event.date)} · capacity {r.event.capacity ?? "∞"}
                  </div>
                </div>
                <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: "8px", padding: "5px 12px", letterSpacing: "1.2px", whiteSpace: "nowrap" }}>
                  {r.waiting} WAITING
                </span>
                {r.notified > 0 && (
                  <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1E4A7A", background: "#E4EEF8", borderRadius: "8px", padding: "5px 12px", letterSpacing: "1.2px", whiteSpace: "nowrap" }}>
                    {r.notified} NOTIFIED
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
