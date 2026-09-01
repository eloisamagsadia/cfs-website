"use client";
import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconTrash, IconWarning, IconMail } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Sub {
  id: string;
  email: string;
  source: string;
  user_id: string | null;
  opt_in_ip: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

type Scope = "active" | "unsubscribed" | "all";

function stamp(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });
}

export default function NewsletterAdminPage() {
  const [subs, setSubs]       = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [scope, setScope]     = useState<Scope>("active");
  const [search, setSearch]   = useState("");
  const [busy, setBusy]       = useState<string | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/newsletter?scope=${scope}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSubs(d.subscribers ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [scope]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subs;
    return subs.filter(s => s.email.toLowerCase().includes(q) || (s.source ?? "").toLowerCase().includes(q));
  }, [subs, search]);

  const counts = useMemo(() => {
    const bySource: Record<string, number> = {};
    for (const s of subs) if (!s.unsubscribed_at) bySource[s.source] = (bySource[s.source] ?? 0) + 1;
    return { total: subs.length, active: subs.filter(s => !s.unsubscribed_at).length, unsubscribed: subs.filter(s => s.unsubscribed_at).length, bySource };
  }, [subs]);

  async function unsubscribe(s: Sub, hard = false) {
    const msg = hard ? `HARD DELETE ${s.email}? This removes the row entirely.` : `Unsubscribe ${s.email}?`;
    if (!confirm(msg)) return;
    setBusy(s.id); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/newsletter?id=${s.id}${hard ? "&hard=1" : ""}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(hard ? "Subscriber deleted." : "Marked unsubscribed.");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  const inp: React.CSSProperties = { background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: 10, padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: 13, outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: 3, marginBottom: 4 }}>NEWSLETTER</h1>
          <p style={{ fontFamily: B, fontSize: 13, color: "#4A7C59" }}>
            Non-member (and member) email opt-ins from the site footer and elsewhere. Use these when broadcasting outside Clerk.
          </p>
        </div>
        <a href={`/api/admin/newsletter?scope=${scope}&format=csv`}
          style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#156530", background: "#E8F0E4", border: "1.5px solid #B7D8B7", borderRadius: 10, padding: "10px 16px", cursor: "pointer", letterSpacing: 1.3, textDecoration: "none" }}>
          ⤓ EXPORT CSV
        </a>
      </div>

      {/* Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        {[
          { label: "ACTIVE",       value: counts.active,       accent: "#156530", scope: "active" as Scope },
          { label: "UNSUBSCRIBED", value: counts.unsubscribed, accent: "#8A1E27", scope: "unsubscribed" as Scope },
          { label: "TOTAL",        value: counts.total,        accent: "#1B3A2D", scope: "all" as Scope },
        ].map(t => (
          <button key={t.label} onClick={() => setScope(t.scope)}
            style={{ background: scope === t.scope ? "#F7FAF5" : "#ffffff", border: `1.5px solid ${scope === t.scope ? t.accent : "#DDE8DD"}`, borderRadius: 12, padding: "14px 16px", textAlign: "left" as const, cursor: "pointer" }}>
            <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: t.accent, letterSpacing: 1.3 }}>{t.label}</div>
            <div style={{ fontFamily: R, fontSize: "1.5rem", color: "#1B3A2D", letterSpacing: 1, marginTop: 3 }}>{t.value}</div>
          </button>
        ))}
      </div>

      {/* Source breakdown */}
      {Object.keys(counts.bySource).length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.3 }}>SOURCES</span>
          {Object.entries(counts.bySource).sort((a, b) => b[1] - a[1]).map(([src, n]) => (
            <span key={src} style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#1B3A2D", background: "#F2F7F2", borderRadius: 999, padding: "4px 10px", letterSpacing: 1.1 }}>
              {src} · {n}
            </span>
          ))}
        </div>
      )}

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or source…" style={inp} />

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: 10, padding: "10px 14px", fontFamily: B, fontSize: 13, color: "#CC3344", display: "flex", gap: 8, alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: 10, padding: "10px 14px", fontFamily: B, fontSize: 13, color: "#156530", display: "flex", gap: 8, alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", fontFamily: SG, letterSpacing: 2, color: "#7A8E7A" }}>LOADING…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: 14, padding: "56px 24px", textAlign: "center" }}>
          <IconMail size={26} color="#B7CDB7" />
          <div style={{ fontFamily: SG, fontSize: 12, fontWeight: 700, color: "#4A7C59", letterSpacing: 2, marginTop: 10 }}>NO {scope.toUpperCase()} SUBSCRIBERS</div>
        </div>
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 180px 180px auto", padding: "10px 18px", background: "#F7FAF5", fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.3 }}>
            <span>EMAIL</span><span>SOURCE</span><span>SUBSCRIBED</span><span>UNSUBSCRIBED</span><span style={{ textAlign: "right" as const }}>ACTIONS</span>
          </div>
          {filtered.map((s, i) => (
            <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 180px 180px auto", padding: "10px 18px", borderTop: i === 0 ? "none" : "1px solid #F0F5F0", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB", alignItems: "center", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: B, fontSize: 13, color: "#1B3A2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{s.email}</div>
                {s.user_id && <div style={{ fontFamily: B, fontSize: 10, color: "#5A7A60" }}>member · {s.user_id.slice(0, 12)}…</div>}
              </div>
              <span style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: 6, padding: "2px 8px", letterSpacing: 1.1, width: "fit-content" }}>{s.source}</span>
              <span style={{ fontFamily: B, fontSize: 11, color: "#5A7A60" }}>{stamp(s.subscribed_at)}</span>
              <span style={{ fontFamily: B, fontSize: 11, color: s.unsubscribed_at ? "#8A1E27" : "#7A8E7A" }}>{stamp(s.unsubscribed_at)}</span>
              <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                {!s.unsubscribed_at && (
                  <button onClick={() => unsubscribe(s)} disabled={busy === s.id}
                    style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", border: "1.5px solid transparent", borderRadius: 8, padding: "6px 10px", cursor: "pointer", letterSpacing: 1.2 }}>
                    UNSUBSCRIBE
                  </button>
                )}
                <button onClick={() => unsubscribe(s, true)} disabled={busy === s.id}
                  style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#8A1E27", background: "transparent", border: "1.5px solid #F1C0C6", borderRadius: 8, padding: "6px 10px", cursor: "pointer", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <IconTrash size={10} color="#8A1E27" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
