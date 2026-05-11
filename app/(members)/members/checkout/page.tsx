"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const R="var(--font-righteous,'Righteous',sans-serif)";
const B="var(--font-barlow,'Barlow',sans-serif)";

const PH_REGIONS = ["NCR","Region I","Region II","Region III","Region IV-A","Region IV-B","Region V","Region VI","Region VII","Region VIII","Region IX","Region X","Region XI","Region XII","CAR","CARAGA","BARMM"];

const PAYMONGO_RATE = 0.0245;
const PAYMONGO_FIXED = 15;

export default function CheckoutPage() {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [coverFee, setCoverFee] = useState(false);
  const [form, setForm] = useState({ full_name:"", phone:"", street:"", barangay:"", city:"", province:"", region:"NCR", zip_code:"" });
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

  function update(field: string, value: string) { setForm(prev => ({ ...prev, [field]: value })); }

  const subtotal = items.reduce((s, i) => s + (i.products?.price ?? 0) * i.quantity, 0);
  const shippingFee = 150;
  const beforeFee = subtotal + shippingFee;
  const paymongoFee = (beforeFee * PAYMONGO_RATE) + PAYMONGO_FIXED;
  const total = coverFee ? beforeFee + paymongoFee : beforeFee;
  const fmt = (n: number) => n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  async function handleCheckout() {
    if (!form.full_name || !form.phone || !form.street || !form.city || !form.province) {
      setError("Please fill in all required fields."); return;
    }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/paymongo/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order",
          items,
          subtotal,
          shipping_fee: shippingFee,
          total: Math.round(total),
          shipping_address: form,
          description: `CFS Shop Order - ${items.length} item(s)`,
        }),
      });
      const { checkoutUrl, error: payError } = await res.json();
      if (payError) throw new Error(payError);
      await fetch("/api/cart/clear", { method: "POST" });
      window.location.href = checkoutUrl;
    } catch (e: any) {
      setError(e.message ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (!isLoaded || loading) return <div style={{ textAlign:"center", padding:"48px", fontFamily:R, color:"#5A7A50", letterSpacing:"2px" }}>LOADING...</div>;
  if (items.length === 0) { router.push("/members/cart"); return null; }

  const inputStyle = { width:"100%", background:"#243520", border:"1.5px solid #2C4820", borderRadius:"6px", padding:"10px 14px", color:"#F0EAD6", fontFamily:B, fontSize:"13px", outline:"none", boxSizing:"border-box" as const };
  const labelStyle = { fontFamily:B, fontSize:"11px", color:"#5A7A50", letterSpacing:"1px", textTransform:"uppercase" as const, display:"block", marginBottom:"5px" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
      <div>
        <h1 style={{ fontFamily:R, fontSize:"1.6rem", color:"#F0EAD6", letterSpacing:"3px", marginBottom:"4px" }}>CHECKOUT</h1>
        <p style={{ fontFamily:B, fontSize:"13px", color:"#8AAA78" }}>Almost there! Fill in your shipping details</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:"20px", alignItems:"start" }}>
        <div style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"24px", display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ fontFamily:R, fontSize:"13px", color:"#F0EAD6", letterSpacing:"2px", marginBottom:"4px" }}>SHIPPING ADDRESS</div>
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
            <div><label style={labelStyle}>Region</label><select style={inputStyle} value={form.region} onChange={e=>update("region",e.target.value)}>{PH_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div><label style={labelStyle}>ZIP Code</label><input style={inputStyle} value={form.zip_code} onChange={e=>update("zip_code",e.target.value)} placeholder="1234"/></div>
          </div>
          {error && <div style={{ background:"#3D0A18", border:"1.5px solid #F04060", borderRadius:"8px", padding:"12px", fontFamily:B, fontSize:"13px", color:"#F04060" }}>{error}</div>}
        </div>

        <div style={{ background:"#1A2614", border:"2px solid #2C4820", borderRadius:"12px", padding:"20px", position:"sticky", top:"90px" }}>
          <div style={{ fontFamily:R, fontSize:"13px", color:"#F0EAD6", letterSpacing:"2px", marginBottom:"14px" }}>ORDER SUMMARY</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
            {items.map(item => (
              <div key={item.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontFamily:B, fontSize:"12px", color:"#8AAA78" }}>{item.products?.name} × {item.quantity}</span>
                <span style={{ fontFamily:B, fontSize:"12px", color:"#F0EAD6" }}>₱{(item.products?.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid #2C4820", paddingTop:"12px", display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontFamily:B, fontSize:"12px", color:"#8AAA78" }}>Subtotal</span><span style={{ fontFamily:B, fontSize:"12px", color:"#F0EAD6" }}>₱{subtotal.toLocaleString()}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ fontFamily:B, fontSize:"12px", color:"#8AAA78" }}>Shipping</span><span style={{ fontFamily:B, fontSize:"12px", color:"#F0EAD6" }}>₱{shippingFee.toLocaleString()}</span></div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><span style={{ fontFamily:B, fontSize:"12px", color:"#8AAA78" }}>Processing fee </span><span style={{ fontFamily:B, fontSize:"10px", color:"#3A5A30" }}>(2.45%+₱15)</span></div>
              <span style={{ fontFamily:B, fontSize:"12px", color: coverFee ? "#3CCE2A" : "#F04060" }}>{coverFee ? "+" : "−"}₱{fmt(paymongoFee)}</span>
            </div>
            <label style={{ display:"flex", alignItems:"flex-start", gap:"8px", cursor:"pointer", background: coverFee ? "#0F2A0B" : "#243520", border:`1.5px solid ${coverFee ? "#3CCE2A" : "#2C4820"}`, borderRadius:"8px", padding:"10px 12px" }}>
              <input type="checkbox" checked={coverFee} onChange={e => setCoverFee(e.target.checked)} style={{ width:"14px", height:"14px", accentColor:"#3CCE2A", marginTop:"2px", flexShrink:0 }}/>
              <div>
                <div style={{ fontFamily:R, fontSize:"11px", color: coverFee ? "#3CCE2A" : "#F0EAD6", letterSpacing:"0.5px", marginBottom:"2px" }}>Cover the processing fee</div>
                <div style={{ fontFamily:B, fontSize:"10px", color:"#5A7A50", lineHeight:1.4 }}>Add ₱{fmt(paymongoFee)} so CFS keeps the full amount</div>
              </div>
            </label>
            <div style={{ borderTop:"1px solid #2C4820", paddingTop:"8px", display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontFamily:R, fontSize:"13px", color:"#F0EAD6", letterSpacing:"1px" }}>TOTAL</span>
              <span style={{ fontFamily:R, fontSize:"15px", color:"#F07228" }}>₱{fmt(total)}</span>
            </div>
          </div>
          <button onClick={handleCheckout} disabled={submitting} style={{ position:"relative", display:"block", width:"100%", background:"transparent", border:"none", cursor:submitting?"not-allowed":"pointer", padding:0, opacity:submitting?0.7:1 }}>
            <span style={{ position:"absolute", top:"3px", left:"3px", width:"100%", height:"100%", background:"#080F06", borderRadius:"6px", display:"block" }}/>
            <span style={{ position:"relative", display:"block", background:"#F07228", border:"2px solid #080F06", borderRadius:"6px", padding:"12px", textAlign:"center" }}>
              <span style={{ fontFamily:R, fontSize:"13px", color:"#F0EAD6", letterSpacing:"2px" }}>{submitting ? "REDIRECTING..." : `PAY ₱${fmt(total)}`}</span>
            </span>
          </button>
          <div style={{ display:"flex", gap:"8px", justifyContent:"center", marginTop:"10px" }}>
            {["GCash","Maya","Card"].map(m => <span key={m} style={{ fontFamily:B, fontSize:"10px", color:"#5A7A50", border:"1px solid #2C4820", borderRadius:"4px", padding:"2px 8px" }}>{m}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}