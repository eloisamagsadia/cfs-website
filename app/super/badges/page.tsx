"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconCheck, IconTrash, IconEdit, IconX, IconStar, IconUsers } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  trigger_type: string;
  threshold_value: number | null;
  holder_count: number;
}

interface Holder {
  id: string;
  user_id: string;
  earned_at: string;
  profiles?: { id: string; display_name?: string; avatar_url?: string } | null;
}

interface Member {
  id: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
}

const TRIGGERS = [
  { value: "manual",          label: "Manual (grant one-off)" },
  { value: "event_count",     label: "Event attendance count" },
  { value: "donation_amount", label: "Donation amount (₱)" },
  { value: "post_count",      label: "Community post count" },
  { value: "signup",          label: "Signup / welcome" },
];

const BLANK_BADGE = { name: "", description: "", icon_url: "", trigger_type: "manual", threshold_value: "" };

export default function BadgesPage() {
  const [badges, setBadges]   = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [status, setStatus]   = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft]     = useState<any>(BLANK_BADGE);

  // Grant dialog
  const [grantBadge, setGrantBadge] = useState<Badge | null>(null);
  const [holders, setHolders]       = useState<Holder[]>([]);
  const [members, setMembers]       = useState<Member[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [granting, setGranting]     = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/super/badges");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setBadges(d.badges ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!grantBadge) return;
    // Load holders + full member list (for search)
    fetch(`/api/super/badges?badge_id=${grantBadge.id}`).then(r => r.json()).then(d => setHolders(d.holders ?? [])).catch(() => {});
    fetch("/api/admin/members").then(r => r.json()).then(d => setMembers(d.members ?? [])).catch(() => {});
  }, [grantBadge?.id]);

  async function create() {
    if (!draft.name.trim()) return setError("Name required.");
    setError(""); setStatus("");
    try {
      const r = await fetch("/api/super/badges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(`Created "${d.badge.name}".`);
      setDraft(BLANK_BADGE); setCreating(false);
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function save(id: string) {
    if (!draft.name.trim()) return setError("Name required.");
    setError(""); setStatus("");
    try {
      const r = await fetch("/api/super/badges", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...draft }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEditingId(null); setDraft(BLANK_BADGE);
      setStatus("Saved.");
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function remove(badge: Badge) {
    if (badge.holder_count > 0) {
      if (!confirm(`"${badge.name}" is held by ${badge.holder_count} member${badge.holder_count === 1 ? "" : "s"}. Delete anyway? All grants will be removed.`)) return;
    } else if (!confirm(`Delete "${badge.name}"?`)) return;
    setError(""); setStatus("");
    try {
      const r = await fetch(`/api/super/badges?id=${badge.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(`Deleted "${badge.name}".`);
      load();
    } catch (e: any) { setError(e.message); }
  }

  async function grant(userId: string) {
    if (!grantBadge) return;
    setGranting(true); setError(""); setStatus("");
    try {
      const r = await fetch("/api/super/badges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "grant", user_id: userId, badge_id: grantBadge.id }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStatus(d.already ? "Already granted." : `Granted to member.`);
      // Refresh holders
      fetch(`/api/super/badges?badge_id=${grantBadge.id}`).then(r => r.json()).then(d => setHolders(d.holders ?? []));
      load();
    } catch (e: any) { setError(e.message); }
    finally { setGranting(false); }
  }

  async function revoke(holder: Holder) {
    if (!confirm(`Revoke "${grantBadge?.name}" from ${holder.profiles?.display_name ?? holder.user_id}?`)) return;
    try {
      const r = await fetch(`/api/super/badges?user_badge_id=${holder.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error);
      setHolders(holders.filter(h => h.id !== holder.id));
      setStatus("Revoked.");
      load();
    } catch (e: any) { setError(e.message); }
  }

  const memberResults = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    const holderIds = new Set(holders.map(h => h.user_id));
    return members
      .filter(m => !holderIds.has(m.id))
      .filter(m => {
        if (!q) return true;
        return (m.display_name ?? "").toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
      })
      .slice(0, 12);
  }, [members, holders, memberQuery]);

  const inp: React.CSSProperties = { background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" as const };
  const label: React.CSSProperties = { fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginBottom: "4px", display: "block" };

  const editorForm = (isCreate: boolean) => (
    <div style={{ background: "#F7FAF5", border: "1.5px solid #B7D8B7", borderRadius: "10px", padding: "14px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
      <div><label style={label}>NAME</label><input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} style={inp} placeholder="Sponsor" /></div>
      <div>
        <label style={label}>TRIGGER</label>
        <select value={draft.trigger_type} onChange={e => setDraft({ ...draft, trigger_type: e.target.value })} style={{ ...inp, cursor: "pointer" }}>
          {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      {draft.trigger_type !== "manual" && (
        <div><label style={label}>THRESHOLD</label><input type="number" min="0" value={draft.threshold_value} onChange={e => setDraft({ ...draft, threshold_value: e.target.value })} style={inp} placeholder="e.g. 5" /></div>
      )}
      <div><label style={label}>ICON URL</label><input value={draft.icon_url} onChange={e => setDraft({ ...draft, icon_url: e.target.value })} style={inp} placeholder="https://…" /></div>
      <div style={{ gridColumn: "1 / -1" }}><label style={label}>DESCRIPTION</label><textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} style={{ ...inp, minHeight: "60px", resize: "vertical" as const }} /></div>
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
        <button onClick={() => { if (isCreate) { setDraft(BLANK_BADGE); setCreating(false); } else { setEditingId(null); setDraft(BLANK_BADGE); } }}
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
          <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#156530", letterSpacing: "2.5px", marginTop: "4px" }}>BADGES</h1>
          <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", marginTop: "2px" }}>Manage the badge catalog and grant / revoke badges to specific members.</p>
        </div>
        {!creating && !editingId && (
          <button onClick={() => { setCreating(true); setDraft(BLANK_BADGE); }}
            style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px" }}>+ NEW BADGE</button>
        )}
      </div>

      {creating && editorForm(true)}
      {error  && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : badges.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "48px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>No badges yet. Click <strong>+ NEW BADGE</strong> to create one.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {badges.map(b => (
            <div key={b.id} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", padding: "16px" }}>
              {editingId === b.id ? editorForm(false) : (
                <>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#FFF3D6", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {b.icon_url ? <img src={b.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <IconStar size={20} color="#B78A1F" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1px" }}>{b.name}</div>
                      <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: "4px", padding: "1px 6px", letterSpacing: "1.2px", display: "inline-block", marginTop: "3px" }}>
                        {b.trigger_type.toUpperCase().replace(/_/g, " ")}{b.threshold_value ? ` ≥ ${b.threshold_value}` : ""}
                      </div>
                    </div>
                  </div>
                  {b.description && <div style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", lineHeight: 1.5, marginTop: "10px" }}>{b.description}</div>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #E4EDE4" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040" }}>
                      <IconUsers size={11} color="#1A8040" /> {b.holder_count} holder{b.holder_count === 1 ? "" : "s"}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={() => setGrantBadge(b)} title="Grant / Revoke"
                        style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#1A8040", background: "#E8F0E4", border: "1.5px solid transparent", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", letterSpacing: "1.2px" }}>MANAGE</button>
                      <button onClick={() => { setEditingId(b.id); setDraft({ name: b.name, description: b.description ?? "", icon_url: b.icon_url ?? "", trigger_type: b.trigger_type, threshold_value: b.threshold_value != null ? String(b.threshold_value) : "" }); }} title="Edit"
                        style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <IconEdit size={12} color="#5A7A60" />
                      </button>
                      <button onClick={() => remove(b)} title="Delete"
                        style={{ background: "#FFE8EC", border: "1px solid #CC334440", borderRadius: "6px", width: "28px", height: "28px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <IconTrash size={12} color="#CC3344" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Grant dialog */}
      {grantBadge && (
        <div onClick={() => setGrantBadge(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,42,30,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 998, padding: "24px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", borderRadius: "14px", padding: "22px", width: "100%", maxWidth: "580px", maxHeight: "85vh", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px" }}>GRANT / REVOKE</div>
                <h2 style={{ fontFamily: R, fontSize: "1.2rem", color: "#1B3A2D", letterSpacing: "2px", margin: "2px 0 0" }}>{grantBadge.name.toUpperCase()}</h2>
              </div>
              <button onClick={() => setGrantBadge(null)} style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontFamily: SG, fontWeight: 700, color: "#5A7A60" }}>✕</button>
            </div>

            {/* Current holders */}
            <div>
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginBottom: "6px" }}>CURRENT HOLDERS ({holders.length})</div>
              <div style={{ maxHeight: "160px", overflow: "auto", background: "#F7FAF5", border: "1px solid #E4EDE4", borderRadius: "8px", padding: "6px" }}>
                {holders.length === 0 ? <div style={{ padding: "14px", textAlign: "center", fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>No holders yet.</div>
                : holders.map(h => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 10px" }}>
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#E8F0E4", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {h.profiles?.avatar_url ? <img src={h.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1A8040" }}>{(h.profiles?.display_name ?? "?")[0]?.toUpperCase()}</span>}
                    </div>
                    <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.profiles?.display_name ?? h.user_id}</span>
                    <button onClick={() => revoke(h)} style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#CC3344", background: "transparent", border: "1px solid #CC334440", borderRadius: "6px", padding: "3px 8px", cursor: "pointer", letterSpacing: "1px" }}>REVOKE</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Grant search */}
            <div>
              <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", marginBottom: "6px" }}>GRANT TO MEMBER</div>
              <input value={memberQuery} onChange={e => setMemberQuery(e.target.value)} placeholder="Search name or email…" style={{ ...inp, width: "100%" }} />
              <div style={{ maxHeight: "220px", overflow: "auto", background: "#F7FAF5", border: "1px solid #E4EDE4", borderRadius: "8px", padding: "6px", marginTop: "6px" }}>
                {memberResults.length === 0
                  ? <div style={{ padding: "14px", textAlign: "center", fontFamily: B, fontSize: "11px", color: "#7A8E7A" }}>{memberQuery ? "No matches." : "Type to search."}</div>
                  : memberResults.map(m => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 10px" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#F2F7F2", overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60" }}>{(m.display_name ?? "?")[0]?.toUpperCase()}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.display_name ?? m.id}</div>
                        <div style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email ?? ""}</div>
                      </div>
                      <button onClick={() => grant(m.id)} disabled={granting} style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: "6px", padding: "5px 10px", cursor: granting ? "wait" : "pointer", letterSpacing: "1px" }}>GRANT</button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
