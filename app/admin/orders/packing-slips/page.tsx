"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

function fmt(n: number) { return Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function dt(iso: string) { return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Manila" }); }

function Slip({ order }: { order: any }) {
  const addr  = order.shipping_address ?? null;
  const items = (order.items ?? []) as any[];
  const totalUnits = items.reduce((n, it) => n + Number(it.quantity ?? 0), 0);
  const shortId    = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="slip-page" style={{ maxWidth: 780, margin: "24px auto", background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: 10, padding: 36, fontFamily: B, color: "#1B3A2D", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 18, borderBottom: "2px solid #1B3A2D" }}>
        <div>
          <div style={{ fontFamily: R, fontSize: "1.5rem", color: "#1B3A2D", letterSpacing: 3 }}>COLET FAN SUPORTA</div>
          <div style={{ fontFamily: B, fontSize: 12, color: "#5A7A60", marginTop: 2 }}>coletfs.com · Support: coletfs.com/support</div>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#7A5A0F", background: "#FFF3D6", borderRadius: 6, padding: "3px 10px", letterSpacing: 1.3, display: "inline-block" }}>PACKING SLIP</div>
          <div style={{ fontFamily: R, fontSize: "1.1rem", color: "#1B3A2D", letterSpacing: 2, marginTop: 6 }}>#{shortId}</div>
          <div style={{ fontFamily: B, fontSize: 11, color: "#5A7A60", marginTop: 2 }}>{dt(order.created_at)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.5, marginBottom: 8 }}>SHIP TO</div>
          {addr ? (
            <div style={{ fontFamily: B, fontSize: 13, lineHeight: 1.55, color: "#1B3A2D" }}>
              <div style={{ fontWeight: 700 }}>{addr.full_name}</div>
              <div>{addr.phone}</div>
              <div style={{ marginTop: 4 }}>{addr.street}{addr.barangay ? `, ${addr.barangay}` : ""}</div>
              <div>{addr.city}{addr.province ? `, ${addr.province}` : ""}</div>
              <div>{[addr.region, addr.zip_code].filter(Boolean).join(" ")}</div>
            </div>
          ) : (
            <div style={{ fontFamily: B, fontSize: 12, color: "#7A8E7A", fontStyle: "italic" as const }}>No shipping address (digital order?)</div>
          )}
        </div>
        <div>
          <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.5, marginBottom: 8 }}>ORDER</div>
          <table style={{ width: "100%", fontFamily: B, fontSize: 12, color: "#1B3A2D", borderCollapse: "collapse" as const }}>
            <tbody>
              <tr><td style={{ color: "#5A7A60", paddingRight: 12 }}>Customer</td><td style={{ fontWeight: 600 }}>{order.profiles?.display_name ?? "Member"}</td></tr>
              <tr><td style={{ color: "#5A7A60", paddingRight: 12 }}>Payment</td><td>{(order.payment_status ?? "").toUpperCase()}</td></tr>
              <tr><td style={{ color: "#5A7A60", paddingRight: 12 }}>Fulfillment</td><td>{(order.order_status ?? "").toUpperCase()}</td></tr>
              {order.paymongo_ref && <tr><td style={{ color: "#5A7A60", paddingRight: 12 }}>PayMongo</td><td style={{ fontFamily: "monospace" as const, fontSize: 11 }}>{order.paymongo_ref}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" as const, marginBottom: 20 }}>
        <thead>
          <tr style={{ background: "#F2F7F2" }}>
            <th style={{ textAlign: "center" as const, padding: "8px 10px", fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.3, width: 60 }}>QTY</th>
            <th style={{ textAlign: "left"   as const, padding: "8px 10px", fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.3 }}>ITEM</th>
            <th style={{ textAlign: "left"   as const, padding: "8px 10px", fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.3, width: 140 }}>VARIANT</th>
            <th style={{ textAlign: "right"  as const, padding: "8px 10px", fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.3, width: 100 }}>LINE</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const unit  = Number(it.product?.price ?? 0);
            const qty   = Number(it.quantity ?? 0);
            const line  = unit * qty;
            const variant = it.variant ? Object.entries(it.variant).map(([k, v]) => `${k}: ${v}`).join(", ") : "—";
            const name  = it.product?.name ?? `Product #${(it.product_id ?? "").slice(0, 8)}`;
            return (
              <tr key={i} style={{ borderBottom: "1px solid #E4EDE4" }}>
                <td style={{ padding: "10px", textAlign: "center" as const, fontFamily: R, fontSize: 14, color: "#1B3A2D" }}>{qty}</td>
                <td style={{ padding: "10px", fontFamily: B, fontSize: 13, color: "#1B3A2D" }}>{name}</td>
                <td style={{ padding: "10px", fontFamily: B, fontSize: 12, color: "#5A7A60" }}>{variant}</td>
                <td style={{ padding: "10px", textAlign: "right" as const, fontFamily: B, fontSize: 13, color: "#1B3A2D", fontWeight: 600 }}>₱{fmt(line)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={{ padding: "10px", fontFamily: SG, fontSize: 11, color: "#5A7A60", letterSpacing: 1.2 }}>
              {totalUnits} unit{totalUnits === 1 ? "" : "s"} · {items.length} line{items.length === 1 ? "" : "s"}
            </td>
            <td style={{ padding: "10px", textAlign: "right" as const, fontFamily: R, fontSize: 13, color: "#1B3A2D", letterSpacing: 1.5, borderTop: "2px solid #1B3A2D" }}>TOTAL</td>
            <td style={{ padding: "10px", textAlign: "right" as const, fontFamily: R, fontSize: 15, color: "#1A8040", letterSpacing: 1, borderTop: "2px solid #1B3A2D" }}>₱{fmt(order.total ?? 0)}</td>
          </tr>
        </tfoot>
      </table>

      {order.notes && (
        <div style={{ marginBottom: 20, padding: 14, background: "#FFFDF4", border: "1.5px solid #F0D889", borderRadius: 8 }}>
          <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#7A5A0F", letterSpacing: 1.3, marginBottom: 4 }}>ORDER NOTES</div>
          <div style={{ fontFamily: B, fontSize: 12, color: "#1B3A2D", whiteSpace: "pre-wrap" as const }}>{order.notes}</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.3, marginBottom: 6 }}>PACKED BY</div>
          <div style={{ borderBottom: "1px dashed #7A8E7A", height: 28 }} />
        </div>
        <div>
          <div style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.3, marginBottom: 6 }}>DATE / TIME</div>
          <div style={{ borderBottom: "1px dashed #7A8E7A", height: 28 }} />
        </div>
      </div>

      <div style={{ textAlign: "center" as const, fontFamily: B, fontSize: 11, color: "#5A7A60", paddingTop: 16, borderTop: "1px solid #E4EDE4" }}>
        Thank you for supporting Bini Colet 💚 · Questions? coletfs.com/support
      </div>
    </div>
  );
}

