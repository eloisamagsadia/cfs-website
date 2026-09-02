"use client";
import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconTrash, IconWarning, IconMail } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Status = "new" | "replied" | "archived" | "spam";

interface Msg {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: Status;
  ip: string | null;
  user_id: string | null;
  reply_note: string | null;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
}

const STATUS_META: Record<Status, { color: string; bg: string; label: string }> = {
  new:      { color: "#7A5A0F", bg: "#FFF3D6", label: "NEW"      },
  replied:  { color: "#156530", bg: "#E8F0E4", label: "REPLIED"  },
  archived: { color: "#5A5A5A", bg: "#F0F0F0", label: "ARCHIVED" },
  spam:     { color: "#8A1E27", bg: "#FFE8EC", label: "SPAM"     },
};

const TOPIC_COLOR: Record<string, string> = {
  general:     "#5A7A60",
  events:      "#156530",
  shop:        "#7A5A0F",
  donation:    "#B78A1F",
  partnership: "#1E4A7A",
  press:       "#5A1E7A",
  bug:         "#8A1E27",
};

function stamp(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila" });
}

export default function ContactAdminPage() {
  const [msgs, setMsgs]       = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [filter, setFilter]   = useState<Status | "all">("new");
  const [search, setSearch]   = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [open, setOpen]       = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/admin/contact?status=${filter}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMsgs(d.messages ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: msgs.length, new: 0, replied: 0, archived: 0, spam: 0 };
    for (const m of msgs) c[m.status] = (c[m.status] ?? 0) + 1;
    return c;
  }, [msgs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return msgs;
    return msgs.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q) ||
      (m.topic ?? "").toLowerCase().includes(q)
    );
  }, [msgs, search]);

  async function patch(id: string, next: Status, msg: string) {
    setBusy(id); setError(""); setStatus("");
    try {
      const r = await fetch("/api/admin/contact", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: next }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(msg);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function remove(m: Msg) {
    if (!confirm(`Delete message from ${m.name}? This can't be undone.`)) return;
    setBusy(m.id); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/contact?id=${m.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Deleted.");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  function toggle(id: string) {
    setOpen(prev => { const c = new Set(prev); if (c.has(id)) c.delete(id); else c.add(id); return c; });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: 3, marginBottom: 4 }}>CONTACT MESSAGES</h1>
        <p style={{ fontFamily: B, fontSize: 13, color: "#4A7C59" }}>
          Guest inquiries submitted via <a href="/contact" target="_blank" rel="noreferrer" style={{ color: "#1A8040" }}>coletfansuporta.com/contact</a>. Reply from your inbox; toggle status here to track what's handled.
        </p>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {(["all", "new", "replied", "archived", "spam"] as (Status | "all")[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: filter === f ? "#ffffff" : "#1B3A2D", background: filter === f ? "#1A8040" : "#ffffff", border: `1.5px solid ${filter === f ? "#1A8040" : "#DDE8DD"}`, borderRadius: 999, padding: "6px 12px", cursor: "pointer", letterSpacing: 1.2 }}>
            {f.toUpperCase()}{f !== "all" && counts[f] !== undefined && ` (${counts[f]})`}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / email / message…"
          style={{ background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: 10, padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: 13, outline: "none", flex: 1, minWidth: 220 }} />
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: 10, padding: "10px 14px", fontFamily: B, fontSize: 13, color: "#CC3344", display: "flex", gap: 8, alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: 10, padding: "10px 14px", fontFamily: B, fontSize: 13, color: "#156530", display: "flex", gap: 8, alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", fontFamily: SG, letterSpacing: 2, color: "#7A8E7A" }}>LOADING…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: 14, padding: "56px 24px", textAlign: "center" }}>
          <IconMail size={26} color="#B7CDB7" />
          <div style={{ fontFamily: SG, fontSize: 12, fontWeight: 700, color: "#4A7C59", letterSpacing: 2, marginTop: 10 }}>NO {filter.toUpperCase()} MESSAGES</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(m => {
            const meta = STATUS_META[m.status];
            const isOpen = open.has(m.id);
            return (
              <div key={m.id} style={{ background: "#ffffff", border: `1px solid ${m.status === "new" ? "#F0D889" : "#DDE8DD"}`, borderRadius: 14, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: meta.color, background: meta.bg, borderRadius: 6, padding: "3px 8px", letterSpacing: 1.2 }}>{meta.label}</span>
                  <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: TOPIC_COLOR[m.topic] ?? "#5A7A60", background: `${TOPIC_COLOR[m.topic] ?? "#5A7A60"}18`, borderRadius: 6, padding: "3px 8px", letterSpacing: 1.2 }}>{m.topic.toUpperCase()}</span>
                  {m.user_id && <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#156530", background: "#E8F0E4", borderRadius: 6, padding: "3px 8px", letterSpacing: 1.2 }}>MEMBER</span>}
                  <span style={{ marginLeft: "auto", fontFamily: B, fontSize: 11, color: "#7A8E7A" }}>{stamp(m.created_at)}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: B, fontSize: 13, color: "#1B3A2D", fontWeight: 600 }}>{m.name}</div>
                    <a href={`mailto:${m.email}?subject=Re:%20your%20message%20to%20Colet%20Fan%20Suporta`} style={{ fontFamily: B, fontSize: 12, color: "#1A8040", textDecoration: "none" }}>{m.email}</a>
                  </div>
                  <button onClick={() => toggle(m.id)}
                    style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: 8, padding: "6px 12px", cursor: "pointer", letterSpacing: 1.2 }}>
                    {isOpen ? "COLLAPSE" : "READ"}
                  </button>
                </div>

                {isOpen && (
                  <div style={{ background: "#F7FAF5", border: "1px solid #E4EDE4", borderRadius: 10, padding: "12px 14px", fontFamily: B, fontSize: 13, color: "#1B3A2D", lineHeight: 1.6, whiteSpace: "pre-wrap" as const }}>
                    {m.message}
                  </div>
                )}

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {m.status !== "replied" && (
                    <button onClick={() => patch(m.id, "replied", "Marked replied.")} disabled={busy === m.id}
                      style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <IconCheck size={11} color="#ffffff" /> MARK REPLIED
                    </button>
                  )}
                  {m.status !== "archived" && (
                    <button onClick={() => patch(m.id, "archived", "Archived.")} disabled={busy === m.id}
                      style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A5A5A", background: "#F0F0F0", border: "1.5px solid transparent", borderRadius: 8, padding: "7px 12px", cursor: "pointer", letterSpacing: 1.2 }}>
                      ARCHIVE
                    </button>
                  )}
                  {m.status !== "spam" && (
                    <button onClick={() => patch(m.id, "spam", "Marked spam.")} disabled={busy === m.id}
                      style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", border: "1.5px solid transparent", borderRadius: 8, padding: "7px 12px", cursor: "pointer", letterSpacing: 1.2 }}>
                      SPAM
                    </button>
                  )}
                  <button onClick={() => remove(m)} disabled={busy === m.id}
                    style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#8A1E27", background: "transparent", border: "1.5px solid #F1C0C6", borderRadius: 8, padding: "7px 10px", cursor: "pointer", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <IconTrash size={10} color="#8A1E27" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
