"use client";
import { useEffect, useState } from "react";
import { IconWarning, IconCheck } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Session {
  id: string;
  status: string;
  last_active_at: number | null;
  expire_at: number | null;
  created_at: number | null;
  last_active_ip: string | null;
  last_active_ua: string | null;
  last_active_os: string | null;
}

function timeAgo(ms?: number | null) {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ms).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

const STATUS_META: Record<string, { color: string; bg: string }> = {
  active:   { color: "#156530", bg: "#E8F0E4" },
  ended:    { color: "#5A5A5A", bg: "#F0F0F0" },
  expired:  { color: "#5A5A5A", bg: "#F0F0F0" },
  revoked:  { color: "#8A1E27", bg: "#FFE8EC" },
  removed:  { color: "#8A1E27", bg: "#FFE8EC" },
  abandoned:{ color: "#7A5A0F", bg: "#FFF3D6" },
  replaced: { color: "#5A5A5A", bg: "#F0F0F0" },
};

export default function MemberSessions({ userId }: { userId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState<string | null>(null);
  const [status, setStatus]     = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/members/sessions?user_id=${encodeURIComponent(userId)}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSessions(d.sessions ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [userId]);

  async function revokeOne(id: string) {
    if (!confirm("Revoke this session? The user will be signed out on that device immediately.")) return;
    setBusy(id); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/members/sessions?session_id=${id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Session revoked.");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function revokeAll() {
    const active = sessions.filter(s => s.status === "active").length;
    if (active === 0) return;
    if (!confirm(`Revoke ALL ${active} active session${active === 1 ? "" : "s"}? The user will be signed out everywhere.`)) return;
    setBusy("__all__"); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/members/sessions?user_id=${encodeURIComponent(userId)}&all=1`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(`Revoked ${d.revoked} session${d.revoked === 1 ? "" : "s"}.`);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  const activeCount = sessions.filter(s => s.status === "active").length;

  return (
    <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: 14, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.5 }}>SESSIONS</div>
          <div style={{ fontFamily: R, fontSize: 15, color: "#1B3A2D", letterSpacing: 1.5, marginTop: 2 }}>
            {activeCount} active · {sessions.length} total (last 30d)
          </div>
        </div>
        {activeCount > 0 && (
          <button onClick={revokeAll} disabled={busy === "__all__"}
            style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#ffffff", background: "#8A1E27", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", letterSpacing: 1.2 }}>
            REVOKE ALL
          </button>
        )}
      </div>

      {error  && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: 10, padding: "8px 12px", fontFamily: B, fontSize: 12, color: "#CC3344", display: "inline-flex", gap: 8, alignItems: "center" }}><IconWarning size={12} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: 10, padding: "8px 12px", fontFamily: B, fontSize: 12, color: "#156530", display: "inline-flex", gap: 8, alignItems: "center" }}><IconCheck   size={12} color="#156530" /> {status}</div>}

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", fontFamily: SG, letterSpacing: 2, color: "#7A8E7A", fontSize: 11 }}>LOADING…</div>
      ) : sessions.length === 0 ? (
        <div style={{ fontFamily: B, fontSize: 12, color: "#7A8E7A", padding: 12, textAlign: "center" as const }}>No sessions recorded.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {sessions.map((s, i) => {
            const meta = STATUS_META[s.status] ?? STATUS_META.ended;
            const active = s.status === "active";
            return (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, padding: "10px 4px", borderTop: i === 0 ? "none" : "1px solid #F0F5F0", alignItems: "center" }}>
                <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: meta.color, background: meta.bg, borderRadius: 6, padding: "3px 8px", letterSpacing: 1.2, whiteSpace: "nowrap" as const }}>{s.status.toUpperCase()}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: B, fontSize: 12, color: "#1B3A2D" }}>
                    {[s.last_active_os, s.last_active_ua].filter(Boolean).join(" · ") || <em style={{ color: "#7A8E7A" }}>unknown device</em>}
                  </div>
                  <div style={{ fontFamily: B, fontSize: 11, color: "#5A7A60" }}>
                    last active {timeAgo(s.last_active_at)}
                    {s.last_active_ip && ` · ${s.last_active_ip}`}
                    {s.created_at && ` · started ${timeAgo(s.created_at)}`}
                  </div>
                </div>
                {active && (
                  <button onClick={() => revokeOne(s.id)} disabled={busy === s.id}
                    style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#8A1E27", background: "transparent", border: "1.5px solid #F1C0C6", borderRadius: 8, padding: "5px 10px", cursor: "pointer", letterSpacing: 1.2 }}>
                    REVOKE
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontFamily: B, fontSize: 10, color: "#7A8E7A", fontStyle: "italic" as const }}>
        Session data comes straight from Clerk. Revoke signs the user out on that device on their next request.
      </div>
    </div>
  );
}
