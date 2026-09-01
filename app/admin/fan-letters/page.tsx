"use client";
import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconTrash, IconWarning, IconMail } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Filter = "pending" | "approved" | "all";

interface Letter {
  id: string;
  title: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  user_id: string;
  profiles?: { display_name?: string; avatar_url?: string } | null;
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

export default function FanLettersAdmin() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [filter, setFilter]   = useState<Filter>("pending");
  const [working, setWorking] = useState<string | null>(null);
  const [search, setSearch]   = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/fan-letters?filter=${filter}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setLetters(d.letters ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return letters;
    return letters.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.content.toLowerCase().includes(q) ||
      (l.profiles?.display_name ?? "").toLowerCase().includes(q)
    );
  }, [letters, search]);

  async function act(id: string, patch: any, opts?: { del?: boolean; confirmMsg?: string }) {
    if (opts?.confirmMsg && !confirm(opts.confirmMsg)) return;
    setWorking(id); setError(""); setStatus("");
    try {
      const r = opts?.del
        ? await fetch(`/api/admin/fan-letters?id=${id}`, { method: "DELETE" })
        : await fetch("/api/admin/fan-letters", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(opts?.del ? "Letter deleted." : patch.approve ? "Approved." : "Unapproved.");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setWorking(null); }
  }

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, all: letters.length };
    for (const l of letters) l.is_approved ? c.approved++ : c.pending++;
    return c;
  }, [letters]);

  const inp: React.CSSProperties = { background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>FAN LETTERS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Members submit letters here. Nothing shows publicly until you approve it.</p>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        {(["pending", "approved", "all"] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: filter === f ? "#ffffff" : "#1B3A2D", background: filter === f ? "#1A8040" : "#ffffff", border: "1.5px solid " + (filter === f ? "#1A8040" : "#DDE8DD"), borderRadius: "10px", padding: "8px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>
            {f.toUpperCase()}{f !== "all" && ` (${counts[f]})`}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title / content / author…" style={{ ...inp, flex: 1, minWidth: "220px" }} />
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center" }}>
          <IconMail size={28} color="#B7CDB7" />
          <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#4A7C59", letterSpacing: "2px", marginTop: "10px" }}>NO {filter.toUpperCase()} LETTERS</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A", marginTop: "6px" }}>When members submit fan letters, they'll queue here for approval.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map(l => (
            <div key={l.id} style={{ background: "#ffffff", border: `1px solid ${l.is_approved ? "#B7D8B7" : "#F0D889"}`, borderRadius: "14px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#F2F7F2", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {l.profiles?.avatar_url ? <img src={l.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                     : <span style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#1A8040" }}>{(l.profiles?.display_name ?? "?")[0]?.toUpperCase()}</span>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                    <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "2px" }}>
                      by <strong>{l.profiles?.display_name ?? l.user_id}</strong> · {timeAgo(l.created_at)}
                    </div>
                  </div>
                </div>
                <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: l.is_approved ? "#156530" : "#7A5A0F", background: l.is_approved ? "#E8F0E4" : "#FFF3D6", borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>
                  {l.is_approved ? "APPROVED" : "PENDING"}
                </span>
              </div>

              <div style={{ background: "#F7FAF5", border: "1px solid #E4EDE4", borderRadius: "10px", padding: "12px 14px", fontFamily: B, fontSize: "13px", color: "#1B3A2D", lineHeight: 1.6, whiteSpace: "pre-wrap" as const, maxHeight: "220px", overflow: "auto" }}>
                {l.content}
              </div>

              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                {l.is_approved ? (
                  <button onClick={() => act(l.id, { approve: false })} disabled={working === l.id}
                    style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", border: "1.5px solid transparent", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
                    UNAPPROVE
                  </button>
                ) : (
                  <button onClick={() => act(l.id, { approve: true })} disabled={working === l.id}
                    style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <IconCheck size={11} color="#ffffff" /> APPROVE
                  </button>
                )}
                <button onClick={() => act(l.id, {}, { del: true, confirmMsg: `Delete "${l.title}"? This cannot be undone.` })} disabled={working === l.id}
                  style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", border: "1.5px solid transparent", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <IconTrash size={11} color="#8A1E27" /> DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
