"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconCheck, IconTrash, IconEdit, IconX, IconHeart } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Drive {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  target_amount: number | null;
  cover_url: string | null;
  is_active: boolean;
  sort_order: number;
  raised: number;
  created_at: string;
  updated_at: string | null;
}

const BLANK = { name: "", category: "general", description: "", target_amount: "", cover_url: "", is_active: true, sort_order: "0" };

export default function DonationDrivesPage() {
  const [drives, setDrives]   = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft]     = useState<any>(BLANK);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/super/donation-drives");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDrives(d.drives ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!draft.name.trim()) return setError("Name required.");
    setError(""); setStatus("");
    try {
      const r = await fetch("/api/super/donation-drives", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(`Created "${d.drive.name}".`);
      setDraft(BLANK); setCreating(false);
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function save(id: string) {
    if (!draft.name.trim()) return setError("Name required.");
    setError(""); setStatus("");
    try {
      const r = await fetch("/api/super/donation-drives", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...draft }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEditingId(null); setDraft(BLANK);
      setStatus("Saved.");
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function remove(drive: Drive) {
    if (!confirm(`Delete "${drive.name}"?\n\nAny existing allocations pointing to this drive will fail (FK constraint). If donations already reference it, deactivate instead.`)) return;
    setError(""); setStatus("");
    try {
      const r = await fetch(`/api/super/donation-drives?id=${drive.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(`Deleted "${drive.name}".`);
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function toggleActive(drive: Drive) {
    try {
      const r = await fetch("/api/super/donation-drives", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: drive.id, is_active: !drive.is_active }) });
      if (!r.ok) throw new Error((await r.json()).error);
      setStatus(`${drive.is_active ? "Paused" : "Reactivated"} "${drive.name}".`);
      load();
    } catch (e: any) { setError(e.message); }
  }

  function beginEdit(d: Drive) {
    setEditingId(d.id);
    setDraft({
      name: d.name, category: d.category, description: d.description ?? "",
      target_amount: d.target_amount != null ? String(d.target_amount) : "",
      cover_url: d.cover_url ?? "", is_active: d.is_active,
      sort_order: String(d.sort_order ?? 0),
    });
  }

  const inp: React.CSSProperties = { background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const };
  const label: React.CSSProperties = { fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginBottom: "4px", display: "block" };
  const peso = (n: number) => `₱${Math.round(n).toLocaleString()}`;

  const formCard = (isCreate: boolean) => (
    <div style={{ background: "#F7FAF5", border: "1.5px solid #B7D8B7", borderRadius: "10px", padding: "14px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginTop: "8px" }}>
      <div><label style={label}>NAME</label><input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={inp} placeholder="Meet-up Fund" /></div>
      <div><label style={label}>CATEGORY</label><input value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} style={inp} placeholder="general / events / merch" /></div>
      <div><label style={label}>TARGET (₱)</label><input type="number" min="0" value={draft.target_amount} onChange={e => setDraft({ ...draft, target_amount: e.target.value })} style={inp} placeholder="blank = no target" /></div>
      <div><label style={label}>SORT ORDER</label><input type="number" value={draft.sort_order} onChange={e => setDraft({ ...draft, sort_order: e.target.value })} style={inp} /></div>
      <div style={{ gridColumn: "1 / -1" }}><label style={label}>DESCRIPTION</label><textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} style={{ ...inp, minHeight: "60px", resize: "vertical" as const }} /></div>
      <div style={{ gridColumn: "1 / -1" }}><label style={label}>COVER IMAGE URL</label><input value={draft.cover_url} onChange={e => setDraft({ ...draft, cover_url: e.target.value })} style={inp} placeholder="https://…" /></div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <input type="checkbox" checked={!!draft.is_active} onChange={e => setDraft({ ...draft, is_active: e.target.checked })} style={{ width: "16px", height: "16px", cursor: "pointer" }} id={isCreate ? "c-active" : "e-active"} />
        <label htmlFor={isCreate ? "c-active" : "e-active"} style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", cursor: "pointer" }}>Active</label>
      </div>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "flex-end" }}>
        <button onClick={() => { if (isCreate) { setDraft(BLANK); setCreating(false); } else { setEditingId(null); setDraft(BLANK); } }}
          style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "9px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>CANCEL</button>
        <button onClick={() => isCreate ? create() : save(editingId!)}
          style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "8px", padding: "9px 16px", cursor: "pointer", letterSpacing: "1.2px" }}>{isCreate ? "CREATE" : "SAVE"}</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div>
          <Link href="/super" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← COMMAND CENTER</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#156530", letterSpacing: "2.5px", marginTop: "4px" }}>DONATION DRIVES</h1>
          <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "2px" }}>Funding buckets shown on /donate. Donors split their contribution across active drives.</p>
        </div>
        {!creating && !editingId && (
          <button onClick={() => { setCreating(true); setDraft(BLANK); }}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px" }}>+ NEW DRIVE</button>
        )}
      </div>

      {creating && formCard(true)}

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : drives.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "48px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>No donation drives yet. Click <strong>+ NEW DRIVE</strong> to create one.</div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {drives.map(d => {
            const pct = d.target_amount ? Math.min(100, Math.round((d.raised / Number(d.target_amount)) * 100)) : null;
            const isEditing = editingId === d.id;
            return (
              <div key={d.id} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px" }}>
                {isEditing ? formCard(false) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: d.is_active ? "#E8F0E4" : "#F2F7F2", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <IconHeart size={16} color={d.is_active ? "#1A8040" : "#B7CDB7"} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1px" }}>{d.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                            <code style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "10px", color: "#5A7A60" }}>{d.slug}</code>
                            <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#7A8E7A", letterSpacing: "1.2px", background: "#F2F7F2", borderRadius: "4px", padding: "1px 6px" }}>{d.category.toUpperCase()}</span>
                            {!d.is_active && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: "4px", padding: "1px 6px", letterSpacing: "1.2px" }}>PAUSED</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => toggleActive(d)} title={d.is_active ? "Pause" : "Activate"}
                          style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: d.is_active ? "#7A5A0F" : "#156530", background: d.is_active ? "#FFF3D6" : "#E8F0E4", border: "1.5px solid transparent", borderRadius: "8px", padding: "7px 10px", cursor: "pointer", letterSpacing: "1.2px" }}>
                          {d.is_active ? "PAUSE" : "ACTIVATE"}
                        </button>
                        <button onClick={() => beginEdit(d)} title="Edit"
                          style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          <IconEdit size={13} color="#5A7A60" />
                        </button>
                        <button onClick={() => remove(d)} title="Delete"
                          style={{ background: "#FFE8EC", border: "1px solid #CC334440", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          <IconTrash size={13} color="#CC3344" />
                        </button>
                      </div>
                    </div>

                    {d.description && <div style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59", lineHeight: 1.6 }}>{d.description}</div>}

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ fontFamily: SG, fontSize: "12px", color: "#1A8040" }}>
                        <span style={{ fontFamily: R, fontSize: "16px", letterSpacing: "0.5px" }}>{peso(d.raised)}</span>
                        {d.target_amount && <span style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}> / {peso(Number(d.target_amount))}</span>}
                      </div>
                      {pct != null && (
                        <div style={{ flex: 1, minWidth: "160px", height: "6px", background: "#E4EDE4", borderRadius: "999px", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "#1A8040", borderRadius: "999px" }} />
                        </div>
                      )}
                      {pct != null && <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.2px" }}>{pct}%</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
