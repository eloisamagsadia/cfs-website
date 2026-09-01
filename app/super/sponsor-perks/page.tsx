"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconCheck, IconWarning, IconStar } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Perks {
  id: string;
  max_sponsors: number;
  early_access_days: number;
  active: boolean;
}

export default function SponsorPerksPage() {
  const [perks, setPerks]     = useState<Perks | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [form, setForm]       = useState({ max_sponsors: "", early_access_days: "", active: true });
  const [initial, setInitial] = useState({ max_sponsors: "", early_access_days: "", active: true });

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/admin/sponsor-perks");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.perks) {
        setPerks(d.perks);
        const f = { max_sponsors: String(d.perks.max_sponsors ?? ""), early_access_days: String(d.perks.early_access_days ?? ""), active: !!d.perks.active };
        setForm(f); setInitial(f);
      }
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const dirty = form.max_sponsors !== initial.max_sponsors || form.early_access_days !== initial.early_access_days || form.active !== initial.active;

  async function save() {
    setError(""); setStatus(""); setSaving(true);
    try {
      const body = {
        id: perks?.id,
        max_sponsors: form.max_sponsors === "" ? null : Number(form.max_sponsors),
        early_access_days: form.early_access_days === "" ? 0 : Number(form.early_access_days),
        active: form.active,
      };
      const r = await fetch("/api/admin/sponsor-perks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus("Saved. Applies to new event registrations immediately.");
      setInitial(form);
      if (d.perks) setPerks(d.perks);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  const inp: React.CSSProperties = { width: "100%", background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
  const label: React.CSSProperties = { fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginBottom: "6px", display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#FFF3D6", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <IconStar size={20} color="#B78A1F" />
          </div>
          <div>
            <Link href="/super" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← COMMAND CENTER</Link>
            <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#156530", letterSpacing: "2.5px", marginTop: "4px" }}>SPONSOR PERKS</h1>
            <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "2px" }}>Global config for what the sponsor role gets on the site.</p>
          </div>
        </div>
        <button onClick={save} disabled={saving || !dirty}
          style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: dirty ? "#1A8040" : "#B7CDB7", border: "none", borderRadius: "10px", padding: "10px 20px", cursor: dirty && !saving ? "pointer" : "not-allowed", letterSpacing: "1.2px" }}>
          {saving ? "SAVING…" : dirty ? "SAVE CHANGES" : "SAVED"}
        </button>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={14} color="#156530" /> {status}</div>}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "22px 24px", display: "flex", flexDirection: "column", gap: "18px", maxWidth: "640px" }}>

          <div>
            <label style={label}>MAX SPONSORS (CAP)</label>
            <input type="number" min="0" value={form.max_sponsors} onChange={e => setForm({ ...form, max_sponsors: e.target.value })} style={inp} placeholder="e.g. 50" />
            <p style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", marginTop: "6px", lineHeight: 1.5 }}>Total number of members that can hold the <strong>sponsor</strong> role. Blank = unlimited.</p>
          </div>

          <div>
            <label style={label}>EARLY ACCESS · DAYS BEFORE GENERAL</label>
            <input type="number" min="0" max="30" value={form.early_access_days} onChange={e => setForm({ ...form, early_access_days: e.target.value })} style={inp} placeholder="e.g. 2" />
            <p style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", marginTop: "6px", lineHeight: 1.5 }}>How many days before general registration opens, sponsors get first crack at event tickets. Applies only to events with dates set on <code>sponsor_access_at</code> / <code>member_access_at</code>.</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => setForm({ ...form, active: !form.active })}
              style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", background: form.active ? "#1A8040" : "#DDE8DD", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: "3px", left: form.active ? "22px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#ffffff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </button>
            <div>
              <div style={{ fontFamily: B, fontSize: "14px", color: form.active ? "#1A8040" : "#5A7A60", fontWeight: 600 }}>
                {form.active ? "Sponsor perks are active" : "Sponsor perks are disabled"}
              </div>
              <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>When off, sponsors get no early access even if event dates are set.</div>
            </div>
          </div>

          {perks && (
            <div style={{ borderTop: "1px dashed #DDE8DD", paddingTop: "14px", fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>
              Config row ID <code style={{ fontFamily: "'SF Mono', ui-monospace, Menlo, monospace" }}>{perks.id}</code>. This page edits the single active perks row.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
