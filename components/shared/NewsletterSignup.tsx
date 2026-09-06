"use client";
import { useState } from "react";

const R  = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

export default function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const [email, setEmail]   = useState("");
  const [busy, setBusy]     = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "already" | "err">("idle");
  const [msg, setMsg]       = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true); setStatus("idle"); setMsg("");
    try {
      const r = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.already) { setStatus("already"); setMsg("You're already on the list — thank you!"); }
      else if (d.resubscribed) { setStatus("ok"); setMsg("Welcome back! You're subscribed again."); }
      else { setStatus("ok"); setMsg("Thanks! You'll hear from us soon."); }
      setEmail("");
    } catch (e: any) {
      setStatus("err"); setMsg(e.message ?? "Something went wrong.");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 420 }}>
      <div style={{ display: "flex", gap: 6, width: "100%", background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 12, padding: 4, boxShadow: "0 2px 8px rgba(15,42,30,0.05)" }}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" required disabled={busy}
          style={{ flex: 1, background: "transparent", border: "none", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: 13, outline: "none" }} />
        <button type="submit" disabled={busy} className="btn-fx btn-fx-primary"
          style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#FFFFFF", background: "#1B3A2D", border: "none", borderRadius: 9, padding: "9px 18px", cursor: busy ? "wait" : "pointer", letterSpacing: 1.3, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
          {busy ? "…" : "SUBSCRIBE"}
        </button>
      </div>
      {msg && (
        <div style={{ fontFamily: B, fontSize: 12, color: status === "err" ? "#CC3344" : "#1A8040" }}>{msg}</div>
      )}
    </form>
  );
}
