"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IconMail, IconSend, IconCheck } from "@/components/shared/Icons";
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
  const router = useRouter();
  const key = String(params?.key ?? "") as TemplateKey;
  const isValid = VALID_KEYS.includes(key);
  const meta = isValid ? TEMPLATE_META[key] : null;
  const sample = isValid ? SAMPLE_VARS[key] : {};

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [error, setError]       = useState("");
  const [status, setStatus]     = useState("");
  const [subject, setSubject]   = useState("");
  const [html, setHtml]         = useState("");
  const [testTo, setTestTo]     = useState("");
  const [initial, setInitial]   = useState({ subject: "", html: "" });

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

  const inputStyle: React.CSSProperties = { width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontFamily: B, fontSize: "12px", color: "#4A7C59", letterSpacing: "1px", marginBottom: "6px", display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        @media (max-width: 1100px) {
          .et-split { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <Link href="/admin/email-templates" style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", textDecoration: "none" }}>← All templates</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginTop: "4px" }}>{meta!.label.toUpperCase()}</h1>
          <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "2px" }}>{meta!.description}</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {dirty && <button onClick={revert} disabled={saving} style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>REVERT</button>}
          <button onClick={save} disabled={saving || !dirty}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: dirty ? "#1A8040" : "#B7CDB7", border: "1.5px solid " + (dirty ? "#1A8040" : "#B7CDB7"), borderRadius: "10px", padding: "9px 18px", cursor: dirty && !saving ? "pointer" : "not-allowed", letterSpacing: "1.2px" }}>
            {saving ? "SAVING…" : dirty ? "SAVE CHANGES" : "SAVED"}
          </button>
        </div>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "8px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "8px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={14} color="#156530" /> {status}</div>}

      <div className="et-split" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        {/* Left — editor */}
        <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>SUBJECT</label>
            <input style={inputStyle} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Your ticket for {{event_title}}" />
          </div>
          <div>
            <label style={labelStyle}>BODY</label>
            <RichEmailEditor
              value={html}
              onChange={setHtml}
              variables={meta!.vars.map(v => ({ name: v.name, note: v.note }))}
              minHeight={440}
            />
          </div>
          <div style={{ background: "#F7FAF5", border: "1px solid #DDE8DD", borderRadius: "10px", padding: "12px 14px" }}>
            <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginBottom: "8px" }}>VARIABLE REFERENCE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {meta!.vars.map(v => (
                <div key={v.name} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontFamily: B, fontSize: "11px" }}>
                  <code style={{ background: "#E8F0E4", color: "#1B3A2D", padding: "2px 8px", borderRadius: "4px", fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "11px", flexShrink: 0 }}>{"{{"}{v.name}{"}}"}</code>
                  <span style={{ color: "#5A7A60", lineHeight: 1.5 }}>
                    {v.note}
                    {v.required && <span style={{ color: "#CC3344", marginLeft: "4px" }}>· required</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — preview + test */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: "560px" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #E4EDE4", background: "#F7FAF5" }}>
              <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>PREVIEW WITH SAMPLE VALUES</div>
              <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", marginTop: "4px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewSubject || <span style={{ color: "#B7CDB7" }}>Subject preview…</span>}</div>
            </div>
            <iframe
              srcDoc={previewHtml}
              sandbox=""
              title="Email preview"
              style={{ flex: 1, width: "100%", border: "none", background: "#F0F0F0" }}
            />
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconMail size={14} color="#1A8040" />
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>SEND A TEST</div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="Leave blank to send to your Clerk email"
                style={{ ...inputStyle, flex: 1, minWidth: "180px" }} />
              <button onClick={sendTest} disabled={testing}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 16px", cursor: testing ? "wait" : "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <IconSend size={12} color="#ffffff" /> {testing ? "SENDING…" : "SEND TEST"}
              </button>
            </div>
            <p style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", margin: 0, lineHeight: 1.5 }}>
              Test send uses your current unsaved subject + HTML with sample values. Subject prefixed with <code>[TEST]</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
