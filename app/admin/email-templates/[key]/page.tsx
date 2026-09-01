"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { IconMail, IconSend, IconCheck, IconWarning } from "@/components/shared/Icons";
import { TEMPLATE_META, SAMPLE_VARS, type TemplateKey } from "@/lib/email-template-vars";
import { TEMPLATE_SECTIONS, resolveSections } from "@/lib/email-template-sections";
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
  const sectionsCfg = isValid ? TEMPLATE_SECTIONS[key] : undefined;
  const hasSections = !!sectionsCfg;

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [testing, setTesting]     = useState(false);
  const [error, setError]         = useState("");
  const [status, setStatus]       = useState("");
  const [subject, setSubject]     = useState("");
  const [html, setHtml]           = useState("");
  const [sections, setSections]   = useState<Record<string, string>>({});
  const [testTo, setTestTo]       = useState("");
  const [mode, setMode]           = useState<"simple" | "advanced">(hasSections ? "simple" : "advanced");
  const [initial, setInitial]     = useState<{ subject: string; html: string; sections: Record<string, string> | null }>({ subject: "", html: "", sections: null });

  useEffect(() => {
    if (!isValid) { setLoading(false); return; }
    let cancelled = false;
    fetch(`/api/admin/email-templates?key=${key}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.error) { setError(d.error); setLoading(false); return; }
        const savedSections: Record<string, string> = {};
        if (hasSections) {
          const stored = (d.template.sections ?? {}) as Record<string, unknown>;
          for (const s of sectionsCfg!.sections) {
            const v = stored[s.key];
            savedSections[s.key] = typeof v === "string" ? v : s.default;
          }
        }
        setSubject(d.template.subject ?? "");
        setHtml(d.template.html ?? "");
        setSections(savedSections);
        setInitial({ subject: d.template.subject ?? "", html: d.template.html ?? "", sections: hasSections ? { ...savedSections } : null });
        setLoading(false);
      })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, isValid, hasSections]);

  const previewSubject = useMemo(() => applyVars(subject, sample as Record<string, string>), [subject, sample]);

  // Preview HTML: in Simple mode, ask the server for a rendered preview so
  // the fixed shell is applied. Debounced client-side render for feedback.
  const [previewHtml, setPreviewHtml] = useState("");
  useEffect(() => {
    if (!isValid) return;
    let cancelled = false;
    const controller = new AbortController();
    const body: any = mode === "simple" ? { key, subject, sections } : { key, subject, html };
    const t = setTimeout(() => {
      fetch("/api/admin/email-templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
        .then(r => r.json())
        .then(d => { if (!cancelled && d.html) setPreviewHtml(d.html); })
        .catch(() => {});
    }, 250);
    return () => { cancelled = true; controller.abort(); clearTimeout(t); };
  }, [subject, html, sections, mode, key, isValid]);

  const dirty = useMemo(() => {
    if (subject !== initial.subject) return true;
    if (mode === "advanced") return html !== initial.html;
    if (!initial.sections) return true;
    return Object.keys(sections).some(k => sections[k] !== initial.sections![k]);
  }, [subject, html, sections, initial, mode]);

  const save = async () => {
    setError(""); setStatus(""); setSaving(true);
    try {
      const body: any = mode === "simple"
        ? { key, subject, sections }
        : { key, subject, html };
      const res = await fetch("/api/admin/email-templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setInitial({ subject, html, sections: hasSections ? { ...sections } : null });
      setStatus("Saved. Live for the next email of this type.");
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const sendTest = async () => {
    setError(""); setStatus(""); setTesting(true);
    try {
      // Test-send always uses fully-rendered HTML so simple mode can be tested too.
      const rendered = previewHtml;
      const res = await fetch("/api/admin/email-templates/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, subject, html: rendered || html, to: testTo.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setStatus(`Test sent to ${data.to}. Subject prefixed with [TEST].`);
    } catch (e: any) { setError(e.message); }
    finally { setTesting(false); }
  };

  const revert = () => {
    setSubject(initial.subject);
    setHtml(initial.html);
    if (initial.sections) setSections({ ...initial.sections });
    setStatus("Reverted to last saved."); setError("");
  };

  const resetSectionToDefault = (sKey: string) => {
    if (!sectionsCfg) return;
    const def = sectionsCfg.sections.find(s => s.key === sKey);
    if (!def) return;
    setSections(prev => ({ ...prev, [sKey]: def.default }));
  };

  if (!isValid) {
    return <div style={{ padding: "48px", textAlign: "center", fontFamily: B, color: "#CC3344" }}>Unknown template key: {key}</div>;
  }
  if (loading) {
    return <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>;
  }

  const inputStyle: React.CSSProperties = { width: "100%", background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "11px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <style>{`
        @media (max-width: 1180px) {
          .et-split { grid-template-columns: 1fr !important; }
          .et-preview { position: static !important; }
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
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
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {hasSections && (
            <div style={{ display: "flex", gap: "2px", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "3px" }}>
              <button onClick={() => setMode("simple")}
                style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: mode === "simple" ? "#ffffff" : "#5A7A60", background: mode === "simple" ? "#1A8040" : "transparent", border: "none", borderRadius: "7px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>SIMPLE</button>
              <button onClick={() => setMode("advanced")}
                style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: mode === "advanced" ? "#ffffff" : "#5A7A60", background: mode === "advanced" ? "#1A8040" : "transparent", border: "none", borderRadius: "7px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>ADVANCED HTML</button>
            </div>
          )}
          {dirty && <button onClick={revert} disabled={saving} style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>REVERT</button>}
          <button onClick={save} disabled={saving || !dirty}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: dirty ? "#1A8040" : "#B7CDB7", border: "1.5px solid " + (dirty ? "#1A8040" : "#B7CDB7"), borderRadius: "10px", padding: "9px 18px", cursor: dirty && !saving ? "pointer" : "not-allowed", letterSpacing: "1.2px" }}>
            {saving ? "SAVING…" : dirty ? "SAVE CHANGES" : "SAVED"}
          </button>
        </div>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={14} color="#156530" /> {status}</div>}

      {mode === "simple" && (
        <div style={{ background: "#F0F7EE", border: "1px solid #B7D8B7", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "12px", color: "#3A5A30", display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "14px" }}>🔒</span>
          <span>The visual shell (banner, QR, buttons, brand) is locked. You edit only the copy below — no way to break the layout.</span>
        </div>
      )}

      {/* ── SPLIT ───────────────────────────────────────────────────── */}
      <div className="et-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)", gap: "16px", alignItems: "start" }}>

        {/* Editor column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px" }}>
            <label style={labelStyle}>SUBJECT LINE</label>
            <input style={inputStyle} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Your ticket for {{event_title}}" />
          </div>

          {mode === "simple" && sectionsCfg ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {sectionsCfg.sections.map(s => {
                const val = sections[s.key] ?? "";
                const isDefault = val === s.default;
                return (
                  <div key={s.key} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px" }}>
                    <label style={labelStyle}>
                      <span>{s.label.toUpperCase()}</span>
                      {!isDefault && (
                        <button type="button" onClick={() => resetSectionToDefault(s.key)}
                          style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "3px 8px", cursor: "pointer", letterSpacing: "1px" }}>
                          RESET
                        </button>
                      )}
                    </label>
                    {s.type === "text" ? (
                      <input style={inputStyle} value={val} onChange={e => setSections(prev => ({ ...prev, [s.key]: e.target.value }))} />
                    ) : (
                      <RichEmailEditor
                        value={val}
                        onChange={v => setSections(prev => ({ ...prev, [s.key]: v }))}
                        variables={meta!.vars.map(v => ({ name: v.name, note: v.note }))}
                        minHeight={140}
                      />
                    )}
                    {s.help && <div style={{ fontFamily: B, fontSize: "11px", color: "#7A8E7A", marginTop: "6px", lineHeight: 1.5 }}>{s.help}</div>}
                  </div>
                );
              })}
            </div>
          ) : (
            <RichEmailEditor
              value={html}
              onChange={setHtml}
              variables={meta!.vars.map(v => ({ name: v.name, note: v.note }))}
              minHeight={520}
            />
          )}
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
    </div>
  );
}
