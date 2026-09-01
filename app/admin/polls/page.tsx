"use client";
import { useEffect, useState } from "react";
import { IconCheck, IconTrash, IconWarning } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const inp: React.CSSProperties = {
  background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px",
  padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px",
  outline: "none", boxSizing: "border-box",
};

interface Option { id: string; label: string; sort_order: number; vote_count: number; }
interface Poll {
  id: string;
  question: string;
  description: string | null;
  category: string;
  is_published: boolean;
  ends_at: string | null;
  results_visible: "always" | "after_vote" | "after_end";
  created_at: string;
  options: Option[];
  total_votes: number;
}

const RESULTS_LABEL: Record<string, string> = {
  always:     "Always visible",
  after_vote: "After you vote",
  after_end:  "Only after poll ends",
};

const EMPTY = { question: "", description: "", category: "general", is_published: false, ends_at: "", results_visible: "always" as const, options: ["", ""] };

export default function AdminPollsPage() {
  const [polls, setPolls]     = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft]     = useState({ ...EMPTY });

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/admin/polls");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setPolls(d.polls ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create() {
    setError(""); setStatus("");
    if (!draft.question.trim()) { setError("Question is required."); return; }
    const cleanOpts = draft.options.map(s => s.trim()).filter(Boolean);
    if (cleanOpts.length < 2) { setError("At least 2 non-empty options are required."); return; }
    setBusy("__new__");
    try {
      const r = await fetch("/api/admin/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, options: cleanOpts, ends_at: draft.ends_at || null }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Poll created.");
      setDraft({ ...EMPTY, options: ["", ""] });
      setShowNew(false);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function togglePublish(p: Poll) {
    setBusy(p.id); setError(""); setStatus("");
    try {
      const r = await fetch("/api/admin/polls", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, is_published: !p.is_published }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(p.is_published ? "Unpublished." : "Published.");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function remove(p: Poll) {
    if (!confirm(`Delete "${p.question.slice(0, 60)}${p.question.length > 60 ? "…" : ""}"?\n\nAll ${p.total_votes} vote${p.total_votes === 1 ? "" : "s"} will be lost.`)) return;
    setBusy(p.id); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/polls?id=${p.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Poll deleted.");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>POLLS</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>
            Community polls. Members vote on <a href="/members/polls" target="_blank" rel="noreferrer" style={{ color: "#1A8040" }}>/members/polls</a> — publish to make one live.
          </p>
        </div>
        <button onClick={() => setShowNew(v => !v)}
          style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: showNew ? "#5A5A5A" : "#1A8040", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px" }}>
          {showNew ? "CLOSE" : "NEW POLL"}
        </button>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {showNew && (
        <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#7A5A0F", letterSpacing: "2px" }}>NEW POLL</div>
          <input value={draft.question} onChange={e => setDraft(p => ({ ...p, question: e.target.value }))} placeholder="Question (what are you asking?)" style={inp} />
          <textarea value={draft.description} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional context)" rows={2} style={{ ...inp, resize: "vertical" as const }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 200px", gap: "10px" }}>
            <input value={draft.category} onChange={e => setDraft(p => ({ ...p, category: e.target.value }))} placeholder="Category" style={inp} />
            <input value={draft.ends_at} onChange={e => setDraft(p => ({ ...p, ends_at: e.target.value }))} placeholder="Ends at (optional)" type="datetime-local" style={inp} />
            <select value={draft.results_visible} onChange={e => setDraft(p => ({ ...p, results_visible: e.target.value as any }))} style={inp}>
              <option value="always">Results always visible</option>
              <option value="after_vote">Results after you vote</option>
              <option value="after_end">Results only after end</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.2px" }}>OPTIONS ({draft.options.length})</span>
            {draft.options.map((opt, i) => (
              <div key={i} style={{ display: "flex", gap: "6px" }}>
                <input value={opt} onChange={e => setDraft(p => { const c = [...p.options]; c[i] = e.target.value; return { ...p, options: c }; })} placeholder={`Option ${i + 1}`} style={{ ...inp, flex: 1 }} />
                {draft.options.length > 2 && (
                  <button onClick={() => setDraft(p => ({ ...p, options: p.options.filter((_, j) => j !== i) }))}
                    style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#8A1E27", background: "transparent", border: "1.5px solid #F1C0C6", borderRadius: "8px", padding: "6px 10px", cursor: "pointer" }}>
                    ×
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setDraft(p => ({ ...p, options: [...p.options, ""] }))}
              style={{ alignSelf: "flex-start", fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1A8040", background: "#E8F0E4", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
              + ADD OPTION
            </button>
          </div>

          <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>
            <input type="checkbox" checked={draft.is_published} onChange={e => setDraft(p => ({ ...p, is_published: e.target.checked }))} /> Publish immediately
          </label>

          <button onClick={create} disabled={busy === "__new__"}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px", alignSelf: "flex-start" }}>
            {busy === "__new__" ? "CREATING…" : "CREATE POLL"}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : polls.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>
          No polls yet. Click NEW POLL to create your first one.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {polls.map(p => {
            const ended = p.ends_at ? new Date(p.ends_at) < new Date() : false;
            return (
              <div key={p.id} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>{p.category.toUpperCase()}</span>
                  <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: p.is_published ? "#156530" : "#5A5A5A", background: p.is_published ? "#E8F0E4" : "#F0F0F0", borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>{p.is_published ? "PUBLISHED" : "DRAFT"}</span>
                  {ended && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>ENDED</span>}
                  <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#1A8040", background: "#E8F0E4", borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>{p.total_votes} VOTES</span>
                  <span style={{ marginLeft: "auto", fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>
                    {p.ends_at ? `ends ${new Date(p.ends_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" })}` : "no end"}
                  </span>
                </div>

                <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1px" }}>{p.question}</div>
                {p.description && <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>{p.description}</div>}

                {/* Result bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                  {p.options.map(o => {
                    const pct = p.total_votes === 0 ? 0 : Math.round((o.vote_count / p.total_votes) * 100);
                    return (
                      <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", alignItems: "center" }}>
                        <div style={{ position: "relative" as const, background: "#F2F7F2", borderRadius: "8px", padding: "6px 12px", overflow: "hidden" }}>
                          <div style={{ position: "absolute" as const, top: 0, left: 0, height: "100%", width: `${pct}%`, background: "#E8F0E4", transition: "width .3s" }} />
                          <span style={{ position: "relative" as const, fontFamily: B, fontSize: "12px", color: "#1B3A2D" }}>{o.label}</span>
                        </div>
                        <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#156530", whiteSpace: "nowrap" as const }}>{o.vote_count} · {pct}%</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ marginRight: "auto", fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>{RESULTS_LABEL[p.results_visible]}</span>
                  <button onClick={() => togglePublish(p)} disabled={busy === p.id}
                    style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: p.is_published ? "#7A5A0F" : "#ffffff", background: p.is_published ? "#FFF3D6" : "#1A8040", border: "none", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>
                    {p.is_published ? "UNPUBLISH" : "PUBLISH"}
                  </button>
                  <button onClick={() => remove(p)} disabled={busy === p.id}
                    style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#8A1E27", background: "transparent", border: "1.5px solid #F1C0C6", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <IconTrash size={11} color="#8A1E27" /> DELETE
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
