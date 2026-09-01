"use client";
import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconTrash, IconWarning } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Faq {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
  view_count?: number;
  updated_at?: string;
}

const inp: React.CSSProperties = {
  background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px",
  padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px",
  outline: "none", boxSizing: "border-box",
};

const EMPTY: Faq = { id: "", category: "general", question: "", answer: "", sort_order: 0, is_published: true };

export default function AdminFaqPage() {
  const [faqs, setFaqs]       = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft]     = useState<Faq>(EMPTY);
  const [editing, setEditing] = useState<Record<string, Faq>>({});

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/admin/faqs");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setFaqs(d.faqs ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const f of faqs) s.add(f.category);
    return Array.from(s).sort();
  }, [faqs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faqs.filter(f =>
      (!catFilter || f.category === catFilter) &&
      (!q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q))
    );
  }, [faqs, search, catFilter]);

  async function create() {
    setError(""); setStatus("");
    if (!draft.question.trim() || !draft.answer.trim()) { setError("Question and answer are required."); return; }
    setBusy("__new__");
    try {
      const r = await fetch("/api/admin/faqs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("FAQ created.");
      setDraft(EMPTY); setShowNew(false);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function save(id: string) {
    const patch = editing[id];
    if (!patch) return;
    setBusy(id); setError(""); setStatus("");
    try {
      const r = await fetch("/api/admin/faqs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Saved.");
      setEditing(prev => { const c = { ...prev }; delete c[id]; return c; });
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function togglePublish(f: Faq) {
    setBusy(f.id); setError("");
    try {
      const r = await fetch("/api/admin/faqs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: f.id, is_published: !f.is_published }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function remove(f: Faq) {
    if (!confirm(`Delete "${f.question.slice(0, 60)}${f.question.length > 60 ? "…" : ""}"?`)) return;
    setBusy(f.id); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/faqs?id=${f.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("FAQ deleted.");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  function editValue(f: Faq): Faq { return editing[f.id] ?? f; }
  function setField(id: string, patch: Partial<Faq>) {
    setEditing(prev => ({ ...prev, [id]: { ...(prev[id] ?? faqs.find(x => x.id === id)!), ...patch } }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>FAQ</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>
            Questions and answers shown on <a href="/faq" target="_blank" rel="noreferrer" style={{ color: "#1A8040" }}>coletfansuporta.com/faq</a>. Unpublished rows stay hidden from the public.
          </p>
        </div>
        <button onClick={() => setShowNew(v => !v)}
          style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: showNew ? "#5A5A5A" : "#1A8040", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px" }}>
          {showNew ? "CLOSE" : "NEW FAQ"}
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setCatFilter("")}
          style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: !catFilter ? "#ffffff" : "#1B3A2D", background: !catFilter ? "#1A8040" : "#ffffff", border: `1.5px solid ${!catFilter ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>ALL</button>
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c === catFilter ? "" : c)}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: c === catFilter ? "#ffffff" : "#1B3A2D", background: c === catFilter ? "#1A8040" : "#ffffff", border: `1.5px solid ${c === catFilter ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
            {c.toUpperCase()} ({faqs.filter(f => f.category === c).length})
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search question / answer…" style={{ ...inp, flex: 1, minWidth: "220px" }} />
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {showNew && (
        <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#7A5A0F", letterSpacing: "2px" }}>NEW FAQ</div>
          <div style={{ display: "grid", gridTemplateColumns: "160px 120px 1fr", gap: "10px" }}>
            <input value={draft.category} onChange={e => setDraft(p => ({ ...p, category: e.target.value }))} placeholder="Category" style={inp} />
            <input value={draft.sort_order} onChange={e => setDraft(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} placeholder="Sort order" type="number" style={inp} />
            <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>
              <input type="checkbox" checked={draft.is_published} onChange={e => setDraft(p => ({ ...p, is_published: e.target.checked }))} /> Published
            </label>
          </div>
          <input value={draft.question} onChange={e => setDraft(p => ({ ...p, question: e.target.value }))} placeholder="Question" style={inp} />
          <textarea value={draft.answer} onChange={e => setDraft(p => ({ ...p, answer: e.target.value }))} placeholder="Answer (plain text — line breaks preserved)" rows={5} style={{ ...inp, resize: "vertical" as const, lineHeight: 1.55 }} />
          <button onClick={create} disabled={busy === "__new__"}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px", alignSelf: "flex-start" }}>
            {busy === "__new__" ? "CREATING…" : "CREATE FAQ"}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>
          No FAQs match your filter.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(f => {
            const e = editValue(f);
            const dirty = !!editing[f.id];
            return (
              <div key={f.id} style={{ background: "#ffffff", border: `1px solid ${dirty ? "#F0D889" : "#DDE8DD"}`, borderRadius: "14px", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>

                <div style={{ display: "grid", gridTemplateColumns: "140px 90px 1fr auto", gap: "8px", alignItems: "center" }}>
                  <input value={e.category} onChange={ev => setField(f.id, { category: ev.target.value })} style={{ ...inp, padding: "6px 10px", fontSize: "12px" }} />
                  <input value={e.sort_order} onChange={ev => setField(f.id, { sort_order: parseInt(ev.target.value) || 0 })} type="number" style={{ ...inp, padding: "6px 10px", fontSize: "12px" }} />
                  <input value={e.question} onChange={ev => setField(f.id, { question: ev.target.value })} placeholder="Question" style={{ ...inp, padding: "8px 12px", fontSize: "13px", fontWeight: 600 }} />
                  <button onClick={() => togglePublish(f)} disabled={busy === f.id}
                    style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: f.is_published ? "#156530" : "#7A5A0F", background: f.is_published ? "#E8F0E4" : "#FFF3D6", border: "1.5px solid transparent", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", letterSpacing: "1.2px", whiteSpace: "nowrap" }}>
                    {f.is_published ? "PUBLISHED" : "DRAFT"}
                  </button>
                </div>

                <textarea value={e.answer} onChange={ev => setField(f.id, { answer: ev.target.value })} rows={3} style={{ ...inp, resize: "vertical" as const, lineHeight: 1.55 }} />

                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                  {dirty && (
                    <>
                      <button onClick={() => setEditing(prev => { const c = { ...prev }; delete c[f.id]; return c; })}
                        style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
                        CANCEL
                      </button>
                      <button onClick={() => save(f.id)} disabled={busy === f.id}
                        style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "8px", padding: "7px 14px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <IconCheck size={11} color="#ffffff" /> SAVE
                      </button>
                    </>
                  )}
                  <button onClick={() => remove(f)} disabled={busy === f.id}
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
