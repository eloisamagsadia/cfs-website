"use client";
import { useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

const TIERS = [
  { name: "Blood Moon",   range: "₱1,500 – ₱2,999", color: "#F04060", desc: "Entry-level supporter" },
  { name: "Harvest Moon", range: "₱3,000 – ₱4,999", color: "#F07228", desc: "Mid-tier supporter" },
  { name: "Blue Moon",    range: "₱5,000 – ₱7,999", color: "#8EE440", desc: "High-tier supporter" },
  { name: "Supermoon",    range: "₱8,000+",           color: "#F5C82A", desc: "Special perks included" },
];

// PayMongo fee: 2.45% + ₱15
const PAYMONGO_RATE = 0.0245;
const PAYMONGO_FIXED = 15;

export default function DonatePage() {
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState("");
  const [anon, setAnon] = useState(false);
  const [msg, setMsg] = useState("");

  const final = custom ? Number(custom) : amount;
  const paymongoFee = (final * PAYMONGO_RATE) + PAYMONGO_FIXED;
  // If donor covers fee, they pay more so CFS gets the full amount
  const totalCharged = final + paymongoFee;
  const cfsReceives  = final;

  const fmt = (n: number) => n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const activeTier = TIERS.find(t => {
    if (t.name === "Supermoon")    return final >= 8000;
    if (t.name === "Blue Moon")    return final >= 5000 && final <= 7999;
    if (t.name === "Harvest Moon") return final >= 3000 && final <= 4999;
    if (t.name === "Blood Moon")   return final >= 1500 && final <= 2999;
    return false;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0F1A0B" }}>

      {/* ── HERO ── */}
      <div style={{ background: "#1A3D14", borderBottom: "2px solid #2C4820", padding: "56px 24px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(60,206,42,0.1) 1.5px,transparent 1.5px)", backgroundSize: "18px 18px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#0F1A0B", border: "1.5px solid #F04060", borderRadius: "20px", padding: "4px 16px", marginBottom: "20px" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#F04060"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            <span style={{ fontFamily: R, fontSize: "10px", color: "#F04060", letterSpacing: "2.5px" }}>SUPPORT CFS</span>
          </div>
          <h1 style={{ fontFamily: R, fontSize: "clamp(2rem,5vw,3.2rem)", color: "#F0EAD6", letterSpacing: "4px", marginBottom: "14px" }}>DONATE</h1>
          <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "15px", color: "#8AAA78", lineHeight: 1.8 }}>
            Every peso funds fan projects, charity drives, and event productions for Colet and the whole BINI fam. 100% transparent — all fund usage is in our quarterly reports.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "48px 24px", display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* ── DONATION TIERS ── */}
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "14px", padding: "24px" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "2px", marginBottom: "16px" }}>MAYARI DONATION TIERS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {TIERS.map(t => (
              <div key={t.name} style={{ background: activeTier?.name === t.name ? "#0F2A0B" : "#243520", border: `1.5px solid ${activeTier?.name === t.name ? t.color : "#2C4820"}`, borderRadius: "10px", padding: "12px 14px", transition: "all 0.2s" }}>
                <div style={{ fontFamily: R, fontSize: "13px", color: t.color, letterSpacing: "1px", marginBottom: "3px" }}>{t.name}</div>
                <div style={{ fontFamily: B, fontSize: "12px", color: "#F0EAD6", marginBottom: "2px" }}>{t.range}</div>
                <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{t.desc}</div>
              </div>
            ))}
          </div>
          {activeTier && (
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", background: "#0F1A0B", border: `1.5px solid ${activeTier.color}40`, borderRadius: "8px", padding: "10px 14px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={activeTier.color}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              <span style={{ fontFamily: R, fontSize: "11px", color: activeTier.color, letterSpacing: "1px" }}>
                You're donating at {activeTier.name} tier!
              </span>
            </div>
          )}
        </div>

        {/* ── AMOUNT SELECTOR ── */}
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "14px", padding: "24px" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "2px", marginBottom: "16px" }}>SELECT AMOUNT</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "16px" }}>
            {AMOUNTS.map(a => (
              <button key={a} onClick={() => { setAmount(a); setCustom(""); }}
                style={{ fontFamily: R, fontSize: "15px", letterSpacing: "1px", background: amount === a && !custom ? "#3CCE2A" : "#243520", color: amount === a && !custom ? "#080F06" : "#F0EAD6", border: `1.5px solid ${amount === a && !custom ? "#3CCE2A" : "#2C4820"}`, borderRadius: "8px", padding: "12px", cursor: "pointer", transition: "all 0.15s" }}>
                ₱{a.toLocaleString()}
              </button>
            ))}
          </div>
          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1.5px", display: "block", marginBottom: "8px" }}>CUSTOM AMOUNT (₱)</label>
            <input type="number" placeholder="Enter custom amount" value={custom} onChange={e => setCustom(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", border: `1.5px solid ${custom ? "#3CCE2A" : "#2C4820"}`, borderRadius: "8px", fontFamily: R, fontSize: "18px", background: "#243520", color: "#F0EAD6", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* ── MESSAGE + ANON ── */}
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1.5px", display: "block", marginBottom: "8px" }}>DEDICATION MESSAGE (OPTIONAL)</label>
            <textarea placeholder="Leave a message for CFS..." value={msg} onChange={e => setMsg(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #2C4820", borderRadius: "8px", fontFamily: B, fontSize: "14px", background: "#243520", color: "#F0EAD6", outline: "none", resize: "vertical", minHeight: "80px", boxSizing: "border-box" }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: "#3CCE2A" }} />
            <span style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Donate anonymously</span>
          </label>
        </div>

        {/* ── FEE BREAKDOWN ── */}
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "14px", padding: "24px" }}>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "2px", marginBottom: "16px" }}>BREAKDOWN</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

            {/* Donation amount */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Donation amount</span>
              <span style={{ fontFamily: R, fontSize: "14px", color: "#F0EAD6" }}>₱{fmt(final)}</span>
            </div>

            {/* PayMongo fee */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Payment processing fee </span>
                <span style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30" }}>(2.45% + ₱15)</span>
              </div>
              <span style={{ fontFamily: R, fontSize: "13px", color: "#F04060" }}>
                +₱{fmt(paymongoFee)}
              </span>
            </div>
            {/* Net */}
            <div style={{ borderTop: "1px solid #2C4820", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: R, fontSize: "13px", color: "#3CCE2A", letterSpacing: "1px" }}>CFS RECEIVES</div>
                <div style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30" }}>Full amount after fee</div>
              </div>
              <span style={{ fontFamily: R, fontSize: "22px", color: "#3CCE2A" }}>₱{fmt(cfsReceives)}</span>
            </div>
          </div>
        </div>

        {/* ── DONATE BUTTON ── */}
        <div>
          <a href="/login?redirect=/donate" style={{ textDecoration: "none", display: "block", position: "relative" }}>
            <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "10px" }} />
            <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontFamily: R, fontSize: "18px", background: "#3CCE2A", color: "#080F06", padding: "16px", border: "2px solid #080F06", borderRadius: "10px", letterSpacing: "2px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#080F06"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              DONATE ₱{fmt(totalCharged)}
            </span>
          </a>
          <p style={{ fontFamily: B, fontSize: "11px", color: "#3A5A30", textAlign: "center", marginTop: "12px", lineHeight: 1.6 }}>
            Login required to donate. Processing fee (2.45% + ₱15) goes directly to the payment gateway — not to CFS. Toggle above to cover it so CFS gets 100%.
          </p>
        </div>
      </div>
    </div>
  );
}