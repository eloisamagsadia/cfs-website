"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  paper:  "#FAFDF9",
  cream:  "#F2F7F2",
  forest: "#1B3A2D",
  sage:   "#4A7C59",
  border: "#DDE8DD",
  muted:  "#7A8E7A",
  green:  "#1A8040",
};

const CHANNELS = [
  {
    name: "GCash",
    handle: "0917 XXX XXXX",
    holder: "Colet Fan Society",
  },
  {
    name: "Maya",
    handle: "0917 XXX XXXX",
    holder: "Colet Fan Society",
  },
  {
    name: "BPI (Bank Transfer)",
    handle: "1234-5678-90",
    holder: "Colet Fan Society",
  },
];

export default function ManualPaymentPage() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? "";
  const type = params.get("type") ?? "donation";
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1200);
    return () => clearTimeout(t);
  }, [copied]);

  function copy(text: string, key: string) {
    navigator.clipboard?.writeText(text);
    setCopied(key);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.paper, padding: "48px 24px" }}>
      <div style={{ maxWidth: "620px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "3px", marginBottom: "10px" }}>MANUAL PAYMENT</div>
          <h1 style={{ fontFamily: S, fontSize: "2rem", color: C.forest, lineHeight: 1.1, marginBottom: "8px" }}>Almost there.</h1>
          <p style={{ fontFamily: B, fontSize: "14px", color: C.muted, lineHeight: 1.7, margin: 0 }}>
            Send your donation to one of the channels below. Once received, we&apos;ll mark your donation as completed and email you a receipt.
          </p>
        </div>

        {ref && (
          <div style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 20px" }}>
            <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.sage, letterSpacing: "2px", marginBottom: "6px" }}>YOUR REFERENCE</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <span style={{ fontFamily: SG, fontSize: "14px", fontWeight: 700, color: C.forest, letterSpacing: "1px" }}>{ref.slice(0, 8).toUpperCase()}</span>
              <button onClick={() => copy(ref, "ref")}
                style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, background: copied === "ref" ? C.green : C.cream, color: copied === "ref" ? "#fff" : C.forest, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}>
                {copied === "ref" ? "COPIED" : "COPY REF"}
              </button>
            </div>
            <p style={{ fontFamily: B, fontSize: "11px", color: C.muted, marginTop: "8px", lineHeight: 1.5 }}>
              Include this reference in your transfer note so we can match it to your account.
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {CHANNELS.map(c => (
            <div key={c.name} style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div>
                  <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: C.green, letterSpacing: "2px", marginBottom: "6px" }}>{c.name.toUpperCase()}</div>
                  <div style={{ fontFamily: S, fontSize: "18px", color: C.forest, letterSpacing: "1px" }}>{c.handle}</div>
                  <div style={{ fontFamily: B, fontSize: "12px", color: C.muted, marginTop: "4px" }}>Account name: {c.holder}</div>
                </div>
                <button onClick={() => copy(c.handle, c.name)}
                  style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, background: copied === c.name ? C.green : C.cream, color: copied === c.name ? "#fff" : C.forest, border: `1px solid ${C.border}`, borderRadius: "6px", padding: "6px 12px", cursor: "pointer", flexShrink: 0 }}>
                  {copied === c.name ? "COPIED" : "COPY"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 20px" }}>
          <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: C.forest, letterSpacing: "2px", marginBottom: "8px" }}>WHAT HAPPENS NEXT</div>
          <ol style={{ fontFamily: B, fontSize: "13px", color: C.forest, lineHeight: 1.9, margin: 0, paddingLeft: "18px" }}>
            <li>Send the exact amount to any channel above.</li>
            <li>Include the reference code in the transfer note.</li>
            <li>Send a screenshot to <a href="/members/support" style={{ color: C.green, textDecoration: "underline" }}>Support</a> or email binicoletfanprojects@gmail.com.</li>
            <li>An admin will confirm your donation within 24 hours.</li>
          </ol>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "8px" }}>
          <Link href="/members/donations" style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: C.forest, background: "#ffffff", border: `1.5px solid ${C.border}`, borderRadius: "8px", padding: "10px 20px", textDecoration: "none", letterSpacing: "1.5px" }}>MY DONATIONS</Link>
          <Link href="/donate" style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#ffffff", background: C.forest, border: `1.5px solid ${C.forest}`, borderRadius: "8px", padding: "10px 20px", textDecoration: "none", letterSpacing: "1.5px" }}>DONATE AGAIN</Link>
        </div>
      </div>
    </div>
  );
}
