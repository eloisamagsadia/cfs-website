"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { IconCheck, IconWarning, IconMail, IconSend, IconTrash, IconEdit } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const ROLE_COLORS: Record<string, string> = {
  super_admin: "#156530", admin: "#1A8040", moderator: "#5A7A60",
  sponsor: "#B78A1F", member: "#4A7C59",
};

const DEFAULT_HTML = `<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">
    <div style="padding:32px 28px;">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;letter-spacing:4px;color:#1B3A2D;">CFS</div>
        <div style="font-size:11px;letter-spacing:3px;color:#5A7A60;margin-top:2px;">COLET FAN SUPORTA</div>
      </div>
      <h2 style="font-family:Georgia,serif;font-size:22px;color:#1B3A2D;margin:0 0 14px;">Hi {{name}},</h2>
      <p style="font-size:14px;color:#3A5A30;line-height:1.7;margin:0 0 12px;">Your message here…</p>
      <div style="border-top:1px dashed #DDE8DD;padding-top:16px;margin-top:20px;font-size:12px;color:#7A8E7A;text-align:center;">
        With love,<br/><strong style="color:#1A8040;">CFS Bini Colet Fan Club</strong>
      </div>
    </div>
  </div>
</div>`;

interface Tpl { id: string; name: string; subject: string; html: string; is_builtin: boolean; updated_at?: string; }

function applyVars(str: string, vars: Record<string, string>): string {
  let out = str;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "g"), v);
  }
  return out.replace(/\[NAME\]/g, vars.name ?? "there");
}

