"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const PC: any = { paid: "#3CCE2A", pending: "#F5C82A", failed: "#F04060", free: "#8EE440", cancelled: "#5A7A50" };
const OC: any = { processing: "#F07228", shipped: "#8EE440", delivered: "#3CCE2A", pending: "#F5C82A", cancelled: "#F04060" };
const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "cancelled"];

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/orders?id=${id}`).then(r => r.json()).then(d => {
      setOrder(d.order);
      setOrderStatus(d.order?.order_status ?? "pending");
      setPaymentStatus(d.order?.payment_status ?? "pending");
      setLoading(false);
    }).catch(() => { setError("Failed to load order"); setLoading(false); });
  }, [id]);

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, order_status: orderStatus, payment_status: paymentStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setOrder(data.order);
      setSuccess("Order updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
  if (!order) return <div style={{ fontFamily: R, color: "#F04060", padding: "40px" }}>Order not found.</div>;

  const addr = order.shipping_address;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>
            ORDER #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#5A7A50" }}>
            {new Date(order.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <button onClick={() => router.back()} style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>

      {error && <div style={{ background: "#2C1010", border: "2px solid #F04060", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#F04060" }}>{error}</div>}
      {success && <div style={{ background: "#1A3D14", border: "2px solid #3CCE2A", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#3CCE2A" }}>{success}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Customer info */}
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#8AAA78", letterSpacing: "2px", marginBottom: "12px" }}>CUSTOMER</div>
          <div style={{ fontFamily: R, fontSize: "14px", color: "#F0EAD6", marginBottom: "4px" }}>{order.profiles?.display_name ?? "Member"}</div>
          {addr && (
            <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", lineHeight: 1.6 }}>
              <div>{addr.full_name}</div>
              <div>{addr.phone}</div>
              <div>{addr.street}, {addr.barangay}</div>
              <div>{addr.city}, {addr.province}</div>
              <div>{addr.region} {addr.zip_code}</div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#8AAA78", letterSpacing: "2px", marginBottom: "12px" }}>SUMMARY</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              { label: "Subtotal", value: `₱${Number(order.subtotal).toLocaleString()}` },
              { label: "Shipping", value: `₱${Number(order.shipping_fee ?? 0).toLocaleString()}` },
              { label: "Discount", value: `-₱${Number(order.discount ?? 0).toLocaleString()}`, color: "#3CCE2A" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontFamily: B, fontSize: "12px", color: row.color ?? "#5A7A50" }}>
                <span>{row.label}</span><span>{row.value}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #2C4820", paddingTop: "8px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: R, fontSize: "14px", color: "#F0EAD6", letterSpacing: "1px" }}>TOTAL</span>
              <span style={{ fontFamily: R, fontSize: "16px", color: "#F07228" }}>₱{Number(order.total).toLocaleString()}</span>
            </div>
          </div>
          {order.paymongo_ref && (
            <div style={{ marginTop: "10px", fontFamily: B, fontSize: "11px", color: "#3A5A30" }}>
              PayMongo: {order.paymongo_ref}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontFamily: R, fontSize: "11px", color: "#8AAA78", letterSpacing: "2px", marginBottom: "12px" }}>ITEMS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {order.items.map((item: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < order.items.length - 1 ? "1px solid #2C4820" : "none" }}>
                <div>
                  <div style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", letterSpacing: "1px" }}>{item.product?.name ?? `Product #${item.product_id?.slice(0, 8)}`}</div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>
                    Qty: {item.quantity}
                    {item.variant && ` · ${Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(", ")}`}
                  </div>
                </div>
                <span style={{ fontFamily: R, fontSize: "13px", color: "#F07228" }}>
                  ₱{(Number(item.product?.price ?? 0) * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status update */}
      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ fontFamily: R, fontSize: "11px", color: "#8AAA78", letterSpacing: "2px" }}>UPDATE STATUS</div>

        <div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", letterSpacing: "1px", marginBottom: "8px" }}>ORDER STATUS</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {ORDER_STATUSES.map(s => (
              <button key={s} onClick={() => setOrderStatus(s)} style={{ fontFamily: R, fontSize: "11px", letterSpacing: "1px", padding: "6px 14px", borderRadius: "20px", border: `2px solid ${orderStatus === s ? OC[s] : "#2C4820"}`, background: orderStatus === s ? OC[s] + "30" : "transparent", color: orderStatus === s ? OC[s] : "#5A7A50", cursor: "pointer" }}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", letterSpacing: "1px", marginBottom: "8px" }}>PAYMENT STATUS</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {PAYMENT_STATUSES.map(s => (
              <button key={s} onClick={() => setPaymentStatus(s)} style={{ fontFamily: R, fontSize: "11px", letterSpacing: "1px", padding: "6px 14px", borderRadius: "20px", border: `2px solid ${paymentStatus === s ? PC[s] : "#2C4820"}`, background: paymentStatus === s ? PC[s] + "30" : "transparent", color: paymentStatus === s ? PC[s] : "#5A7A50", cursor: "pointer" }}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{ alignSelf: "flex-start", position: "relative", display: "inline-block", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
          <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
          <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "12px", background: "#F07228", color: "#F0EAD6", padding: "10px 28px", border: "2px solid #080F06", borderRadius: "6px", letterSpacing: "1.5px" }}>
            {saving ? "SAVING..." : "UPDATE ORDER"}
          </span>
        </button>
      </div>
    </div>
  );
}
