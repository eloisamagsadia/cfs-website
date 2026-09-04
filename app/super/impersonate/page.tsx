"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconUser, IconWarning, IconLightning } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Member = {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
};

export default function ImpersonatePage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [q, setQ]             = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Member | null>(null);
  const [reason, setReason]   = useState("");
  const [activeStatus, setActiveStatus] = useState<{ active: boolean; target_label?: string | null } | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/members?limit=500", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      setMembers(data.members ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function loadStatus() {
    try {
      const r = await fetch("/api/super/impersonate", { cache: "no-store" });
      const d = await r.json();
      setActiveStatus(d);
    } catch {}
  }

  useEffect(() => { load(); loadStatus(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return members.slice(0, 50);
    return members.filter(m =>
      (m.display_name ?? "").toLowerCase().includes(s) ||
      (m.email ?? "").toLowerCase().includes(s) ||
      m.id.toLowerCase().includes(s)
    ).slice(0, 50);
  }, [q, members]);

  async function impersonate() {
    if (!confirmTarget) return;
    setBusy(confirmTarget.id); setError("");
    try {
      const res = await fetch("/api/super/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: confirmTarget.id, reason: reason.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impersonation failed");
      setConfirmTarget(null);
      setReason("");
      // Land on the members dashboard, which now reads the effective user
      router.push("/members");
      router.refresh();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function stop() {
    try {
      await fetch("/api/super/impersonate", { method: "DELETE" });
      setActiveStatus({ active: false });
      router.refresh();
    } catch {}
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", margin: 0 }}>SIGN IN AS…</h1>
        <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "4px 0 0" }}>
          Enter a member's view without leaving your admin session. Your identity stays intact — the switch is a signed cookie the server uses to swap the effective user on member pages. Every use is audit-logged.
        </p>
      </div>

      {activeStatus?.active && (
        <div style={{ background: "#FFF3D6", border: "1.5px solid #F0D889", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <IconWarning size={16} color="#7A5A0F" />
          <div style={{ flex: 1, fontFamily: B, fontSize: 12, color: "#7A5A0F", lineHeight: 1.5, minWidth: 200 }}>
            You are currently viewing the site as <strong>{activeStatus.target_label ?? "another member"}</strong>. All member pages will show their data.
          </div>
          <button onClick={stop}
            style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#ffffff", background: "#8A1E27", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", letterSpacing: 1.2 }}>
            END SESSION
          </button>
        </div>
      )}

      <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <IconWarning size={16} color="#7A5A0F" />
        <div style={{ fontFamily: B, fontSize: "12px", color: "#7A5A0F", lineHeight: 1.6 }}>
          <strong>Security note:</strong> Impersonation lasts 4 hours max, then auto-expires. Any write action taken during this session is logged with your name as the actor, not the target's. Only use for support/debugging.
        </div>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}

      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, email, or user id…"
        style={{ width: "100%", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "11px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box" }} />

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A", fontSize: "12px" }}>LOADING…</div>
      ) : (
        <div style={{ background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", fontFamily: B, color: "#7A8E7A" }}>No matches.</div>
          ) : filtered.map(m => (
            <div key={m.id} style={{ padding: "12px 16px", borderBottom: "1px solid #F0F4F0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", minWidth: 0, flex: 1 }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#E8F0E4", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt="" width={32} height={32} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                    : <IconUser size={14} color="#4A7C59" />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", fontWeight: 600 }}>{m.display_name ?? "(no name)"}</div>
                  <div style={{ fontFamily: SG, fontSize: "10px", color: "#7A8E7A", letterSpacing: "1px" }}>{m.email ?? m.id.slice(0, 20)} · {m.role ?? "member"}</div>
                </div>
              </div>
              <button onClick={() => setConfirmTarget(m)} disabled={busy === m.id}
                style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#156530", background: "#E8F0E4", border: "1.5px solid #1A804040", borderRadius: "10px", padding: "7px 12px", cursor: busy === m.id ? "wait" : "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                <IconLightning size={10} color="#156530" /> SIGN IN AS
              </button>
            </div>
          ))}
        </div>
      )}

      {confirmTarget && (
        <div onClick={() => setConfirmTarget(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,42,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "16px", padding: "22px", maxWidth: "440px", width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <h2 style={{ fontFamily: R, fontSize: "1.1rem", color: "#1B3A2D", letterSpacing: "2px", margin: 0 }}>SIGN IN AS {(confirmTarget.display_name ?? "USER").toUpperCase()}?</h2>
              <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "6px 0 0", lineHeight: 1.5 }}>
                Member pages will render as if you were them. Your admin session stays alive — click END SESSION to switch back.
              </p>
            </div>
            <div>
              <label style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "1.5px", display: "block", marginBottom: "5px" }}>REASON (optional)</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. debugging failed checkout report from #12345"
                style={{ width: "100%", minHeight: "70px", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "10px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmTarget(null)} style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px" }}>CANCEL</button>
              <button onClick={impersonate} disabled={busy === confirmTarget.id}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#156530", border: "1.5px solid #156530", borderRadius: "10px", padding: "10px 16px", cursor: busy === confirmTarget.id ? "wait" : "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <IconLightning size={11} color="#ffffff" /> {busy === confirmTarget.id ? "OPENING…" : "SIGN IN AS"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
