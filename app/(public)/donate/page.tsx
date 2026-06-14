"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  paper:  "#FAFDF9",
  cream:  "#F2F7F2",
  mist:   "#E8F0E4",
  forest: "#1B3A2D",
  sage:   "#4A7C59",
  border: "#DDE8DD",
  muted:  "#7A8E7A",
  green:  "#3CCE2A",
};

const AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

const TIERS = [
  { name: "Blood Moon",   range: "₱1,500 – ₱2,999", color: "#F04060", desc: "Entry-level supporter" },
  { name: "Harvest Moon", range: "₱3,000 – ₱4,999", color: "#F07228", desc: "Mid-tier supporter" },
  { name: "Blue Moon",    range: "₱5,000 – ₱7,999", color: "#8EE440", desc: "High-tier supporter" },
  { name: "Supermoon",    range: "₱8,000+",           color: "#F5C82A", desc: "Special perks included" },
];

const PAYMONGO_RATE  = 0.0245;
const PAYMONGO_FIXED = 15;

export default function DonatePage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState("");
  const [anon,   setAnon]   = useState(false);
  const [msg,    setMsg]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]  = useState("");

  const final         = custom ? Number(custom) : amount;
  const paymongoFee   = (final * PAYMONGO_RATE) + PAYMONGO_FIXED;
  const totalCharged  = final + paymongoFee;
  const cfsReceives   = final;
  const fmt = (n: number) => n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function handleDonate() {
    if (!isSignedIn) { router.push(`/sign-in?redirect_url=/donate`); return; }
    if (final < 20) { setError("Minimum donation is ₱20."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/paymongo/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: final,
          description: "Donation to CFS (Colet Fan Society)",
          type: "donation",
          metadata: { message: msg || null, anonymous: anon },
          success_url: `${window.location.origin}/payment/success?type=donation`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create payment link");
      window.location.href = data.checkout_url;
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const activeTier = TIERS.find(t => {
    if (t.name === "Supermoon")    return final >= 8000;
    if (t.name === "Blue Moon")    return final >= 5000 && final <= 7999;
    if (t.name === "Harvest Moon") return final >= 3000 && final <= 4999;
    if (t.name === "Blood Moon")   return final >= 1500 && final <= 2999;
    return false;
  });

  return (
    <div style={{ minHeight: "100vh", background: C.paper }}>

      {/* ── HERO ── */}
      <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:"420px", overflow:"hidden", maxWidth:"1400px", margin:"0 auto", width:"100%" }}>
        <div style={{ padding:"64px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
         
          <h1 style={{ fontFamily:S, fontSize:"clamp(2.4rem,4vw,3.6rem)", color:C.forest, lineHeight:1.05, marginBottom:"16px" }}>
            Your Peso Matters. <br /><em style={{ fontStyle:"italic", color:C.sage }}>Para Kay Colet.</em>
          </h1>
          <p style={{ fontFamily:B, fontSize:"15px", color:C.muted, maxWidth:"440px", lineHeight:1.9 }}>
            Every peso funds fan projects, charity drives, and event productions. 100% transparent — all fund usage is in our quarterly reports.
          </p>
        </div>
        <div style={{ background:C.mist, position:"relative", overflow:"hidden" }}>
          <img src="https://media.coletfs.com/assets/hero/donation/cfs-donation-hero.png" alt="Donate to CFS" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", position:"absolute", inset:0 }} />
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {[280, 180, 100].map((size, i) => (
              <div key={i} style={{ position:"absolute", width:`${size}px`, height:`${size}px`, borderRadius:"50%", border:"1px solid rgba(44,72,32,0.12)" }} />
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth:"720px", margin:"0 auto", padding:"48px 24px", display:"flex", flexDirection:"column", gap:"20px" }}>

        {/* ── DONATION TIERS ── */}
        <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ background:C.forest, padding:"16px 24px" }}>
            <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.7)", letterSpacing:"3px" }}>MAYARI DONATION TIERS</div>
          </div>
          <div style={{ padding:"20px 24px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              {TIERS.map(t => (
                <div key={t.name} style={{ background: activeTier?.name === t.name ? t.color + "10" : C.cream, border:`1.5px solid ${activeTier?.name === t.name ? t.color : C.border}`, borderRadius:"10px", padding:"12px 14px", transition:"all 0.2s" }}>
                  <div style={{ fontFamily:SG, fontSize:"11px", fontWeight:700, color:t.color, marginBottom:"3px" }}>{t.name}</div>
                  <div style={{ fontFamily:B, fontSize:"12px", color:C.forest, marginBottom:"2px" }}>{t.range}</div>
                  <div style={{ fontFamily:B, fontSize:"11px", color:C.muted }}>{t.desc}</div>
                </div>
              ))}
            </div>
            {activeTier && (
              <div style={{ marginTop:"12px", display:"flex", alignItems:"center", gap:"8px", background:activeTier.color + "10", border:`1px solid ${activeTier.color}40`, borderRadius:"8px", padding:"10px 14px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill={activeTier.color}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                <span style={{ fontFamily:SG, fontSize:"11px", fontWeight:700, color:activeTier.color }}>You are donating at {activeTier.name} tier!</span>
              </div>
            )}
          </div>
        </div>

        {/* ── AMOUNT SELECTOR ── */}
        <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ background:C.forest, padding:"16px 24px" }}>
            <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.7)", letterSpacing:"3px" }}>SELECT AMOUNT</div>
          </div>
          <div style={{ padding:"20px 24px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"16px" }}>
              {AMOUNTS.map(a => (
                <button key={a} onClick={() => { setAmount(a); setCustom(""); }}
                  style={{ fontFamily:SG, fontSize:"14px", fontWeight:700, background: amount === a && !custom ? C.forest : C.cream, color: amount === a && !custom ? "#ffffff" : C.forest, border:`1.5px solid ${amount === a && !custom ? C.forest : C.border}`, borderRadius:"10px", padding:"12px", cursor:"pointer", transition:"all 0.15s" }}>
                  ₱{a.toLocaleString()}
                </button>
              ))}
            </div>
            <div>
              <label style={{ fontFamily:B, fontSize:"11px", color:C.muted, letterSpacing:"1px", display:"block", marginBottom:"8px" }}>CUSTOM AMOUNT (₱)</label>
              <input type="number" placeholder="Enter custom amount" value={custom} onChange={e => setCustom(e.target.value)}
                style={{ width:"100%", padding:"12px 16px", border:`1.5px solid ${custom ? C.forest : C.border}`, borderRadius:"10px", fontFamily:SG, fontSize:"18px", fontWeight:700, background:C.cream, color:C.forest, outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
        </div>

        {/* ── MESSAGE + ANON ── */}
        <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ background:C.forest, padding:"16px 24px" }}>
            <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.7)", letterSpacing:"3px" }}>DEDICATION</div>
          </div>
          <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:"16px" }}>
            <div>
              <label style={{ fontFamily:B, fontSize:"11px", color:C.muted, letterSpacing:"1px", display:"block", marginBottom:"8px" }}>MESSAGE (OPTIONAL)</label>
              <textarea placeholder="Leave a message for CFS..." value={msg} onChange={e => setMsg(e.target.value)}
                style={{ width:"100%", padding:"12px 16px", border:`1px solid ${C.border}`, borderRadius:"10px", fontFamily:B, fontSize:"14px", background:C.cream, color:C.forest, outline:"none", resize:"vertical", minHeight:"80px", boxSizing:"border-box" }} />
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }}>
              <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ width:"18px", height:"18px", accentColor:C.sage }} />
              <span style={{ fontFamily:B, fontSize:"13px", color:C.muted }}>Donate anonymously</span>
            </label>
          </div>
        </div>

        {/* ── FEE BREAKDOWN ── */}
        <div style={{ background:"#ffffff", border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ background:C.forest, padding:"16px 24px" }}>
            <div style={{ fontFamily:SG, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.7)", letterSpacing:"3px" }}>BREAKDOWN</div>
          </div>
          <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontFamily:B, fontSize:"13px", color:C.muted }}>Donation amount</span>
              <span style={{ fontFamily:SG, fontSize:"14px", fontWeight:600, color:C.forest }}>₱{fmt(final)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <span style={{ fontFamily:B, fontSize:"13px", color:C.muted }}>Processing fee </span>
                <span style={{ fontFamily:B, fontSize:"11px", color:C.muted }}>(2.45% + ₱15)</span>
              </div>
              <span style={{ fontFamily:SG, fontSize:"13px", fontWeight:600, color:"#F04060" }}>+₱{fmt(paymongoFee)}</span>
            </div>
            <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:"12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontFamily:SG, fontSize:"12px", fontWeight:700, color:C.sage, letterSpacing:"1px" }}>CFS RECEIVES</div>
                <div style={{ fontFamily:B, fontSize:"11px", color:C.muted }}>Full amount after fee</div>
              </div>
              <span style={{ fontFamily:S, fontSize:"1.8rem", color:C.sage }}>₱{fmt(cfsReceives)}</span>
            </div>
          </div>
        </div>

        {/* ── DONATE BUTTON ── */}
        <div>
          {error && (
            <div style={{ background:"#FFF0F3", border:"1px solid #F04060", borderRadius:"10px", padding:"12px 16px", fontFamily:B, fontSize:"13px", color:"#F04060", marginBottom:"12px" }}>
              {error}
            </div>
          )}
          <button
            onClick={handleDonate}
            disabled={loading || final < 20}
            style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", fontFamily:SG, fontSize:"16px", fontWeight:700, background: loading ? "#4A7C59" : final < 20 ? "#DDE8DD" : C.forest, color: final < 20 ? C.muted : "#ffffff", border:"none", padding:"16px", borderRadius:"12px", letterSpacing:"1.5px", cursor: loading || final < 20 ? "not-allowed" : "pointer", transition:"background 0.15s" }}
          >
            {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>}
            {loading ? "REDIRECTING TO CHECKOUT..." : isSignedIn ? `DONATE ₱${fmt(totalCharged)}` : "LOGIN TO DONATE"}
          </button>
          <p style={{ fontFamily:B, fontSize:"11px", color:C.muted, textAlign:"center", marginTop:"12px", lineHeight:1.6 }}>
            {isSignedIn ? "You will be redirected to PayMongo's secure checkout." : "Login required to donate."}{" "}Processing fee goes directly to the payment gateway, not to CFS.
          </p>
        </div>
      </div>
    </div>
  );
}
