"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

interface CartItem { id: string; quantity: number; variant: any; product_id: string; products: { name: string; price: number; images: string[] }; }

export default function CartPage() {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number; label: string; promo_code_id: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-in"); return; }
    loadCart();
  }, [isLoaded, user]);

  async function loadCart() {
    const res = await fetch("/api/cart");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  async function updateQty(id: string, qty: number) {
    if (qty < 1) { await removeItem(id); return; }
    await fetch("/api/cart", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, quantity: qty }) });
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  }

  async function removeItem(id: string) {
    await fetch("/api/cart", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function applyPromo() {
    if (!promoCode.trim()) return;
    setPromoError(""); setPromoLoading(true);
    try {
      const res = await fetch("/api/codes/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: promoCode.trim(), subtotal, cart_items: items.map(i => ({ product_id: i.product_id, price: i.products?.price ?? 0, quantity: i.quantity })) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setPromoApplied({ code: data.code, discount: data.discount, label: data.discount_type === "percent" ? `${data.discount_value}% OFF` : `₱${data.discount_value} OFF`, promo_code_id: data.promo_code_id });
      setPromoCode("");
    } catch (e: any) { setPromoError(e.message); }
    finally { setPromoLoading(false); }
  }

  function removePromo() { setPromoApplied(null); setPromoError(""); }

  const subtotal = items.reduce((s, i) => s + (i.products?.price ?? 0) * i.quantity, 0);
  const discount = promoApplied?.discount ?? 0;
  const total = subtotal - discount;

  if (!isLoaded || loading) return (
    <div style={{ textAlign: "center", padding: "48px", fontFamily: R, color: "#5A7A60", letterSpacing: "2px" }}>LOADING CART...</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>MY CART</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>{items.length} item{items.length !== 1 ? "s" : ""}</p>
      </div>
      {items.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🛒</div>
          <div style={{ fontFamily: R, fontSize: "14px", color: "#5A7A60", letterSpacing: "2px", marginBottom: "16px" }}>YOUR CART IS EMPTY</div>
          <Link href="/shop" style={{ fontFamily: R, fontSize: "12px", color: "#1A8040", textDecoration: "none", border: "1.5px solid #3D1A0A", borderRadius: "6px", padding: "8px 18px", letterSpacing: "1.5px" }}>BROWSE SHOP →</Link>
        </div>
      ) : (
        <div className="cart-layout" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {items.map((item) => (
              <div key={item.id} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "16px", display: "flex", gap: "14px", alignItems: "center" }}>
                <div style={{ width: "60px", height: "60px", borderRadius: "8px", background: "#F2F7F2", overflow: "hidden", flexShrink: 0 }}>
                  {item.products?.images?.[0] && <img src={item.products.images[0]} alt={item.products.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "1px", marginBottom: "4px" }}>{item.products?.name ?? "Product"}</div>
                  {item.variant && <div style={{ fontFamily: B, fontSize: "11px", color: "#4A7C59", marginBottom: "6px" }}>{Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(", ")}</div>}
                  <div style={{ fontFamily: R, fontSize: "13px", color: "#1A8040" }}>₱{Number(item.products?.price ?? 0).toLocaleString()}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#F2F7F2", border: "1.5px solid #DDE8DD", color: "#1B3A2D", cursor: "pointer", fontFamily: R, fontSize: "14px" }}>−</button>
                  <span style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#F2F7F2", border: "1.5px solid #DDE8DD", color: "#1B3A2D", cursor: "pointer", fontFamily: R, fontSize: "14px" }}>+</button>
                </div>
                <button onClick={() => removeItem(item.id)} style={{ background: "transparent", border: "none", color: "#CC3344", cursor: "pointer", fontSize: "16px", padding: "4px" }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "20px", position: "sticky", top: "90px" }}>
            <div style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "2px", marginBottom: "16px" }}>ORDER SUMMARY</div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "6px", textTransform: "uppercase" }}>Promo Code</div>
              {promoApplied ? (
                <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "6px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontFamily: R, fontSize: "13px", color: "#1A8040", letterSpacing: "2px" }}>{promoApplied.code}</span>
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#1A8040", marginLeft: "8px" }}>{promoApplied.label}</span>
                  </div>
                  <button onClick={removePromo} style={{ background: "none", border: "none", color: "#CC3344", cursor: "pointer", fontSize: "14px" }}>✕</button>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }} onKeyDown={e => e.key === "Enter" && applyPromo()} placeholder="Enter code" style={{ flex: 1, background: "#F2F7F2", border: `1.5px solid ${promoError ? "#CC3344" : "#DDE8DD"}`, borderRadius: "6px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none", textTransform: "uppercase" }} />
                    <button onClick={applyPromo} disabled={promoLoading || !promoCode} style={{ fontFamily: R, fontSize: "11px", background: "#E8F0E4", border: "1.5px solid #DDE8DD", borderRadius: "6px", color: "#1A8040", padding: "8px 12px", cursor: "pointer", letterSpacing: "1px", opacity: !promoCode ? 0.5 : 1 }}>{promoLoading ? "..." : "APPLY"}</button>
                  </div>
                  {promoError && <div style={{ fontFamily: B, fontSize: "11px", color: "#CC3344", marginTop: "4px" }}>{promoError}</div>}
                </>
              )}
            </div>
            <div style={{ borderTop: "1px solid #DDE8DD", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {[
                { label: "Subtotal", val: `₱${subtotal.toLocaleString()}` },
                { label: "Shipping", val: "Calculated at checkout" },
                ...(discount > 0 ? [{ label: `Discount (${promoApplied?.label})`, val: `-₱${discount.toLocaleString()}`, green: true }] : []),
              ].map(({ label, val, green }: any) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>{label}</span>
                  <span style={{ fontFamily: B, fontSize: "13px", color: green ? "#1A8040" : "#1B3A2D" }}>{val}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #DDE8DD", paddingTop: "10px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "1px" }}>TOTAL</span>
                <span style={{ fontFamily: R, fontSize: "14px", color: "#1A8040" }}>₱{total.toLocaleString()}</span>
              </div>
            </div>
            <Link href={`/members/checkout?discount=${discount}&promo_code_id=${promoApplied?.promo_code_id ?? ""}&promo_label=${promoApplied?.label ?? ""}`} style={{ textDecoration: "none", display: "block", position: "relative" }}>
              <div style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
              <div style={{ position: "relative", background: "#1A8040", border: "2px solid #080F06", borderRadius: "6px", padding: "12px", textAlign: "center" }}>
                <span style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", letterSpacing: "2px" }}>CHECKOUT ₱{total.toLocaleString()}</span>
              </div>
            </Link>
            
          </div>
        </div>
      )}
    </div>
  );
}
