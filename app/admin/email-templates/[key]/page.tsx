"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { IconMail, IconSend, IconCheck, IconWarning } from "@/components/shared/Icons";
import { TEMPLATE_META, SAMPLE_VARS, type TemplateKey } from "@/lib/email-template-vars";
import RichEmailEditor from "@/components/admin/RichEmailEditor";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const VALID_KEYS: TemplateKey[] = ["event_ticket", "donation_receipt", "order_confirmation", "welcome"];

function applyVars(template: string, vars: Record<string, string>): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{\\s*${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\}\\}`, "g"), v);
  }
  return out;
}

export default function EmailTemplateEditor() {
  const params = useParams();
  const key = String(params?.key ?? "") as TemplateKey;
  const isValid = VALID_KEYS.includes(key);
  const meta = isValid ? TEMPLATE_META[key] : null;
  const sample = isValid ? SAMPLE_VARS[key] : {};

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [testing, setTesting]     = useState(false);
  const [error, setError]         = useState("");
  const [status, setStatus]       = useState("");
  const [subject, setSubject]     = useState("");
  const [html, setHtml]           = useState("");
  const [testTo, setTestTo]       = useState("");
  const [initial, setInitial]     = useState({ subject: "", html: "" });
  const [varsOpen, setVarsOpen]   = useState(false);

  useEffect(() => {
    if (!isValid) { setLoading(false); return; }
    let cancelled = false;
    fetch(`/api/admin/email-templates?key=${key}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.error) { setError(d.error); setLoading(false); return; }
        setSubject(d.template.subject ?? "");
        setHtml(d.template.html ?? "");
        setInitial({ subject: d.template.subject ?? "", html: d.template.html ?? "" });
        setLoading(false);
      })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [key, isValid]);

  const previewHtml = useMemo(() => applyVars(html, sample as Record<string, string>), [html, sample]);
  const previewSubject = useMemo(() => applyVars(subject, sample as Record<string, string>), [subject, sample]);
  const dirty = subject !== initial.subject || html !== initial.html;
  const requiredMissing = useMemo(() => {
    if (!meta) return [];
    return meta.vars.filter(v => v.required && !html.includes(`{{${v.name}}}`) && !html.includes(`{{ ${v.name} }}`)).map(v => v.name);
  }, [meta, html]);

  const save = async () => {
    setError(""); setStatus(""); setSaving(true);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, subject, html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setInitial({ subject, html });
      setStatus("Saved. Live for the next email of this type.");
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const sendTest = async () => {
    setError(""); setStatus(""); setTesting(true);
    try {
      const res = await fetch("/api/admin/email-templates/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, subject, html, to: testTo.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setStatus(`Test sent to ${data.to}. Check inbox (subject prefixed with [TEST]).`);
    } catch (e: any) { setError(e.message); }
    finally { setTesting(false); }
  };

  const revert = () => { setSubject(initial.subject); setHtml(initial.html); setStatus("Reverted to last saved."); setError(""); };

  if (!isValid) {
    return <div style={{ padding: "48px", textAlign: "center", fontFamily: B, color: "#CC3344" }}>Unknown template key: {key}</div>;
  }
  if (loading) {
    return <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>;
  }

  const inputStyle: React.CSSProperties = { width: "100%", background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "11px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginBottom: "6px", display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <style>{`
        @media (max-width: 1180px) {
          .et-split { grid-template-columns: 1fr !important; }
          .et-preview { position: static !important; }
        }
      `}</style>

      {/* ── HEADER ────────────────────────────────────────────── */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#E8F0E4", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IconMail size={20} color="#1A8040" />
          </div>
          <div style={{ minWidth: 0 }}>
            <Link href="/admin/emails" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← EMAIL TOOLS</Link>
            <h1 style={{ fontFamily: R, fontSize: "1.3rem", color: "#1B3A2D", letterSpacing: "2.5px", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta!.label.toUpperCase()}</h1>
            <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis" }}>{meta!.description}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setVarsOpen(true)}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1B3A2D", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>
            {"{ } "}VARIABLES ({meta!.vars.length})
          </button>
          {dirty && <button onClick={revert} disabled={saving} style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>REVERT</button>}
          <button onClick={save} disabled={saving || !dirty}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: dirty ? "#1A8040" : "#B7CDB7", border: "1.5px solid " + (dirty ? "#1A8040" : "#B7CDB7"), borderRadius: "10px", padding: "9px 18px", cursor: dirty && !saving ? "pointer" : "not-allowed", letterSpacing: "1.2px" }}>
            {saving ? "SAVING…" : dirty ? "SAVE CHANGES" : "SAVED"}
          </button>
        </div>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={14} color="#156530" /> {status}</div>}
      {requiredMissing.length > 0 && (
        <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "12px", color: "#7A5A0F", display: "flex", gap: "8px", alignItems: "center" }}>
          <IconWarning size={13} color="#7A5A0F" />
          <span>Missing required variable{requiredMissing.length > 1 ? "s" : ""}: {requiredMissing.map(v => <code key={v} style={{ background: "#FFF3D6", padding: "1px 6px", borderRadius: "4px", marginRight: "4px" }}>{"{{"}{v}{"}}"}</code>)}</span>
        </div>
      )}

      {/* ── SPLIT: EDITOR | PREVIEW ─────────────────────────── */}
      <div className="et-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)", gap: "16px", alignItems: "start" }}>

        {/* Editor column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px" }}>
            <label style={labelStyle}>SUBJECT LINE</label>
            <input style={inputStyle} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Your ticket for {{event_title}}" />
          </div>
          <RichEmailEditor
            value={html}
            onChange={setHtml}
            variables={meta!.vars.map(v => ({ name: v.name, note: v.note }))}
            minHeight={520}
          />
        </div>

        {/* Preview column (sticky) */}
        <div className="et-preview" style={{ position: "sticky", top: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: "620px", boxShadow: "0 4px 14px rgba(15,42,30,0.05)" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4EDE4", background: "linear-gradient(180deg, #F7FAF5 0%, #ffffff 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ACB6E", boxShadow: "0 0 0 3px rgba(74,203,110,0.15)" }} />
                <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>LIVE PREVIEW · SAMPLE DATA</div>
              </div>
              <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", marginTop: "6px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {previewSubject || <span style={{ color: "#B7CDB7", fontWeight: 400 }}>Subject preview…</span>}
              </div>
            </div>
            <iframe srcDoc={previewHtml} sandbox="" title="Email preview"
              style={{ flex: 1, width: "100%", border: "none", background: "#F0F0F0", minHeight: "520px" }} />
          </div>

          {/* Test send */}
          <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <IconSend size={12} color="#1A8040" />
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>SEND A TEST TO YOURSELF</div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="Blank = your Clerk email"
                style={{ ...inputStyle, flex: 1, minWidth: "160px" }} />
              <button onClick={sendTest} disabled={testing}
                style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 16px", cursor: testing ? "wait" : "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <IconSend size={11} color="#ffffff" /> {testing ? "SENDING…" : "SEND TEST"}
              </button>
            </div>
            <p style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", margin: "8px 0 0", lineHeight: 1.5 }}>
              Uses your current unsaved subject + body with sample values. Subject prefixed with <code style={{ background: "#F2F7F2", padding: "1px 5px", borderRadius: "4px" }}>[TEST]</code>.
            </p>
          </div>
        </div>
      </div>

      {/* ── VARIABLES DRAWER ─────────────────────────────────── */}
      {varsOpen && (
        <div onClick={() => setVarsOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,42,30,0.55)", zIndex: 998, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: "min(420px, 100%)", height: "100%", background: "#ffffff", padding: "22px 22px 24px", overflow: "auto", boxShadow: "-10px 0 40px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>VARIABLES</div>
                <h2 style={{ fontFamily: R, fontSize: "1.2rem", color: "#1B3A2D", letterSpacing: "2px", margin: "2px 0 0" }}>{meta!.label.toUpperCase()}</h2>
              </div>
              <button onClick={() => setVarsOpen(false)}
                style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "8px", width: "32px", height: "32px", fontFamily: SG, fontWeight: 700, color: "#5A7A60", cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: 0, lineHeight: 1.6 }}>
              These placeholders are replaced at send time. Use the <strong>+ INSERT VAR</strong> dropdown in the editor toolbar to drop one in at the cursor.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {meta!.vars.map(v => (
                <div key={v.name} style={{ background: "#F7FAF5", border: "1px solid #DDE8DD", borderRadius: "10px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
                    <code style={{ background: "#E8F0E4", color: "#1B3A2D", padding: "3px 8px", borderRadius: "6px", fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "11px" }}>{"{{"}{v.name}{"}}"}</code>
                    {v.required && <span style={{ fontFamily: SG, fontSize: "8px", fontWeight: 700, color: "#CC3344", background: "#FFE8EC", borderRadius: "999px", padding: "2px 7px", letterSpacing: "1px" }}>REQUIRED</span>}
                  </div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", lineHeight: 1.5 }}>{v.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
