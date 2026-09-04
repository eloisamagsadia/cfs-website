"use client";
import { useState } from "react";
import Link from "next/link";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const TOPICS = [
  { value: "general",     label: "General question" },
  { value: "events",      label: "Events" },
  { value: "shop",        label: "Shop / orders" },
  { value: "donation",    label: "Donations" },
  { value: "partnership", label: "Partnership" },
  { value: "press",       label: "Press" },
  { value: "bug",         label: "Bug / feedback" },
];

const inp: React.CSSProperties = {
  background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: 10,
  padding: "11px 14px", color: "#1B3A2D", fontFamily: B, fontSize: 14,
  outline: "none", boxSizing: "border-box", width: "100%",
};

export default function ContactPage() {
  const [form, setForm]   = useState({ name: "", email: "", topic: "general", message: "", company: "" });
  const [busy, setBusy]   = useState(false);
  const [ok, setOk]       = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setOk(true);
      setForm({ name: "", email: "", topic: "general", message: "", company: "" });
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ background: "#FAF6EE", minHeight: "100vh", padding: "56px 20px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        <div style={{ textAlign: "center" as const }}>
          <div style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#1A8040", letterSpacing: 3 }}>GET IN TOUCH</div>
          <h1 style={{ fontFamily: R, fontSize: "2.4rem", color: "#1B3A2D", letterSpacing: 4, margin: "8px 0 6px" }}>CONTACT</h1>
          <p style={{ fontFamily: B, fontSize: 14, color: "#4A7C59", maxWidth: 480, margin: "0 auto" }}>
            Question, feedback, partnership? Send us a message and we'll reply within one business day. Members can also use <Link href="/support" style={{ color: "#1A8040", fontWeight: 600 }}>in-app support</Link>.
          </p>
        </div>

        {ok ? (
          <div style={{ background: "#ffffff", border: "2px solid #1A8040", borderRadius: 14, padding: "40px 28px", textAlign: "center" as const, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontFamily: R, fontSize: "1.4rem", color: "#156530", letterSpacing: 2 }}>MESSAGE SENT ✓</div>
            <p style={{ fontFamily: B, fontSize: 14, color: "#1B3A2D", margin: 0 }}>Thanks — we'll get back to you at the email you provided within a business day.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 6 }}>
              <button onClick={() => setOk(false)}
                style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#5A7A60", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: 10, padding: "10px 16px", cursor: "pointer", letterSpacing: 1.3 }}>
                SEND ANOTHER
              </button>
              <Link href="/" style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: 10, padding: "10px 16px", cursor: "pointer", letterSpacing: 1.3, textDecoration: "none" }}>
                BACK HOME
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: 14, padding: "28px 28px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" style={inp} />
              <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" style={inp} />
            </div>
            <select value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} style={inp}>
              {TOPICS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <textarea required minLength={10} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="How can we help?" rows={6}
              style={{ ...inp, resize: "vertical" as const, lineHeight: 1.55 }} />

            {/* Honeypot — hidden from real users */}
            <input tabIndex={-1} autoComplete="off" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
              style={{ position: "absolute" as const, left: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden />

            {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: 10, padding: "9px 12px", fontFamily: B, fontSize: 13, color: "#CC3344" }}>{error}</div>}

            <button type="submit" disabled={busy}
              style={{ fontFamily: R, fontSize: 13, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: 10, padding: "13px 22px", cursor: busy ? "wait" : "pointer", letterSpacing: 2, alignSelf: "flex-start" }}>
              {busy ? "SENDING…" : "SEND MESSAGE"}
            </button>
            <div style={{ fontFamily: B, fontSize: 11, color: "#7A8E7A" }}>By sending, you agree to be contacted at the email above. We don't share it.</div>
          </form>
        )}

        <div style={{ textAlign: "center" as const, fontFamily: B, fontSize: 12, color: "#7A8E7A" }}>
          Need faster help or have an account issue? Open a ticket at <a href="/support" style={{ color: "#1A8040", fontWeight: 600 }}>coletfs.com/support</a>.
        </div>
      </div>
    </div>
  );
}
