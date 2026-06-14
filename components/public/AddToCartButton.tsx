"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
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

export default function AddToCartButton({ productId, isLoggedIn, inStock }: { productId: string; isLoggedIn: boolean; inStock: boolean; accentColor?: string }) {
  const [loading, setLoading]     = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [added, setAdded]         = useState(false);
  const [error, setError]         = useState("");
  const [qty, setQty]             = useState(1);
  const router = useRouter();

  async function addToCart(): Promise<boolean> {
    if (!isLoggedIn) { router.push("/sign-in"); return false; }
    if (!inStock) return false;
    const res  = await fetch("/api/cart/add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_id: productId, quantity: qty }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return true;
  }

  async function handleAdd() {
    setLoading(true); setError("");
    try { const ok = await addToCart(); if (ok) setAdded(true); }
    catch (e: any) { setError(e.message ?? "Failed to add to cart."); }
    finally { setLoading(false); }
  }

  async function handleBuyNow() {
    if (!isLoggedIn) { router.push("/sign-in"); return; }
    setBuyLoading(true); setError("");
    try { await addToCart(); router.push("/members/cart"); }
    catch (e: any) { setError(e.message ?? "Failed to proceed."); setBuyLoading(false); }
  }

  if (!inStock) return (
    <div style={{ background: "#FFF0F0", border: `1px solid #F0406040`, borderRadius: "10px", padding: "14px", textAlign: "center", fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#F04060", letterSpacing: "2px" }}>
      OUT OF STOCK
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* Qty selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
        <span style={{ fontFamily: B, fontSize: "11px", color: C.muted, letterSpacing: "1px", marginRight: "16px", textTransform: "uppercase" }}>QTY</span>
        <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: "38px", height: "38px", background: C.cream, border: `1px solid ${C.border}`, borderRight: "none", borderRadius: "8px 0 0 8px", color: C.forest, cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="2" viewBox="0 0 12 2"><path d="M1 1h10" stroke={C.forest} strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        <div style={{ width: "52px", height: "38px", background: "#ffffff", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SG, fontSize: "14px", fontWeight: 600, color: C.forest }}>{qty}</div>
        <button onClick={() => setQty(q => q + 1)} style={{ width: "38px", height: "38px", background: C.cream, border: `1px solid ${C.border}`, borderLeft: "none", borderRadius: "0 8px 8px 0", color: C.forest, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1v10M1 6h10" stroke={C.forest} strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      {error && (
        <div style={{ background: "#FFF0F0", border: "1px solid #F0406040", borderRadius: "8px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#F04060" }}>{error}</div>
      )}

      {/* Add to Cart */}
      <button onClick={handleAdd} disabled={loading || buyLoading} style={{ width: "100%", background: added ? C.mist : loading ? C.cream : C.forest, border: "none", borderRadius: "10px", padding: "14px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.2s" }}>
        {added
          ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={C.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span style={{ fontFamily: SG, fontSize: "13px", fontWeight: 700, color: C.sage, letterSpacing: "1.5px" }}>ADDED TO CART</span></>
          : loading
          ? <span style={{ fontFamily: SG, fontSize: "13px", fontWeight: 700, color: C.muted, letterSpacing: "1.5px" }}>ADDING...</span>
          : !isLoggedIn
          ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><span style={{ fontFamily: SG, fontSize: "13px", fontWeight: 700, color: "#ffffff", letterSpacing: "1.5px" }}>LOGIN TO BUY</span></>
          : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><span style={{ fontFamily: SG, fontSize: "13px", fontWeight: 700, color: "#ffffff", letterSpacing: "1.5px" }}>ADD TO CART</span></>
        }
      </button>

      {/* Buy Now */}
      <button onClick={handleBuyNow} disabled={loading || buyLoading} style={{ width: "100%", background: "#ffffff", border: `1.5px solid ${C.forest}`, borderRadius: "10px", padding: "14px", cursor: buyLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.2s" }}>
        {buyLoading
          ? <span style={{ fontFamily: SG, fontSize: "13px", fontWeight: 700, color: C.muted, letterSpacing: "1.5px" }}>REDIRECTING...</span>
          : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={C.forest} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><span style={{ fontFamily: SG, fontSize: "13px", fontWeight: 700, color: C.forest, letterSpacing: "1.5px" }}>BUY NOW</span></>
        }
      </button>

      {/* View cart shortcut after adding */}
      {added && (
        <button onClick={() => router.push("/members/cart")} style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke={C.sage} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 600, color: C.sage, letterSpacing: "1px" }}>VIEW CART</span>
        </button>
      )}
    </div>
  );
}
