"use client";
import { useEffect, useMemo, useState } from "react";
import { useClerk } from "@clerk/nextjs";
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
  const { signOut } = useClerk();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Member | null>(null);
  const [reason, setReason] = useState("");
  const [issuedUrl, setIssuedUrl]         = useState<string | null>(null);
  const [issuedFor, setIssuedFor]         = useState<string | null>(null);
  const [issuedExpiresAt, setIssuedExpiresAt] = useState<number | null>(null);
  const [copied, setCopied]               = useState(false);

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

  useEffect(() => { load(); }, []);

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
      // Show the URL for copy-paste into an incognito window. Opening in a
      // same-browser new tab wouldn't work — Clerk session cookies are shared
      // per-origin, so the target session gets rejected in favor of ours.
      setIssuedUrl(data.sign_in_url);
      setIssuedFor(data.target_label ?? confirmTarget.display_name ?? confirmTarget.id);
      setIssuedExpiresAt(Date.now() + ((data.expires_in_seconds ?? 300) * 1000));
      setConfirmTarget(null);
      setReason("");
      setCopied(false);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function copyLink() {
    if (!issuedUrl) return;
    try {
      await navigator.clipboard.writeText(issuedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  // Sign out of our own session, then land on the ticket URL. The
  // callback fires after Clerk clears the cookie, so the ticket takes
  // effect in a clean session state.
  async function swapSession() {
    if (!issuedUrl) return;
    const target = issuedUrl;
    await signOut(() => { window.location.href = target; });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#156530", letterSpacing: "3px", margin: 0 }}>SIGN IN AS…</h1>
        <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "4px 0 0" }}>
          Generate a one-time sign-in link for a target member. Click <strong>SIGN IN AS NOW</strong> to swap into their session in this tab (you'll sign back in as yourself when done), or <strong>COPY LINK</strong> and paste into an incognito window if you want to keep your admin session alive. Every use is audit-logged.
        </p>
      </div>

      <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <IconWarning size={16} color="#7A5A0F" />
        <div style={{ fontFamily: B, fontSize: "12px", color: "#7A5A0F", lineHeight: 1.6 }}>
          <strong>Security note:</strong> This creates a real signed-in session as another user. Only use for support/debugging. Any action taken in that session is billed to the target member — record a reason so the audit trail is meaningful.
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

      {/* Confirmation modal */}
      {confirmTarget && (
        <div onClick={() => setConfirmTarget(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,42,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "16px", padding: "22px", maxWidth: "440px", width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <h2 style={{ fontFamily: R, fontSize: "1.1rem", color: "#1B3A2D", letterSpacing: "2px", margin: 0 }}>SIGN IN AS {(confirmTarget.display_name ?? "USER").toUpperCase()}?</h2>
              <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "6px 0 0", lineHeight: 1.5 }}>
                Opens a signed-in session as this user in a new tab. The action is logged to <code>audit_log</code>.
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

      {/* Issued-link modal: shown after the endpoint returns the ticket URL */}
      {issuedUrl && (
        <div onClick={() => setIssuedUrl(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,42,30,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "16px", padding: "22px", maxWidth: "540px", width: "100%", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <h2 style={{ fontFamily: R, fontSize: "1.1rem", color: "#1B3A2D", letterSpacing: "2px", margin: 0 }}>SIGN-IN LINK READY</h2>
              <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", margin: "6px 0 0", lineHeight: 1.5 }}>
                One-time link for <strong>{issuedFor}</strong>. Expires in ~5 minutes.
              </p>
            </div>

            <div style={{ background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <IconWarning size={14} color="#7A5A0F" />
              <div style={{ fontFamily: B, fontSize: 12, color: "#7A5A0F", lineHeight: 1.55 }}>
                <strong>This replaces your admin session.</strong> Clicking below signs you out and signs you in as <strong>{issuedFor}</strong> in this same tab. When you're done debugging, sign out of that account and back in as yourself.
                <div style={{ marginTop: 6, color: "#5A7A60" }}>Prefer to keep your admin session alive? <strong>COPY LINK</strong> and paste it into an incognito window instead.</div>
              </div>
            </div>

            <div style={{ background: "#F7FAF5", border: "1px solid #DDE8DD", borderRadius: 10, padding: "10px 12px", fontFamily: "monospace", fontSize: 11, color: "#1B3A2D", wordBreak: "break-all", lineHeight: 1.5 }}>
              {issuedUrl}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button onClick={() => setIssuedUrl(null)}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px" }}>
                CANCEL
              </button>
              <button onClick={copyLink}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: copied ? "#ffffff" : "#5A7A60", background: copied ? "#156530" : "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px" }}>
                {copied ? "✓ COPIED" : "COPY LINK"}
              </button>
              <button onClick={swapSession}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: "#156530", border: "none", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", letterSpacing: "1.2px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <IconLightning size={11} color="#ffffff" /> SIGN IN AS NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
