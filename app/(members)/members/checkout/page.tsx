"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";
const SHIPPING_REGIONS = ["Metro Manila", "Luzon", "Visayas", "Mindanao"];
const PAYMONGO_RATE = 0.025; // GCash rate — most common PH payment method
const PAYMONGO_FIXED = 0;    // No fixed fee for e-wallets

export default function CheckoutPage() {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [form, setForm] = useState({ full_name:"", phone:"", street:"", barangay:"", city:"", province:"", region:"Metro Manila", zip_code:"" });
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
    fetchShipping("Metro Manila", data.items ?? []);
  }

  async function fetchShipping(region: string, cartItems: any[]) {
    if (!region || !cartItems.length) return;
    setLoadingShipping(true);
    const totalWeight = cartItems.reduce((sum: number, i: any) => sum + ((i.products?.weight_kg ?? 0.5) * i.quantity), 0);
    const res = await fetch(`/api/shipping?region=${encodeURIComponent(region)}&weight=${totalWeight.toFixed(2)}`);
    const data = await res.json();
    setShippingFee(data.rate ?? 0);
    setLoadingShipping(false);
  }

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === "region") fetchShipping(value, items);
  }

  const subtotal = items.reduce((s: number, i: any) => s + (i.products?.price ?? 0) * i.quantity, 0);
  const beforeFee = subtotal + shippingFee;
  const paymongoFee = (beforeFee * PAYMONGO_RATE) + PAYMONGO_FIXED;
  const total = beforeFee + paymongoFee;
  const fmt = (n: number) => n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function handleCheckout() {
    if (!form.full_name || !form.phone || !form.street || !form.city || !form.province) {
      setError("Please fill in all required fields."); return;
    }
    setSubmitting(true); setError("");
    try {
      // Create order record first to get the order ID
      const orderRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, subtotal, shipping_fee: shippingFee, total: Math.round(total), shipping_address: form }),
      });
      const { orderId, error: orderError } = await orderRes.json();
      if (orderError) throw new Error(orderError);

      // Create PayMongo payment link using the order ID as reference
      const payRes = await fetch("/api/paymongo/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order",
          reference_id: orderId,
          amount: Math.round(total),
          description: "CFS Shop Order",
        }),
      });
      const { checkout_url, error: payError } = await payRes.json();
      if (payError) throw new Error(payError);
      await fetch("/api/cart/clear", { method: "POST" });
      window.location.href = checkout_url;
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (!isLoaded || loading) return <div style={{ padding: "8px 0" }}><SkeletonPage /></div>;
  if (items.length === 0) { router.push("/members/cart"); return null; }

  const inputStyle = { width:"100%", background:"#F2F7F2", border:"1.5px solid #DDE8DD", borderRadius:"6px", padding:"10px 14px", color:"#1B3A2D", fontFamily:B, fontSize:"13px", outline:"none", boxSizing:"border-box" as const };
  const labelStyle = { fontFamily:B, fontSize:"11px", color:"#5A7A60", letterSpacing:"1px", textTransform:"uppercase" as const, display:"block", marginBottom:"5px" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      <div>
        <h1 style={{ fontFamily:R, fontSize:"1.6rem", color:"#1B3A2D", letterSpacing:"3px", marginBottom:"4px" }}>CHECKOUT</h1>
        <p style={{ fontFamily:B, fontSize:"13px", color:"#4A7C59" }}>Almost there! Fill in your shipping details</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"20px", alignItems:"start" }} className="cart-layout">
        <div style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"24px", display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ fontFamily:R, fontSize:"13px", color:"#1B3A2D", letterSpacing:"2px", marginBottom:"4px" }}>SHIPPING ADDRESS</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} value={form.full_name} onChange={e=>update("full_name",e.target.value)} placeholder="Juan dela Cruz"/></div>
            <div><label style={labelStyle}>Phone *</label><input style={inputStyle} value={form.phone} onChange={e=>update("phone",e.target.value)} placeholder="09XX XXX XXXX"/></div>
          </div>
          <div><label style={labelStyle}>Street Address *</label><input style={inputStyle} value={form.street} onChange={e=>update("street",e.target.value)} placeholder="House/Unit No., Street, Subdivision"/></div>
          <div><label style={labelStyle}>Barangay</label><input style={inputStyle} value={form.barangay} onChange={e=>update("barangay",e.target.value)} placeholder="Barangay"/></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <div><label style={labelStyle}>City/Municipality *</label><input style={inputStyle} value={form.city} onChange={e=>update("city",e.target.value)} placeholder="City"/></div>
            <div><label style={labelStyle}>Province *</label><input style={inputStyle} value={form.province} onChange={e=>update("province",e.target.value)} placeholder="Province"/></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <div>
              <label style={labelStyle}>Region</label>
              <select style={inputStyle} value={form.region} onChange={e=>update("region",e.target.value)}>
                {SHIPPING_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>ZIP Code</label><input style={inputStyle} value={form.zip_code} onChange={e=>update("zip_code",e.target.value)} placeholder="1234"/></div>
          </div>
          {error && <div style={{ background:"#3D0A18", border:"1.5px solid #F04060", borderRadius:"8px", padding:"12px", fontFamily:B, fontSize:"13px", color:"#F04060" }}>{error}</div>}
        </div>

        <div style={{ background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"12px", padding:"20px", position:"sticky", top:"90px" }}>
          <div style={{ fontFamily:R, fontSize:"13px", color:"#1B3A2D", letterSpacing:"2px", marginBottom:"14px" }}>ORDER SUMMARY</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
            {items.map((item: any) => (
              <div key={item.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontFamily:B, fontSize:"12px", color:"#4A7C59" }}>{item.products?.name} x {item.quantity}</span>
                <span style={{ fontFamily:B, fontSize:"12px", color:"#1B3A2D" }}>P{(item.products?.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid #DDE8DD", paddingTop:"12px", display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontFamily:B, fontSize:"12px", color:"#4A7C59" }}>Subtotal</span>
              <span style={{ fontFamily:B, fontSize:"12px", color:"#1B3A2D" }}>P{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontFamily:B, fontSize:"12px", color:"#4A7C59" }}>Shipping</span>
              <span style={{ fontFamily:B, fontSize:"12px", color:"#1B3A2D" }}>{loadingShipping ? "..." : `₱${shippingFee.toLocaleString()}`}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <span style={{ fontFamily:B, fontSize:"12px", color:"#4A7C59" }}>Processing fee </span>
                <span style={{ fontFamily:B, fontSize:"10px", color:"#3A5A30" }}>(est. · GCash 2.5% · Maya 2% · Card 3.5%+₱15)</span>
              </div>
              <span style={{ fontFamily:B, fontSize:"12px", color:"#F04060" }}>+P{fmt(paymongoFee)}</span>
            </div>
            <div style={{ borderTop:"1px solid #DDE8DD", paddingTop:"8px", display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontFamily:R, fontSize:"13px", color:"#1B3A2D", letterSpacing:"1px" }}>TOTAL</span>
              <span style={{ fontFamily:R, fontSize:"15px", color:"#F07228" }}>P{fmt(total)}</span>
            </div>
          </div>
          <button onClick={handleCheckout} disabled={submitting} style={{ position:"relative", display:"block", width:"100%", background:"transparent", border:"none", cursor: submitting ? "not-allowed" : "pointer", padding:0, opacity: submitting ? 0.6 : 1 }}>
            <span style={{ position:"absolute", top:"3px", left:"3px", width:"100%", height:"100%", background:"#080F06", borderRadius:"6px", display:"block" }}/>
            <span style={{ position:"relative", display:"block", background:"#F07228", border:"2px solid #080F06", borderRadius:"6px", padding:"12px", textAlign:"center" }}>
              <span style={{ fontFamily:R, fontSize:"13px", color:"#1B3A2D", letterSpacing:"2px" }}>PAY P{fmt(total)}</span>
            </span>
          </button>
          <div style={{ display:"flex", gap:"8px", justifyContent:"center", marginTop:"10px" }}>
            {["GCash","Maya","Card"].map(m => <span key={m} style={{ fontFamily:B, fontSize:"10px", color:"#5A7A60", border:"1px solid #DDE8DD", borderRadius:"4px", padding:"2px 8px" }}>{m}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