export default function AdminEmailPage() {
  const [members, setMembers]         = useState<any[]>([]);
  const [templates, setTemplates]     = useState<Tpl[]>([]);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState<any[]>([]);
  const [filterRole, setFilterRole]   = useState("all");
  const [activeTplId, setActiveTplId] = useState<string | null>(null);
  const [subject, setSubject]         = useState("");
  const [html, setHtml]               = useState(DEFAULT_HTML);
  const [sending, setSending]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [saveDialog, setSaveDialog]   = useState<{ open: boolean; name: string; id?: string }>({ open: false, name: "" });

  useEffect(() => { fetch("/api/admin/members").then(r => r.json()).then(d => setMembers(d.members ?? [])); }, []);
  useEffect(() => { refreshTemplates(); }, []);

  async function refreshTemplates() {
    try {
      const d = await fetch("/api/admin/email/templates").then(r => r.json());
      setTemplates(d.templates ?? []);
    } catch {}
  }

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || (m.display_name ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q);
      const matchRole = filterRole === "all" || m.role === filterRole;
      return matchSearch && matchRole && m.email;
    });
  }, [members, search, filterRole]);

  const previewName = selected[0]?.display_name ?? "Sample Fan";
  const previewSubject = applyVars(subject, { name: previewName });
  const previewHtml    = applyVars(html,    { name: previewName, email: selected[0]?.email ?? "" });
  const dirty = activeTplId && templates.find(t => t.id === activeTplId) && (templates.find(t => t.id === activeTplId)!.subject !== subject || templates.find(t => t.id === activeTplId)!.html !== html);

  function loadTemplate(t: Tpl) {
    setActiveTplId(t.id);
    setSubject(t.subject);
    setHtml(t.html);
    setError(""); setSuccess("");
  }
  function clearCompose() { setActiveTplId(null); setSubject(""); setHtml(DEFAULT_HTML); }
  function toggleMember(m: any) { setSelected(prev => prev.find(s => s.id === m.id) ? prev.filter(s => s.id !== m.id) : [...prev, m]); }
  function selectAll() { setSelected(filteredMembers); }
  function clearAll() { setSelected([]); }

  async function handleSend() {
    if (!selected.length) return setError("Select at least one recipient.");
    if (!subject.trim() || !html.trim()) return setError("Subject and HTML body are required.");
    setSending(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: selected.map(m => ({ email: m.email, name: m.display_name })),
          subject: subject.trim(),
          html: html,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setSuccess(`Sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}${data.errors?.length ? ` · ${data.errors.length} failed` : ""}.`);
      setSelected([]);
    } catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  }

  async function saveAsNew() {
    if (!saveDialog.name.trim()) return setError("Template name required.");
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveDialog.name.trim(), subject, html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Template "${data.template.name}" saved.`);
      setSaveDialog({ open: false, name: "" });
      await refreshTemplates();
      setActiveTplId(data.template.id);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function updateExisting() {
    if (!activeTplId) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/email/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeTplId, subject, html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Template updated.");
      await refreshTemplates();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function deleteTemplate(id: string) {
    const tpl = templates.find(t => t.id === id);
    if (!tpl) return;
    if (!confirm(`Delete "${tpl.name}"? This can't be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/email/templates?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (activeTplId === id) clearCompose();
      await refreshTemplates();
      setSuccess(`Deleted "${tpl.name}".`);
    } catch (e: any) { setError(e.message); }
  }

  const inp: React.CSSProperties = { width: "100%", background: "#F7FAF5", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "10px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" };
  const label: React.CSSProperties = { fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginBottom: "6px", display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <style>{`
        @media (max-width: 1200px) {
          .se-layout { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .se-editor-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <Link href="/admin/emails" style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", textDecoration: "none" }}>← All email tools</Link>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginTop: "4px" }}>SEND EMAIL</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Compose custom emails to any group of members. Save reusable templates for later.</p>
        </div>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "8px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", alignItems: "center", gap: "8px" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {success && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "8px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", alignItems: "center", gap: "8px" }}><IconCheck size={13} color="#156530" /> {success}</div>}

      {/* ── TEMPLATE LIBRARY ── */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>TEMPLATE LIBRARY</div>
          <div style={{ display: "flex", gap: "6px" }}>
            {activeTplId && !templates.find(t => t.id === activeTplId)?.is_builtin && (
              <button onClick={updateExisting} disabled={!dirty || saving}
                style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: dirty ? "#1A8040" : "#B7CDB7", border: "none", borderRadius: "8px", padding: "7px 12px", cursor: dirty ? "pointer" : "not-allowed", letterSpacing: "1.2px" }}>
                {saving ? "SAVING…" : "SAVE CHANGES"}
              </button>
            )}
            <button onClick={() => setSaveDialog({ open: true, name: "" })}
              style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1B3A2D", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
              + SAVE AS NEW
            </button>
            <button onClick={clearCompose}
              style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
              BLANK
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {templates.map(t => {
            const active = t.id === activeTplId;
            return (
              <div key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: active ? "#E8F0E4" : "#F7FAF5", border: `1.5px solid ${active ? "#1A8040" : "#DDE8DD"}`, borderRadius: "10px", padding: "6px 10px 6px 12px" }}>
                <button onClick={() => loadTemplate(t)}
                  style={{ fontFamily: B, fontSize: "12px", fontWeight: 600, color: active ? "#1A8040" : "#1B3A2D", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                  {t.name}
                </button>
                {t.is_builtin && <span style={{ fontFamily: SG, fontSize: "8px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: "999px", padding: "1px 6px", letterSpacing: "1px" }}>BUILT-IN</span>}
                {!t.is_builtin && (
                  <button onClick={() => deleteTemplate(t.id)} title="Delete template"
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center" }}>
                    <IconTrash size={11} color="#CC3344" />
                  </button>
                )}
              </div>
            );
          })}
          {templates.length === 0 && <span style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>No saved templates yet.</span>}
        </div>
      </div>

      <div className="se-layout" style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "18px", alignItems: "start" }}>

        {/* ── RECIPIENTS ── */}
        <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", position: "sticky", top: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>RECIPIENTS</div>
            <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: selected.length ? "#1A8040" : "#7A8E7A", letterSpacing: "1.2px", background: selected.length ? "#E8F0E4" : "#F2F7F2", borderRadius: "999px", padding: "3px 10px" }}>
              {selected.length} SELECTED
            </span>
          </div>

          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {["all", "sponsor", "admin", "moderator", "member"].map(r => {
              const active = filterRole === r;
              const color = ROLE_COLORS[r] ?? "#1A8040";
              return (
                <button key={r} onClick={() => setFilterRole(r)}
                  style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, padding: "4px 9px", borderRadius: "999px", border: `1.5px solid ${active ? color : "transparent"}`, background: active ? color + "15" : "#F2F7F2", color: active ? color : "#5A7A60", cursor: "pointer", letterSpacing: "1.2px" }}>
                  {r.toUpperCase()}
                </button>
              );
            })}
          </div>

          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email…" style={inp} />

          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={selectAll} style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", color: "#1B3A2D", padding: "5px 10px", cursor: "pointer", letterSpacing: "1.2px" }}>SELECT ALL ({filteredMembers.length})</button>
            <button onClick={clearAll} style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "6px", color: "#5A7A60", padding: "5px 10px", cursor: "pointer", letterSpacing: "1.2px" }}>CLEAR</button>
          </div>

          <div style={{ maxHeight: "440px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px", borderTop: "1px solid #F0F5F0", paddingTop: "8px" }}>
            {filteredMembers.map(m => {
              const isSelected = !!selected.find(s => s.id === m.id);
              const color = ROLE_COLORS[m.role] ?? "#1A8040";
              return (
                <div key={m.id} onClick={() => toggleMember(m)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", cursor: "pointer", background: isSelected ? "#E8F0E4" : "transparent", border: `1.5px solid ${isSelected ? "#1A8040" : "transparent"}`, transition: "background 0.15s" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: `1.5px solid ${isSelected ? "#1A8040" : "#B7CDB7"}`, background: isSelected ? "#1A8040" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isSelected && <IconCheck size={9} color="#FFFFFF" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.display_name}</div>
                    <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
                  </div>
                  <span style={{ fontFamily: SG, fontSize: "8px", fontWeight: 700, color, background: color + "15", borderRadius: "999px", padding: "2px 7px", letterSpacing: "1px", flexShrink: 0 }}>{m.role?.toUpperCase()}</span>
                </div>
              );
            })}
            {filteredMembers.length === 0 && <div style={{ padding: "20px", textAlign: "center", fontFamily: B, fontSize: "12px", color: "#7A8E7A" }}>No members match.</div>}
          </div>
        </div>

        {/* ── COMPOSE + PREVIEW ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="se-editor-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {/* Editor */}
            <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={label}>SUBJECT</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Thank you, {{name}}!" style={inp} />
              </div>
              <div>
                <label style={label}>HTML BODY</label>
                <textarea value={html} onChange={e => setHtml(e.target.value)} spellCheck={false}
                  style={{ ...inp, minHeight: "420px", resize: "vertical", fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "12px", lineHeight: 1.55, whiteSpace: "pre" as const }} />
              </div>
              <div style={{ background: "#F7FAF5", border: "1px solid #DDE8DD", borderRadius: "8px", padding: "10px 12px", fontFamily: B, fontSize: "11px", color: "#5A7A60", lineHeight: 1.6 }}>
                <strong style={{ color: "#1A8040" }}>Variables:</strong> use <code style={{ background: "#E8F0E4", padding: "1px 5px", borderRadius: "4px" }}>{"{{name}}"}</code> to insert each recipient&apos;s display name. Legacy <code style={{ background: "#E8F0E4", padding: "1px 5px", borderRadius: "4px" }}>[NAME]</code> still works.
              </div>
            </div>

            {/* Preview */}
            <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: "520px" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #E4EDE4", background: "#F7FAF5" }}>
                <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>PREVIEW · sample name: {previewName}</div>
                <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", marginTop: "4px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{previewSubject || <span style={{ color: "#B7CDB7" }}>Subject preview…</span>}</div>
              </div>
              <iframe srcDoc={previewHtml} sandbox="" title="Email preview"
                style={{ flex: 1, width: "100%", border: "none", background: "#F0F0F0", minHeight: "420px" }} />
            </div>
          </div>

          {/* Send */}
          <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>
              Sending to <strong style={{ color: selected.length ? "#1A8040" : "#CC3344" }}>{selected.length}</strong> recipient{selected.length !== 1 ? "s" : ""}.
            </div>
            <button onClick={handleSend} disabled={sending || !selected.length || !subject.trim() || !html.trim()}
              style={{ fontFamily: R, fontSize: "13px", color: "#ffffff", background: sending || !selected.length || !subject.trim() || !html.trim() ? "#B7CDB7" : "#1A8040", border: "none", borderRadius: "10px", padding: "12px 22px", cursor: sending ? "wait" : "pointer", letterSpacing: "2px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <IconSend size={13} color="#ffffff" /> {sending ? "SENDING…" : `SEND EMAIL`}
            </button>
          </div>
        </div>
      </div>

      {/* Save as new dialog */}
      {saveDialog.open && (
        <div onClick={() => setSaveDialog({ open: false, name: "" })} style={{ position: "fixed", inset: 0, background: "rgba(15,42,30,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "24px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", borderRadius: "14px", padding: "22px", width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "2px" }}>SAVE AS TEMPLATE</div>
            <label style={label}>NAME</label>
            <input autoFocus value={saveDialog.name} onChange={e => setSaveDialog({ ...saveDialog, name: e.target.value })} placeholder="e.g. Sponsor Perks Reminder" style={inp} />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "6px" }}>
              <button onClick={() => setSaveDialog({ open: false, name: "" })} style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "9px 14px", cursor: "pointer", letterSpacing: "1.2px" }}>CANCEL</button>
              <button onClick={saveAsNew} disabled={saving || !saveDialog.name.trim()}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: !saveDialog.name.trim() ? "#B7CDB7" : "#1A8040", border: "none", borderRadius: "8px", padding: "9px 18px", cursor: saving ? "wait" : "pointer", letterSpacing: "1.2px" }}>
                {saving ? "SAVING…" : "SAVE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