export default function BatchPackingSlipsPage() {
  const sp    = useSearchParams();
  const idsQ  = sp?.get("ids") ?? "";
  const ids   = idsQ.split(",").map(s => s.trim()).filter(Boolean);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (ids.length === 0) { setLoading(false); return; }
    setLoading(true); setError("");
    Promise.all(ids.map(id => fetch(`/api/admin/orders?id=${id}`).then(r => r.json())))
      .then(results => {
        const errs = results.filter(r => r.error).map(r => r.error);
        if (errs.length) setError(errs.join(" · "));
        setOrders(results.map(r => r.order).filter(Boolean));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsQ]);

  return (
    <>
      <style>{`
        @media print {
          body { background: #ffffff !important; }
          .no-print { display: none !important; }
          .slip-page { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 24px !important; page-break-after: always; }
          .slip-page:last-child { page-break-after: auto; }
          @page { size: A4 portrait; margin: 12mm; }
        }
      `}</style>

      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "#F7FAF5", borderBottom: "1px solid #E4EDE4", position: "sticky", top: 0, zIndex: 10, flexWrap: "wrap", gap: 8 }}>
        <Link href="/admin/orders" style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: 1.2 }}>← BACK TO ORDERS</Link>
        <div style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#1B3A2D", letterSpacing: 1.2 }}>
          {loading ? "LOADING…" : `${orders.length} of ${ids.length} SLIP${ids.length === 1 ? "" : "S"}`}
        </div>
        <button onClick={() => window.print()} disabled={loading || orders.length === 0}
          style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: 10, padding: "10px 18px", cursor: loading ? "wait" : "pointer", letterSpacing: 1.3 }}>
          🖨 PRINT ALL
        </button>
      </div>

      {ids.length === 0 && (
        <div style={{ padding: 48, textAlign: "center", fontFamily: B, color: "#7A8E7A" }}>No orders selected. Go to <Link href="/admin/orders" style={{ color: "#1A8040" }}>orders</Link> and pick some.</div>
      )}
      {error && <div className="no-print" style={{ padding: 16, textAlign: "center", fontFamily: B, color: "#CC3344" }}>{error}</div>}

      {orders.map(o => <Slip key={o.id} order={o} />)}
    </>
  );
}
