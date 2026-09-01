"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconCheck, IconWarning, IconUsers, IconDownload, IconSend, IconShield } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const ROLES = ["super_admin", "admin", "moderator", "sponsor", "member"];
const ROLE_COLORS: Record<string, string> = {
  super_admin: "#5A1E7A", admin: "#1A8040", moderator: "#5A7A60", sponsor: "#B78A1F", member: "#4A7C59",
};

interface Member {
  id: string; display_name?: string; email?: string; role?: string; is_banned?: boolean; avatar_url?: string; created_at?: string;
}

type Panel = "role" | "email" | "ban" | "unban" | "export" | null;

export default function BulkMembersPage() {
  const [members, setMembers]   = useState<Member[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [status, setStatus]     = useState("");
  const [search, setSearch]     = useState("");
  const [roleFilter, setRole]   = useState<string>("all");
  const [bannedOnly, setBanned] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [panel, setPanel]       = useState<Panel>(null);
  const [working, setWorking]   = useState(false);

  const [roleAssign, setRoleAssign] = useState("member");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailHtml,    setEmailHtml]    = useState("");

  useEffect(() => {
    fetch("/api/admin/members").then(r => r.json()).then(d => setMembers(d.members ?? [])).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter(m => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (bannedOnly && !m.is_banned) return false;
      if (!q) return true;
      return (m.display_name ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    });
  }, [members, search, roleFilter, bannedOnly]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(m => selected.has(m.id));

  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const selectAllFiltered = () => setSelected(prev => { const n = new Set(prev); for (const m of filtered) n.add(m.id); return n; });
  const clearAll = () => setSelected(new Set());
  const invert = () => setSelected(prev => {
    const n = new Set<string>();
    for (const m of filtered) if (!prev.has(m.id)) n.add(m.id);
    Array.from(prev).forEach(id => { if (!filtered.find(m => m.id === id)) n.add(id); });
    return n;
  });

  const selectedIds = Array.from(selected);
  const selectedCount = selectedIds.length;

  async function run(body: any, opts?: { downloadCsv?: boolean }) {
    setWorking(true); setError(""); setStatus("");
    try {
      const r = await fetch("/api/super/bulk-members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, member_ids: selectedIds }) });
      if (opts?.downloadCsv) {
        if (!r.ok) { const d = await r.json(); throw new Error(d.error ?? "Export failed"); }
        const blob = await r.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a"); a.href = url; a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        setStatus(`Downloaded CSV of ${selectedCount} members.`);
      } else {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Failed");
        setStatus(summariseResult(body.action, d));
        // Refresh member list to reflect role/ban changes
        if (body.action === "assign_role" || body.action === "ban" || body.action === "unban") {
          fetch("/api/admin/members").then(r => r.json()).then(d => setMembers(d.members ?? []));
        }
      }
      setPanel(null);
    } catch (e: any) { setError(e.message); }
    finally { setWorking(false); }
  }

  function summariseResult(action: string, d: any) {
    if (action === "assign_role") return `Updated ${d.updated} member${d.updated === 1 ? "" : "s"}${d.skipped_self ? ` (skipped self)` : ""}.`;
    if (action === "ban")         return `Banned ${d.updated} member${d.updated === 1 ? "" : "s"}${d.skipped_self ? ` (skipped self)` : ""}.`;
    if (action === "unban")       return `Unbanned ${d.updated} member${d.updated === 1 ? "" : "s"}.`;
    if (action === "email")       return `Sent ${d.sent} email${d.sent === 1 ? "" : "s"}${d.failed ? ` · ${d.failed} failed` : ""}${d.missing_email ? ` · ${d.missing_email} without email` : ""}.`;
    return "Done.";
  }

  const inp: React.CSSProperties = { background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "9px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "18px 20px" }}>
        <Link href="/super" style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>← COMMAND CENTER</Link>
        <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#156530", letterSpacing: "2.5px", marginTop: "4px" }}>BULK MEMBER ACTIONS</h1>
        <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "2px" }}>Multi-select members and apply an action to the whole selection. Super admin only.</p>
      </div>

      {/* Filter + selection bar */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "14px 16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / email / ID…" style={{ ...inp, flex: 1, minWidth: "180px" }} />
        <select value={roleFilter} onChange={e => setRole(e.target.value)} style={{ ...inp, cursor: "pointer", minWidth: "140px" }}>
          <option value="all">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: B, fontSize: "12px", color: "#5A7A60", cursor: "pointer" }}>
          <input type="checkbox" checked={bannedOnly} onChange={e => setBanned(e.target.checked)} style={{ width: "14px", height: "14px", cursor: "pointer" }} />
          Banned only
        </label>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px", alignItems: "center" }}>
          <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.2px" }}>
            {selectedCount} SELECTED · {filtered.length} FILTERED / {members.length} TOTAL
          </span>
          <button onClick={selectAllFiltered} disabled={allFilteredSelected}
            style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#1B3A2D", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "5px 9px", cursor: "pointer", letterSpacing: "1.2px" }}>SELECT ALL</button>
          <button onClick={invert}
            style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#1B3A2D", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "5px 9px", cursor: "pointer", letterSpacing: "1.2px" }}>INVERT</button>
          <button onClick={clearAll} disabled={selectedCount === 0}
            style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "5px 9px", cursor: "pointer", letterSpacing: "1.2px" }}>CLEAR</button>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "14px", padding: "12px 14px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#7A5A0F", letterSpacing: "1.5px" }}>ACTIONS →</div>
        <button onClick={() => setPanel("role")} disabled={selectedCount === 0}
          style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A1E7A", background: "#F0E4F8", border: "1.5px solid transparent", borderRadius: "8px", padding: "7px 12px", cursor: selectedCount ? "pointer" : "not-allowed", opacity: selectedCount ? 1 : 0.5, letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <IconShield size={11} color="#5A1E7A" /> ASSIGN ROLE
        </button>
        <button onClick={() => setPanel("email")} disabled={selectedCount === 0}
          style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1E4A7A", background: "#E4EEF8", border: "1.5px solid transparent", borderRadius: "8px", padding: "7px 12px", cursor: selectedCount ? "pointer" : "not-allowed", opacity: selectedCount ? 1 : 0.5, letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <IconSend size={11} color="#1E4A7A" /> EMAIL
        </button>
        <button onClick={() => setPanel("ban")} disabled={selectedCount === 0}
          style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", border: "1.5px solid transparent", borderRadius: "8px", padding: "7px 12px", cursor: selectedCount ? "pointer" : "not-allowed", opacity: selectedCount ? 1 : 0.5, letterSpacing: "1.2px" }}>
          BAN
        </button>
        <button onClick={() => setPanel("unban")} disabled={selectedCount === 0}
          style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#156530", background: "#E8F0E4", border: "1.5px solid transparent", borderRadius: "8px", padding: "7px 12px", cursor: selectedCount ? "pointer" : "not-allowed", opacity: selectedCount ? 1 : 0.5, letterSpacing: "1.2px" }}>
          UNBAN
        </button>
        <button onClick={() => setPanel("export")} disabled={selectedCount === 0}
          style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1B3A2D", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "7px 12px", cursor: selectedCount ? "pointer" : "not-allowed", opacity: selectedCount ? 1 : 0.5, letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <IconDownload size={11} color="#1B3A2D" /> EXPORT CSV
        </button>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {/* Member list */}
      <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden", maxHeight: "560px", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#F7FAF5", padding: "8px 16px", borderBottom: "1px solid #E4EDE4", display: "grid", gridTemplateColumns: "28px 1.6fr 1.4fr 0.8fr 0.6fr", gap: "8px", alignItems: "center" }}>
          <input type="checkbox" checked={allFilteredSelected && filtered.length > 0} onChange={() => allFilteredSelected ? clearAll() : selectAllFiltered()} style={{ width: "14px", height: "14px", cursor: "pointer" }} />
          <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>NAME</span>
          <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>EMAIL</span>
          <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>ROLE</span>
          <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", textAlign: "right" }}>STATUS</span>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {loading ? <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
          : filtered.length === 0 ? <div style={{ padding: "48px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>No members match.</div>
          : filtered.map((m, i) => {
              const isSelected = selected.has(m.id);
              const c = ROLE_COLORS[m.role ?? "member"] ?? "#5A7A60";
              return (
                <div key={m.id} onClick={() => toggle(m.id)}
                  style={{ padding: "8px 16px", borderTop: "1px solid #F0F5F0", background: isSelected ? "#E8F0E4" : (i % 2 === 0 ? "#ffffff" : "#FBFDFB"), display: "grid", gridTemplateColumns: "28px 1.6fr 1.4fr 0.8fr 0.6fr", gap: "8px", alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={isSelected} readOnly style={{ width: "14px", height: "14px", pointerEvents: "none" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#F2F7F2", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60" }}>{(m.display_name ?? "?")[0]?.toUpperCase()}</span>}
                    </div>
                    <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.display_name ?? m.id}</span>
                  </div>
                  <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email ?? "—"}</span>
                  <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: c, background: c + "15", borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px", width: "fit-content" }}>{(m.role ?? "member").toUpperCase()}</span>
                  <span style={{ textAlign: "right" }}>
                    {m.is_banned && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#8A1E27", background: "#FFE8EC", borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px" }}>BANNED</span>}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Action panels */}
      {panel && (
        <div onClick={() => setPanel(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,42,30,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 998, padding: "24px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", borderRadius: "14px", padding: "22px", width: "100%", maxWidth: "540px", maxHeight: "85vh", overflow: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: R, fontSize: "1.1rem", color: "#1B3A2D", letterSpacing: "2px" }}>{panel.toUpperCase()} · {selectedCount}</div>
              <button onClick={() => setPanel(null)} style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "8px", width: "30px", height: "30px", cursor: "pointer", fontFamily: SG, fontWeight: 700, color: "#5A7A60" }}>✕</button>
            </div>

            {panel === "role" && (<>
              <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: 0 }}>Assign this role to <strong>{selectedCount}</strong> selected member{selectedCount === 1 ? "" : "s"}. Your own account is skipped automatically.</p>
              <select value={roleAssign} onChange={e => setRoleAssign(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select>
              <button onClick={() => { if (!confirm(`Assign role "${roleAssign}" to ${selectedCount} member${selectedCount === 1 ? "" : "s"}?`)) return; run({ action: "assign_role", role: roleAssign }); }} disabled={working}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#5A1E7A", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: working ? "wait" : "pointer", letterSpacing: "1.2px" }}>
                {working ? "APPLYING…" : `ASSIGN "${roleAssign.toUpperCase()}"`}
              </button>
            </>)}

            {panel === "email" && (<>
              <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: 0 }}>Emails <strong>{selectedCount}</strong> selected member{selectedCount === 1 ? "" : "s"}. Members without a stored email are skipped. Use <code>{"{{name}}"}</code> for personalisation.</p>
              <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject line" style={inp} />
              <textarea value={emailHtml} onChange={e => setEmailHtml(e.target.value)} placeholder="HTML body — full markup, no wrapper is added" style={{ ...inp, minHeight: "200px", resize: "vertical" as const, fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "12px" }} />
              <button onClick={() => { if (!confirm(`Send this email to ${selectedCount} member${selectedCount === 1 ? "" : "s"}? This can't be undone.`)) return; run({ action: "email", subject: emailSubject, html: emailHtml }); }} disabled={working || !emailSubject.trim() || !emailHtml.trim()}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1E4A7A", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: working ? "wait" : "pointer", letterSpacing: "1.2px", opacity: (!emailSubject.trim() || !emailHtml.trim()) ? 0.5 : 1 }}>
                {working ? "SENDING…" : `SEND TO ${selectedCount}`}
              </button>
            </>)}

            {panel === "ban" && (<>
              <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "12px 14px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <IconWarning size={16} color="#8A1E27" />
                <div style={{ fontFamily: B, fontSize: "12px", color: "#8A1E27", lineHeight: 1.5 }}>
                  You're about to <strong>ban</strong> {selectedCount} member{selectedCount === 1 ? "" : "s"}. They'll be locked out of the site until unbanned. Your own account is skipped automatically.
                </div>
              </div>
              <button onClick={() => { if (!confirm(`BAN ${selectedCount} member${selectedCount === 1 ? "" : "s"}?`)) return; run({ action: "ban" }); }} disabled={working}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#8A1E27", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: working ? "wait" : "pointer", letterSpacing: "1.2px" }}>
                {working ? "APPLYING…" : `BAN ${selectedCount}`}
              </button>
            </>)}

            {panel === "unban" && (<>
              <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: 0 }}>Unban <strong>{selectedCount}</strong> selected member{selectedCount === 1 ? "" : "s"}. Members who weren't banned are unaffected.</p>
              <button onClick={() => run({ action: "unban" })} disabled={working}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#156530", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: working ? "wait" : "pointer", letterSpacing: "1.2px" }}>
                {working ? "APPLYING…" : `UNBAN ${selectedCount}`}
              </button>
            </>)}

            {panel === "export" && (<>
              <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: 0 }}>Downloads a CSV of the <strong>{selectedCount}</strong> selected member{selectedCount === 1 ? "" : "s"}: id, display_name, email, role, is_banned, created_at.</p>
              <button onClick={() => run({ action: "export" }, { downloadCsv: true })} disabled={working}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 16px", cursor: working ? "wait" : "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                <IconDownload size={12} color="#1B3A2D" /> {working ? "PREPARING…" : "DOWNLOAD CSV"}
              </button>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}
