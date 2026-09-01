"use client";
import { useState } from "react";

const R = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

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
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", width: "100%", maxWidth: 380 }}>
      <div style={{ fontFamily: R, fontSize: 10, letterSpacing: 2, color: "#8FBF9F", textAlign: "center" as const }}>STAY IN THE LOOP</div>
      <div style={{ display: "flex", gap: 6, width: "100%" }}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" required disabled={busy}
          style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "9px 12px", color: "#F7FAF5", fontFamily: B, fontSize: 12, outline: "none" }} />
        <button type="submit" disabled={busy}
          style={{ fontFamily: R, fontSize: 10, fontWeight: 700, color: "#1B3A2D", background: "#F0D889", border: "none", borderRadius: 8, padding: "9px 16px", cursor: busy ? "wait" : "pointer", letterSpacing: 1.3, whiteSpace: "nowrap" as const }}>
          {busy ? "…" : "SUBSCRIBE"}
        </button>
      </div>
      {msg && (
        <div style={{ fontFamily: B, fontSize: 11, color: status === "err" ? "#F1C0C6" : "#B7D8B7", textAlign: "center" as const }}>{msg}</div>
      )}
    </form>
  );
}
