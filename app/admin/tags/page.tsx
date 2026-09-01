"use client";
import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconTrash, IconWarning } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Tag {
  id: string;
  name: string;
  color: string;
  description: string | null;
  sort_order: number;
  usage_count?: number;
}

const inp: React.CSSProperties = {
  background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px",
  padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px",
  outline: "none", boxSizing: "border-box",
};

const PRESET_COLORS = ["#1A8040", "#B78A1F", "#8A1E27", "#1E4A7A", "#5A1E7A", "#7A5A0F", "#156530", "#5A5A5A"];

const EMPTY: Tag = { id: "", name: "", color: "#1A8040", description: "", sort_order: 0 };

export default function TagsAdminPage() {
  const [tags, setTags]       = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [draft, setDraft]     = useState<Tag>(EMPTY);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Record<string, Tag>>({});
  const [search, setSearch]   = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/admin/tags");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setTags(d.tags ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter(t => t.name.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q));
  }, [tags, search]);

  async function create() {
    if (!draft.name.trim()) { setError("Name is required."); return; }
    setBusy("__new__"); setError(""); setStatus("");
    try {
      const r = await fetch("/api/admin/tags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Tag created.");
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
      const r = await fetch("/api/admin/tags", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Saved.");
      setEditing(prev => { const c = { ...prev }; delete c[id]; return c; });
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function remove(t: Tag) {
    if (t.usage_count && t.usage_count > 0) {
      if (!confirm(`"${t.name}" is assigned to ${t.usage_count} member${t.usage_count === 1 ? "" : "s"}. Delete anyway? All assignments will be removed.`)) return;
    } else {
      if (!confirm(`Delete tag "${t.name}"?`)) return;
    }
    setBusy(t.id); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/tags?id=${t.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Tag deleted.");
      load();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  function value(t: Tag): Tag { return editing[t.id] ?? t; }
  function setField(id: string, patch: Partial<Tag>) {
    setEditing(prev => ({ ...prev, [id]: { ...(prev[id] ?? tags.find(x => x.id === id)!), ...patch } }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>MEMBER TAGS</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Labels for cohort tracking. Assign from the member detail page, filter from the member list.</p>
        </div>
        <button onClick={() => setShowNew(v => !v)}
          style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: showNew ? "#5A5A5A" : "#1A8040", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px" }}>
          {showNew ? "CLOSE" : "NEW TAG"}
        </button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tags…" style={inp} />

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {showNew && (
        <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "14px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#7A5A0F", letterSpacing: "2px" }}>NEW TAG</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: "10px" }}>
            <input value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} placeholder="Tag name (e.g. OG Fan)" style={inp} />
            <input value={draft.sort_order} onChange={e => setDraft(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} placeholder="Sort" type="number" style={inp} />
          </div>
          <input value={draft.description ?? ""} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} placeholder="Description (internal, optional)" style={inp} />
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.2px" }}>COLOR</span>
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => setDraft(p => ({ ...p, color: c }))}
                style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: draft.color === c ? "3px solid #1B3A2D" : "1.5px solid #DDE8DD", cursor: "pointer" }} />
            ))}
            <input value={draft.color} onChange={e => setDraft(p => ({ ...p, color: e.target.value }))} placeholder="#hex" style={{ ...inp, width: 100 }} />
          </div>
          <button onClick={create} disabled={busy === "__new__"}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px", alignSelf: "flex-start" }}>
            {busy === "__new__" ? "CREATING…" : "CREATE TAG"}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>
          No tags match your search.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(t => {
            const v = value(t);
            const dirty = !!editing[t.id];
            return (
              <div key={t.id} style={{ background: "#ffffff", border: `1px solid ${dirty ? "#F0D889" : "#DDE8DD"}`, borderRadius: "14px", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 90px auto", gap: "10px", alignItems: "center" }}>
                  <span style={{ width: 24, height: 24, borderRadius: "50%", background: v.color, border: "1.5px solid #ffffff", boxShadow: "0 0 0 1px #DDE8DD" }} />
                  <input value={v.name} onChange={e => setField(t.id, { name: e.target.value })} style={{ ...inp, padding: "7px 12px", fontSize: "13px", fontWeight: 600 }} />
                  <input value={v.sort_order} onChange={e => setField(t.id, { sort_order: parseInt(e.target.value) || 0 })} type="number" style={{ ...inp, padding: "7px 10px", fontSize: "12px" }} />
                  <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: t.usage_count ? "#156530" : "#7A8E7A", background: t.usage_count ? "#E8F0E4" : "#F2F7F2", borderRadius: "6px", padding: "4px 10px", letterSpacing: "1.2px", whiteSpace: "nowrap" }}>
                    {t.usage_count ?? 0} MEMBER{t.usage_count === 1 ? "" : "S"}
                  </span>
                </div>
                <input value={v.description ?? ""} onChange={e => setField(t.id, { description: e.target.value })} placeholder="Description (internal)" style={{ ...inp, padding: "7px 12px", fontSize: "12px" }} />
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setField(t.id, { color: c })}
                      style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: v.color === c ? "3px solid #1B3A2D" : "1.5px solid #DDE8DD", cursor: "pointer" }} />
                  ))}
                  <input value={v.color} onChange={e => setField(t.id, { color: e.target.value })} placeholder="#hex" style={{ ...inp, width: 100, padding: "6px 10px", fontSize: "11px" }} />
                  <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                    {dirty && (
                      <>
                        <button onClick={() => setEditing(prev => { const c = { ...prev }; delete c[t.id]; return c; })}
                          style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
                          CANCEL
                        </button>
                        <button onClick={() => save(t.id)} disabled={busy === t.id}
                          style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <IconCheck size={11} color="#ffffff" /> SAVE
                        </button>
                      </>
                    )}
                    <button onClick={() => remove(t)} disabled={busy === t.id}
                      style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#8A1E27", background: "transparent", border: "1.5px solid #F1C0C6", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <IconTrash size={11} color="#8A1E27" /> DELETE
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
