"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const inp = { background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "10px 12px", color: "#1B3A2D", fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box" as const };

export default function CreateOrderPage() {
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [items, setItems] = useState<{ product: any; quantity: number; variant: string }[]>([]);
  const [shippingFee, setShippingFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [orderStatus, setOrderStatus] = useState("processing");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/members").then(r => r.json()).then(d => setMembers(d.members ?? []));
    fetch("/api/admin/products").then(r => r.json()).then(d => setProducts(d.products ?? []));
  }, []);

  const filteredMembers = members.filter(m =>
    !memberSearch || (m.display_name ?? "").toLowerCase().includes(memberSearch.toLowerCase())
  );

  function addItem(product: any) {
    if (items.find(i => i.product.id === product.id)) return;
    setItems(prev => [...prev, { product, quantity: 1, variant: "" }]);
  }

  function updateQty(productId: string, qty: number) {
    if (qty < 1) { setItems(prev => prev.filter(i => i.product.id !== productId)); return; }
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  }

  function updateVariant(productId: string, variant: string) {
    setItems(prev => prev.map(i => i.product.id === productId ? { ...i, variant } : i));
  }

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const total = subtotal + shippingFee - discount;

  async function handleSave() {
    if (!selectedMember) { setError("Select a member"); return; }
    if (!items.length) { setError("Add at least one item"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: selectedMember.id,
        items: items.map(i => ({
          product_id: i.product.id,
          quantity: i.quantity,
          variant: i.variant ? { note: i.variant } : null,
          product: { name: i.product.name, price: i.product.price },
        })),
        subtotal,
        shipping_fee: shippingFee,
        discount,
        total,
        payment_status: paymentStatus,
        order_status: orderStatus,
        notes: notes || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    router.push(`/admin/orders/${data.order.id}`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <button onClick={() => router.back()} style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", background: "none", border: "none", cursor: "pointer", marginBottom: "4px", padding: 0 }}>← Back</button>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", margin: 0 }}>ADD ORDER</h1>
        </div>
      </div>

      {error && <div style={{ background: "#2C1010", border: "2px solid #CC3344", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#CC3344" }}>{error}</div>}

      {/* Member selector */}
      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontFamily: R, fontSize: "11px", color: "#4A7C59", letterSpacing: "2px" }}>MEMBER</div>
        {selectedMember ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "8px", padding: "10px 14px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D" }}>{selectedMember.display_name}</div>
              <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{selectedMember.id.slice(0, 16)}...</div>
            </div>
            <button onClick={() => setSelectedMember(null)} style={{ background: "none", border: "none", color: "#CC3344", cursor: "pointer", fontSize: "16px" }}>✕</button>
          </div>
        ) : (
          <>
            <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Search member by name..." style={inp} />
            {memberSearch && (
              <div style={{ background: "#F7FAF5", border: "1.5px solid #DDE8DD", borderRadius: "8px", maxHeight: "200px", overflowY: "auto" }}>
                {filteredMembers.slice(0, 8).map(m => (
                  <div key={m.id} onClick={() => { setSelectedMember(m); setMemberSearch(""); }}
                    style={{ padding: "10px 14px", cursor: "pointer", fontFamily: B, fontSize: "13px", color: "#1B3A2D", borderBottom: "1px solid #DDE8DD" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#E8F0E4")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {m.display_name ?? "—"}
                  </div>
                ))}
                {filteredMembers.length === 0 && <div style={{ padding: "12px 14px", fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>No members found</div>}
              </div>
            )}
          </>
        )}
      </div>

      {/* Product selector */}
      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontFamily: R, fontSize: "11px", color: "#4A7C59", letterSpacing: "2px" }}>PRODUCTS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {products.map(p => (
            <button key={p.id} onClick={() => addItem(p)}
              disabled={!!items.find(i => i.product.id === p.id)}
              style={{ fontFamily: B, fontSize: "11px", background: items.find(i => i.product.id === p.id) ? "#E8F0E4" : "#F2F7F2", border: `1.5px solid ${items.find(i => i.product.id === p.id) ? "#1A8040" : "#DDE8DD"}`, borderRadius: "6px", padding: "6px 12px", color: items.find(i => i.product.id === p.id) ? "#1A8040" : "#4A7C59", cursor: "pointer" }}>
              {items.find(i => i.product.id === p.id) ? "✓ " : ""}{p.name} — ₱{Number(p.price).toLocaleString()}
            </button>
          ))}
        </div>

        {items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            {items.map(item => (
              <div key={item.product.id} style={{ display: "flex", gap: "10px", alignItems: "center", background: "#F7FAF5", borderRadius: "8px", padding: "10px 14px" }}>
                <div style={{ flex: 1, fontFamily: R, fontSize: "13px", color: "#1B3A2D" }}>{item.product.name}</div>
                <input value={item.variant} onChange={e => updateVariant(item.product.id, e.target.value)}
                  placeholder="Variant (optional)" style={{ ...inp, width: "160px" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button onClick={() => updateQty(item.product.id, item.quantity - 1)} style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#F2F7F2", border: "1.5px solid #DDE8DD", color: "#1B3A2D", cursor: "pointer", fontFamily: R }}>−</button>
                  <span style={{ fontFamily: R, fontSize: "14px", color: "#1B3A2D", minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, item.quantity + 1)} style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#F2F7F2", border: "1.5px solid #DDE8DD", color: "#1B3A2D", cursor: "pointer", fontFamily: R }}>+</button>
                </div>
                <div style={{ fontFamily: R, fontSize: "13px", color: "#1A8040", minWidth: "80px", textAlign: "right" }}>₱{(item.product.price * item.quantity).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing */}
      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontFamily: R, fontSize: "11px", color: "#4A7C59", letterSpacing: "2px" }}>PRICING</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>SHIPPING FEE (₱)</label>
            <input type="number" value={shippingFee} onChange={e => setShippingFee(Number(e.target.value))} style={inp} />
          </div>
          <div>
            <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>DISCOUNT (₱)</label>
            <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} style={inp} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #DDE8DD", paddingTop: "12px" }}>
          <span style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>Subtotal: ₱{subtotal.toLocaleString()}</span>
          <span style={{ fontFamily: R, fontSize: "16px", color: "#1A8040" }}>TOTAL: ₱{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Status */}
      <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontFamily: R, fontSize: "11px", color: "#4A7C59", letterSpacing: "2px" }}>STATUS</div>
        <div>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginBottom: "8px" }}>PAYMENT STATUS</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["pending", "paid", "failed", "cancelled"].map(s => (
              <button key={s} onClick={() => setPaymentStatus(s)}
                style={{ fontFamily: R, fontSize: "11px", padding: "6px 14px", borderRadius: "20px", border: `2px solid ${paymentStatus === s ? "#1A8040" : "#DDE8DD"}`, background: paymentStatus === s ? "#E8F0E4" : "transparent", color: paymentStatus === s ? "#1A8040" : "#5A7A60", cursor: "pointer", letterSpacing: "1px" }}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginBottom: "8px" }}>ORDER STATUS</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["pending", "processing", "shipped", "delivered"].map(s => (
              <button key={s} onClick={() => setOrderStatus(s)}
                style={{ fontFamily: R, fontSize: "11px", padding: "6px 14px", borderRadius: "20px", border: `2px solid ${orderStatus === s ? "#1A8040" : "#DDE8DD"}`, background: orderStatus === s ? "#1A804030" : "transparent", color: orderStatus === s ? "#1A8040" : "#5A7A60", cursor: "pointer", letterSpacing: "1px" }}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", display: "block", marginBottom: "4px" }}>NOTES (optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Walk-in purchase, GCash paid" style={inp} />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{ position: "relative", display: "inline-block", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, alignSelf: "flex-start" }}>
        <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
        <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "12px", background: "#1A8040", color: "#1B3A2D", padding: "12px 32px", border: "2px solid #080F06", borderRadius: "6px", letterSpacing: "1.5px" }}>
          {saving ? "SAVING..." : "CREATE ORDER"}
        </span>
      </button>
    </div>
  );
}
