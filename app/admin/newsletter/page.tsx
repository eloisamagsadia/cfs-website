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

  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject]   = useState("");
  const [bodyDraft, setBodyDraft] = useState("");
  const [testTo, setTestTo]     = useState("");
  const [sending, setSending]   = useState(false);
  const [sendMsg, setSendMsg]   = useState<{ ok: boolean; text: string } | null>(null);
  const [history, setHistory]   = useState<any[]>([]);

  async function loadHistory() {
    try {
      const r = await fetch("/api/admin/newsletter/history");
      const d = await r.json();
      if (r.ok) setHistory(d.broadcasts ?? []);
    } catch {}
  }
  useEffect(() => { loadHistory(); }, []);

  async function sendBroadcast(mode: "test" | "all") {
    if (!subject.trim() || !bodyDraft.trim()) { setSendMsg({ ok: false, text: "Subject and body are required." }); return; }
    if (mode === "test" && !testTo.trim())    { setSendMsg({ ok: false, text: "Enter a test address." }); return; }
    if (mode === "all") {
      const active = subs.filter(s => !s.unsubscribed_at).length;
      if (!confirm(`Send "${subject}" to all ${active} active subscribers?\n\nThis cannot be undone.`)) return;
    }
    setSending(true); setSendMsg(null);
    try {
      const payload: any = { subject: subject.trim(), body: bodyDraft, scope: "active" };
      if (mode === "test") payload.test_to = testTo.trim();
      const r = await fetch("/api/admin/newsletter/broadcast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (mode === "test") setSendMsg({ ok: true, text: `Test sent to ${d.sent_to}.` });
      else {
        setSendMsg({ ok: true, text: `Sent to ${d.sent} of ${d.total} subscribers${d.failed ? ` (${d.failed} failed)` : ""}.` });
        setSubject(""); setBodyDraft(""); setTestTo("");
      }
      loadHistory();
    } catch (e: any) { setSendMsg({ ok: false, text: e.message }); }
    finally { setSending(false); }
  }

  function reopen(h: any) {
    const d = h.details ?? {};
    setSubject(d.subject ?? "");
    setBodyDraft(""); // audit log doesn't store body — clarify with placeholder message
    setSendMsg({ ok: true, text: "Subject copied. Paste your body — the log doesn't store message content." });
    setComposeOpen(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 30);
  }

  function timeAgo(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
  }

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
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setComposeOpen(v => !v)}
            style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#ffffff", background: composeOpen ? "#5A5A5A" : "#1A8040", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", letterSpacing: 1.3 }}>
            {composeOpen ? "CLOSE COMPOSE" : "✎ COMPOSE BROADCAST"}
          </button>
          <a href={`/api/admin/newsletter?scope=${scope}&format=csv`}
            style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#156530", background: "#E8F0E4", border: "1.5px solid #B7D8B7", borderRadius: 10, padding: "10px 16px", cursor: "pointer", letterSpacing: 1.3, textDecoration: "none" }}>
            ⤓ EXPORT CSV
          </a>
        </div>
      </div>

      {/* Compose */}
      {composeOpen && (
        <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontFamily: R, fontSize: 12, color: "#7A5A0F", letterSpacing: 2 }}>NEW BROADCAST</div>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line…" style={{ ...inp, fontSize: 14, padding: "10px 14px" }} />
          <textarea value={bodyDraft} onChange={e => setBodyDraft(e.target.value)}
            placeholder={`Hey Colet supporters!\n\nSomething exciting is coming — here's the drop link…\n\nSupports plain text (paragraphs auto-formatted) OR raw HTML if you want links / bold / images.`}
            rows={9}
            style={{ ...inp, resize: "vertical" as const, lineHeight: 1.55, fontFamily: B, fontSize: 13 }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input value={testTo} onChange={e => setTestTo(e.target.value)} type="email" placeholder="Send TEST to (your email)"
              style={{ ...inp, flex: 1, minWidth: 220 }} />
            <button onClick={() => sendBroadcast("test")} disabled={sending}
              style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", border: "1.5px solid transparent", borderRadius: 8, padding: "8px 14px", cursor: "pointer", letterSpacing: 1.2 }}>
              {sending ? "…" : "SEND TEST"}
            </button>
            <button onClick={() => sendBroadcast("all")} disabled={sending}
              style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", letterSpacing: 1.2 }}>
              {sending ? "SENDING…" : `SEND TO ALL (${counts.active})`}
            </button>
          </div>
          {sendMsg && (
            <div style={{ background: sendMsg.ok ? "#E8F0E4" : "#FFE8EC", border: `1.5px solid ${sendMsg.ok ? "#1A8040" : "#CC3344"}`, borderRadius: 8, padding: "8px 12px", fontFamily: B, fontSize: 12, color: sendMsg.ok ? "#156530" : "#CC3344" }}>{sendMsg.text}</div>
          )}
          <div style={{ fontFamily: B, fontSize: 11, color: "#7A8E7A", fontStyle: "italic" as const }}>
            Every email includes an unsubscribe link tied to the subscriber's token — no config needed on your end.
          </div>
        </div>
      )}

      {/* Broadcast history */}
      {history.length > 0 && (
        <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ fontFamily: R, fontSize: 12, color: "#1B3A2D", letterSpacing: 2, marginBottom: 12 }}>SENT BROADCASTS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {history.map(h => {
              const d = h.details ?? {};
              const isTest = h.action === "newsletter_test_send";
              return (
                <div key={h.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 10, alignItems: "center", padding: "9px 2px", borderBottom: "1px solid #F0F5F0" }}>
                  <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: isTest ? "#7A5A0F" : "#156530", background: isTest ? "#FFF3D6" : "#E8F0E4", borderRadius: 6, padding: "2px 8px", letterSpacing: 1.2, whiteSpace: "nowrap" as const }}>
                    {isTest ? "TEST" : "SENT"}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: R, fontSize: 12, color: "#1B3A2D", letterSpacing: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{d.subject ?? "(no subject)"}</div>
                    <div style={{ fontFamily: B, fontSize: 11, color: "#5A7A60" }}>by {h.profiles?.display_name ?? h.user_id.slice(0, 12)}{isTest && d.to && ` · to ${d.to}`}</div>
                    {!isTest && h.stats && (() => {
                      const s = h.stats;
                      const pct = (n: number) => s.sent > 0 ? Math.round((n / s.sent) * 100) : 0;
                      return (
                        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                          <span title={`${s.delivered}/${s.sent} delivered`} style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#156530", background: "#E8F0E4", borderRadius: 6, padding: "1px 6px", letterSpacing: 1.1 }}>
                            ✓ {pct(s.delivered)}% DEL
                          </span>
                          <span title={`${s.opened}/${s.sent} opened`} style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#1E4A7A", background: "#E4EEF8", borderRadius: 6, padding: "1px 6px", letterSpacing: 1.1 }}>
                            👁 {pct(s.opened)}% OPEN
                          </span>
                          {s.clicked > 0 && (
                            <span title={`${s.clicked}/${s.sent} clicked`} style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: 6, padding: "1px 6px", letterSpacing: 1.1 }}>
                              🔗 {pct(s.clicked)}% CLK
                            </span>
                          )}
                          {s.bounced > 0 && (
                            <span title={`${s.bounced} bounced`} style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", borderRadius: 6, padding: "1px 6px", letterSpacing: 1.1 }}>
                              {s.bounced} BOUNCE
                            </span>
                          )}
                          {s.complained > 0 && (
                            <span title={`${s.complained} complained (spam)`} style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", borderRadius: 6, padding: "1px 6px", letterSpacing: 1.1 }}>
                              ⚠ {s.complained} SPAM
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  {!isTest && (
                    <span style={{ fontFamily: R, fontSize: 11, color: "#1A8040", letterSpacing: 1 }}>{d.sent ?? 0}/{d.total ?? 0}</span>
                  )}
                  {!isTest && Number(d.failed ?? 0) > 0 && (
                    <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", borderRadius: 6, padding: "2px 8px", letterSpacing: 1.1 }}>{d.failed} FAILED</span>
                  )}
                  {isTest && <span />}
                  {isTest && <span />}
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontFamily: B, fontSize: 11, color: "#7A8E7A", whiteSpace: "nowrap" as const }}>{timeAgo(h.created_at)}</span>
                    <button onClick={() => reopen(h)}
                      title="Copy subject to compose"
                      style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#1A8040", background: "transparent", border: "1.5px solid #B7D8B7", borderRadius: 6, padding: "3px 8px", cursor: "pointer", letterSpacing: 1.1 }}>
                      REOPEN
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
