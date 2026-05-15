"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default function AddToCartButton({ productId, isLoggedIn, inStock, accentColor }: { productId: string; isLoggedIn: boolean; inStock: boolean; accentColor: string }) {
  const [loading, setLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const router = useRouter();

  async function addToCart(): Promise<boolean> {
    if (!isLoggedIn) { router.push("/sign-in"); return false; }
    if (!inStock) return false;
    const res = await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity: qty }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return true;
  }

  async function handleAdd() {
    setLoading(true); setError("");
    try {
      const ok = await addToCart();
      if (ok) { setAdded(true); }
    } catch (e: any) {
      setError(e.message ?? "Failed to add to cart.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyNow() {
    if (!isLoggedIn) { router.push("/sign-in"); return; }
    setBuyLoading(true); setError("");
    try {
      await addToCart();
      router.push("/members/cart");
    } catch (e: any) {
      setError(e.message ?? "Failed to proceed.");
      setBuyLoading(false);
    }
  }

  if (!inStock) return (
    <div style={{ background: "#3D0A18", border: "2px solid #F04060", borderRadius: "8px", padding: "14px", textAlign: "center", fontFamily: R, fontSize: "14px", color: "#F04060", letterSpacing: "1.5px" }}>OUT OF STOCK</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Qty selector */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", marginRight: "12px", textTransform: "uppercase" }}>Qty</span>
        <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: "36px", height: "36px", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px 0 0 6px", color: "#F0EAD6", cursor: "pointer", fontFamily: R, fontSize: "16px" }}>−</button>
        <div style={{ width: "48px", height: "36px", background: "#1A2614", border: "1.5px solid #2C4820", borderTop: "1.5px solid #2C4820", borderBottom: "1.5px solid #2C4820", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: R, fontSize: "14px", color: "#F0EAD6" }}>{qty}</div>
        <button onClick={() => setQty(q => q + 1)} style={{ width: "36px", height: "36px", background: "#243520", border: "1.5px solid #2C4820", borderRadius: "0 6px 6px 0", color: "#F0EAD6", cursor: "pointer", fontFamily: R, fontSize: "16px" }}>+</button>
      </div>

      {error && (
        <div style={{ background: "#3D0A18", border: "1.5px solid #F04060", borderRadius: "6px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#F04060" }}>{error}</div>
      )}

      {/* Add to Cart */}
      <button onClick={handleAdd} disabled={loading || buyLoading} style={{ position: "relative", display: "block", width: "100%", background: "transparent", border: "none", padding: 0, cursor: loading ? "not-allowed" : "pointer" }}>
        <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "8px" }}/>
        <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "14px", background: added ? "#1A3D14" : loading ? "#243520" : accentColor, color: added ? "#3CCE2A" : loading ? "#5A7A50" : "#080F06", padding: "13px", border: "2px solid #080F06", borderRadius: "8px", textAlign: "center", letterSpacing: "2px" }}>
          {added ? "✓ ADDED TO CART!" : loading ? "ADDING..." : !isLoggedIn ? "LOGIN TO BUY" : "ADD TO CART"}
        </span>
      </button>

      {/* Buy Now */}
      <button onClick={handleBuyNow} disabled={loading || buyLoading} style={{ position: "relative", display: "block", width: "100%", background: "transparent", border: "none", padding: 0, cursor: buyLoading ? "not-allowed" : "pointer" }}>
        <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "8px" }}/>
        <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "14px", background: buyLoading ? "#243520" : "#F0EAD6", color: buyLoading ? "#5A7A50" : "#080F06", padding: "13px", border: "2px solid #080F06", borderRadius: "8px", textAlign: "center", letterSpacing: "2px" }}>
          {buyLoading ? "REDIRECTING..." : "BUY NOW →"}
        </span>
      </button>

      {/* View cart shortcut after adding */}
      {added && (
        <button onClick={() => router.push("/members/cart")} style={{ fontFamily: R, fontSize: "11px", color: "#3CCE2A", background: "transparent", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "8px", cursor: "pointer", letterSpacing: "1.5px", width: "100%" }}>
          VIEW CART →
        </button>
      )}
    </div>
  );
}