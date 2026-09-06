"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconCheck, IconTrash, IconWarning, IconMail } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Status = "new" | "replied" | "archived" | "spam";

interface ReplyEntry {
  body: string;
  sent_at: string;
  sent_by: string | null;
  sent_by_name: string | null;
  from?: "admin" | "guest";   // "guest" = inbound from Resend Inbound webhook
  from_email?: string | null; // guest's email (for inbound entries)
  subject?: string | null;    // guest's subject line (inbound only)
}

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
  replies: ReplyEntry[] | null;
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
  const router       = useRouter();
  const searchParams = useSearchParams();
  // Filter is persisted in the URL (?filter=all) so refresh keeps the
  // current tab. Default "new" only applies on cold entry with no query.
  const urlFilter = (searchParams.get("filter") ?? "new") as Status | "all";

  const [msgs, setMsgs]       = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [filter, setFilterState] = useState<Status | "all">(urlFilter);
  const [search, setSearch]   = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [open, setOpen]       = useState<Set<string>>(new Set());
  const setFilter = (f: Status | "all") => {
    setFilterState(f);
    const q = new URLSearchParams(Array.from(searchParams.entries()));
    if (f === "new") q.delete("filter"); else q.set("filter", f);
    router.replace(`/admin/contact${q.toString() ? `?${q.toString()}` : ""}`);
  };
  // Message pending in the delete-confirm modal. Replaces window.confirm().
  const [pendingDelete, setPendingDelete] = useState<Msg | null>(null);
  // Inline reply composer: which message is being replied to + the draft body.
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyBody,  setReplyBody]  = useState("");
  const [sending,    setSending]    = useState(false);

  async function load(silent = false) {
    if (silent) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/contact?status=${filter}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMsgs(d.messages ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

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

  async function confirmRemove() {
    if (!pendingDelete) return;
    const m = pendingDelete;
    setBusy(m.id); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/contact?id=${m.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Deleted.");
      setPendingDelete(null);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  function openReply(m: Msg) {
    setReplyingId(m.id);
    setReplyBody("");
    // Auto-expand the message body so the admin sees what they're replying to.
    setOpen(prev => { const c = new Set(prev); c.add(m.id); return c; });
  }

  async function sendReply(m: Msg) {
    if (replyBody.trim().length < 2) { setError("Type a reply first."); return; }
    setSending(true); setError(""); setStatus("");
    try {
      const r = await fetch("/api/admin/contact/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id, body: replyBody.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(`Reply sent to ${m.email}.`);
      setReplyingId(null);
      setReplyBody("");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSending(false); }
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
        <button onClick={() => load(true)} disabled={refreshing || loading}
          title="Reload messages (fetch any new guest replies)"
          style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#156530", background: "#E8F0E4", border: "1.5px solid #B7D8B7", borderRadius: 999, padding: "6px 12px", cursor: refreshing ? "wait" : "pointer", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: refreshing ? "#B0731A" : "#1A8040" }} />
          {refreshing ? "SYNCING…" : "REFRESH"}
        </button>
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
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Original message from the guest */}
                    <div style={{ background: "#F7FAF5", border: "1px solid #E4EDE4", borderRadius: 10, padding: "12px 14px", fontFamily: B, fontSize: 13, color: "#1B3A2D", lineHeight: 1.6, whiteSpace: "pre-wrap" as const }}>
                      <div style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.5, marginBottom: 6 }}>MESSAGE · {stamp(m.created_at)}</div>
                      {m.message}
                    </div>

                    {/* Conversation history — admin replies (green, left border)
                        and guest replies via inbound webhook (blue, right border)
                        interleaved oldest-first. */}
                    {(() => {
                      const thread: ReplyEntry[] = Array.isArray(m.replies) && m.replies.length > 0
                        ? m.replies
                        : (m.reply_note
                            ? [{ body: m.reply_note, sent_at: m.handled_at ?? m.created_at, sent_by: m.handled_by, sent_by_name: null, from: "admin" }]
                            : []);
                      if (thread.length === 0) return null;
                      return thread.map((r, i) => {
                        const isGuest = r.from === "guest";
                        const bg     = isGuest ? "#EEF3FA" : "#E8F0E4";
                        const border = isGuest ? "#B7C7D9" : "#B7D8B7";
                        const accent = isGuest ? "#1E4A7A" : "#1A8040";
                        const label  = isGuest
                          ? `FROM GUEST · ${r.sent_by_name ?? m.name}`
                          : `REPLY ${thread.length > 1 ? `${i + 1}/${thread.length}` : ""} · ${r.sent_by_name ?? "CFS admin"}`;
                        return (
                          <div key={i} style={{ background: bg, border: `1px solid ${border}`, borderLeft: isGuest ? undefined : `3px solid ${accent}`, borderRight: isGuest ? `3px solid ${accent}` : undefined, borderRadius: 10, padding: "12px 14px", fontFamily: B, fontSize: 13, color: "#1B3A2D", lineHeight: 1.6, whiteSpace: "pre-wrap" as const, marginLeft: isGuest ? 24 : 0, marginRight: isGuest ? 0 : 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                              <span style={{ fontFamily: SG, fontSize: 9, fontWeight: 700, color: accent, letterSpacing: 1.5 }}>{label}</span>
                              <span style={{ fontFamily: B, fontSize: 11, color: "#5A7A60" }}>{stamp(r.sent_at)}</span>
                            </div>
                            {isGuest && r.subject && (
                              <div style={{ fontFamily: B, fontSize: 11, color: "#5A7A60", fontStyle: "italic", marginBottom: 6 }}>Subject: {r.subject}</div>
                            )}
                            {r.body}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* Inline reply composer — sends via Resend without leaving admin. */}
                {replyingId === m.id && (
                  <div style={{ background: "#FFFFFF", border: "1.5px solid #B7D8B7", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#156530", letterSpacing: 1.5 }}>REPLY TO {m.email}</div>
                      <div style={{ fontFamily: B, fontSize: 11, color: "#7A8E7A" }}>Sends as CFS · your email in Reply-To</div>
                    </div>
                    <textarea
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      rows={5}
                      placeholder={`Hi ${m.name}, thanks for reaching out…`}
                      style={{ width: "100%", boxSizing: "border-box" as const, background: "#F7FAF5", border: "1.5px solid #DDE8DD", borderRadius: 8, padding: "10px 12px", fontFamily: B, fontSize: 13, color: "#1B3A2D", outline: "none", resize: "vertical" as const, minHeight: 100 }}
                    />
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => { setReplyingId(null); setReplyBody(""); }} disabled={sending}
                        style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: 8, padding: "7px 14px", cursor: "pointer", letterSpacing: 1.2 }}>
                        CANCEL
                      </button>
                      <button onClick={() => sendReply(m)} disabled={sending || replyBody.trim().length < 2}
                        style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#ffffff", background: sending || replyBody.trim().length < 2 ? "#B7A0A0" : "#1A8040", border: "none", borderRadius: 8, padding: "7px 14px", cursor: sending ? "wait" : replyBody.trim().length < 2 ? "not-allowed" : "pointer", letterSpacing: 1.2 }}>
                        {sending ? "SENDING…" : "SEND REPLY"}
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {replyingId !== m.id && m.status !== "spam" && (
                    <button onClick={() => openReply(m)} disabled={busy === m.id}
                      style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <IconMail size={11} color="#ffffff" /> REPLY
                    </button>
                  )}
                  {m.status !== "replied" && (
                    <button onClick={() => patch(m.id, "replied", "Marked replied.")} disabled={busy === m.id}
                      style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#156530", background: "#E8F0E4", border: "1.5px solid transparent", borderRadius: 8, padding: "7px 12px", cursor: "pointer", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <IconCheck size={11} color="#156530" /> MARK REPLIED
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
                  <button onClick={() => setPendingDelete(m)} disabled={busy === m.id}
                    style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#8A1E27", background: "transparent", border: "1.5px solid #F1C0C6", borderRadius: 8, padding: "7px 10px", cursor: "pointer", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <IconTrash size={10} color="#8A1E27" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal — replaces window.confirm(). */}
      {pendingDelete && (
        <div onClick={() => !busy && setPendingDelete(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,42,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: 16, padding: 24, maxWidth: 420, width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <IconWarning size={18} color="#CC3344" />
              <h2 style={{ fontFamily: R, fontSize: "1.1rem", color: "#1B3A2D", letterSpacing: 2, margin: 0 }}>DELETE MESSAGE?</h2>
            </div>
            <p style={{ fontFamily: B, fontSize: 13, color: "#5A7A60", margin: 0, lineHeight: 1.5 }}>
              This will permanently delete the message from <strong style={{ color: "#1B3A2D" }}>{pendingDelete.name}</strong> ({pendingDelete.email}). This can&apos;t be undone.
            </p>
            <div style={{ background: "#F7FAF5", border: "1px solid #E4EDE4", borderRadius: 8, padding: "10px 12px", fontFamily: B, fontSize: 12, color: "#5A7A60", lineHeight: 1.5, maxHeight: 120, overflow: "auto" as const, whiteSpace: "pre-wrap" as const }}>
              {pendingDelete.message}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setPendingDelete(null)} disabled={!!busy}
                style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: 10, padding: "10px 16px", cursor: busy ? "wait" : "pointer", letterSpacing: 1.2 }}>
                KEEP
              </button>
              <button onClick={confirmRemove} disabled={!!busy}
                style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#ffffff", background: "#CC3344", border: "1.5px solid #CC3344", borderRadius: 10, padding: "10px 16px", cursor: busy ? "wait" : "pointer", letterSpacing: 1.2 }}>
                {busy ? "DELETING…" : "YES, DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
