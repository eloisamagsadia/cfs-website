"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconCheck, IconTrash, IconEdit, IconX } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type TypeKey = "events" | "products" | "community";

const TYPES: { key: TypeKey; label: string; description: string; extraLabel?: string; extraField?: string; extraKind?: "color" | "url" }[] = [
  { key: "events",    label: "Event Categories",     description: "Tags shown on /events filter chips and /admin/events." },
  { key: "products",  label: "Product Categories",   description: "Grouping on the shop.", extraLabel: "Thumbnail URL", extraField: "thumbnail_url", extraKind: "url" },
  { key: "community", label: "Community Categories", description: "Post filters in the community feed.", extraLabel: "Color", extraField: "color", extraKind: "color" },
];

interface Item {
  id: string;
  name: string;
  slug: string;
  color?: string;
  thumbnail_url?: string;
}

export default function CategoriesPage() {
  const [active, setActive]   = useState<TypeKey>("events");
  const [items, setItems]     = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft]     = useState<{ name: string; slug: string; extra: string }>({ name: "", slug: "", extra: "" });
  const [newItem, setNew]     = useState<{ name: string; extra: string }>({ name: "", extra: "" });

  const cfg = TYPES.find(t => t.key === active)!;

  async function load(t: TypeKey) {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/super/categories?type=${t}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setItems(d.items ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(active); setEditingId(null); setNew({ name: "", extra: "" }); }, [active]);

  async function create() {
    if (!newItem.name.trim()) return setError("Name required.");
    setError(""); setStatus("");
    try {
      const body: any = { name: newItem.name.trim() };
      if (cfg.extraField && newItem.extra) body[cfg.extraField] = newItem.extra;
      const r = await fetch(`/api/super/categories?type=${active}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setNew({ name: "", extra: "" });
      setStatus(`Added "${d.item.name}".`);
      load(active);
    } catch (e: any) { setError(e.message); }
  }

  async function save(id: string) {
    if (!draft.name.trim()) return setError("Name required.");
    setError(""); setStatus("");
    try {
      const body: any = { id, name: draft.name, slug: draft.slug };
      if (cfg.extraField) body[cfg.extraField] = draft.extra;
      const r = await fetch(`/api/super/categories?type=${active}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEditingId(null);
      setStatus("Saved.");
      load(active);
    } catch (e: any) { setError(e.message); }
  }

  async function remove(item: Item) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.\n\nAny row referencing it will lose the reference (FK-nullable).`)) return;
    setError(""); setStatus("");
    try {
      const r = await fetch(`/api/super/categories?type=${active}&id=${item.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(`Deleted "${item.name}".`);
      load(active);
    } catch (e: any) { setError(e.message); }
  }

  const inp: React.CSSProperties = { background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px" }}>
        <Link href="/super" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← COMMAND CENTER</Link>
        <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#156530", letterSpacing: "2.5px", marginTop: "4px" }}>CATEGORIES</h1>
        <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "2px" }}>{cfg.description}</p>
      </div>

      {/* Type tabs */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {TYPES.map(t => (
          <button key={t.key} onClick={() => setActive(t.key)}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: active === t.key ? "#ffffff" : "#1B3A2D", background: active === t.key ? "#1A8040" : "#ffffff", border: "1.5px solid " + (active === t.key ? "#1A8040" : "#DDE8DD"), borderRadius: "10px", padding: "8px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {/* Create row */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "14px 16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", minWidth: "80px" }}>+ NEW</div>
        <input value={newItem.name} onChange={e => setNew({ ...newItem, name: e.target.value })} placeholder="Category name" style={{ ...inp, flex: "1 1 200px" }} />
        {cfg.extraKind === "color" && (
          <input type="color" value={newItem.extra || "#1A8040"} onChange={e => setNew({ ...newItem, extra: e.target.value })} style={{ ...inp, padding: "4px 6px", width: "50px", cursor: "pointer" }} />
        )}
        {cfg.extraKind === "url" && (
          <input value={newItem.extra} onChange={e => setNew({ ...newItem, extra: e.target.value })} placeholder="Thumbnail URL (optional)" style={{ ...inp, flex: "1 1 200px" }} />
        )}
        <button onClick={create}
          style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "10px", padding: "9px 18px", cursor: "pointer", letterSpacing: "1.2px" }}>
          ADD
        </button>
      </div>

      {/* List */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "10px 20px", background: "#F7FAF5", borderBottom: "1px solid #E4EDE4", display: "grid", gridTemplateColumns: cfg.extraField ? "1.6fr 1.4fr 1fr 100px" : "2fr 1fr 100px", gap: "10px" }}>
          <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>NAME</span>
          <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>SLUG</span>
          {cfg.extraField && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>{(cfg.extraLabel ?? cfg.extraField).toUpperCase()}</span>}
          <span></span>
        </div>

        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>No {cfg.label.toLowerCase()} yet. Use the form above to create one.</div>
        ) : items.map((item, i) => {
          const isEditing = editingId === item.id;
          const extra = (item as any)[cfg.extraField ?? ""] ?? "";
          return (
            <div key={item.id} style={{ padding: "10px 20px", borderTop: "1px solid #F0F5F0", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB", display: "grid", gridTemplateColumns: cfg.extraField ? "1.6fr 1.4fr 1fr 100px" : "2fr 1fr 100px", gap: "10px", alignItems: "center" }}>
              {isEditing ? <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={inp} />
                         : <span style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", fontWeight: 500 }}>{item.name}</span>}

              {isEditing ? <input value={draft.slug} onChange={e => setDraft({ ...draft, slug: e.target.value })} style={inp} />
                         : <code style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "11px", color: "#5A7A60" }}>{item.slug}</code>}

              {cfg.extraField && (
                isEditing
                  ? (cfg.extraKind === "color"
                       ? <input type="color" value={draft.extra || "#1A8040"} onChange={e => setDraft({ ...draft, extra: e.target.value })} style={{ ...inp, padding: "4px 6px", width: "50px" }} />
                       : <input value={draft.extra} onChange={e => setDraft({ ...draft, extra: e.target.value })} placeholder="URL" style={inp} />)
                  : (cfg.extraKind === "color"
                       ? <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><span style={{ width: "18px", height: "18px", borderRadius: "6px", background: extra, border: "1px solid #DDE8DD" }} /><code style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "11px", color: "#5A7A60" }}>{extra}</code></span>
                       : extra ? <a href={extra} target="_blank" rel="noopener noreferrer" style={{ fontFamily: B, fontSize: "11px", color: "#1A8040", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{extra}</a> : <span style={{ fontFamily: B, fontSize: "11px", color: "#B7CDB7" }}>—</span>)
              )}

              <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                {isEditing ? (
                  <>
                    <button onClick={() => save(item.id)} title="Save"
                      style={{ background: "#1A8040", border: "none", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <IconCheck size={12} color="#ffffff" />
                    </button>
                    <button onClick={() => setEditingId(null)} title="Cancel"
                      style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <IconX size={12} color="#5A7A60" />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setEditingId(item.id); setDraft({ name: item.name, slug: item.slug, extra: String(extra ?? "") }); }} title="Edit"
                      style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <IconEdit size={12} color="#5A7A60" />
                    </button>
                    <button onClick={() => remove(item)} title="Delete"
                      style={{ background: "#FFE8EC", border: "1px solid #CC334440", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <IconTrash size={12} color="#CC3344" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
