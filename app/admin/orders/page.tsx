"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const PC: any = { paid: "#3CCE2A", pending: "#F5C82A", failed: "#F04060", free: "#8EE440", cancelled: "#5A7A50" };
const OC: any = { processing: "#F07228", shipped: "#8EE440", delivered: "#3CCE2A", pending: "#F5C82A", cancelled: "#F04060" };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/admin/orders").then(r => r.json()).then(d => {
      setOrders(d.orders ?? []);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? orders : orders.filter(o =>
    filter === "unpaid" ? o.payment_status === "pending" :
    filter === "paid" ? o.payment_status === "paid" :
    filter === "processing" ? o.order_status === "processing" :
    filter === "shipped" ? o.order_status === "shipped" : true
  );

  const totalRevenue = orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = orders.filter(o => o.payment_status === "pending").length;
  const processingCount = orders.filter(o => o.order_status === "processing").length;

  const FILTERS = [
    { key: "all", label: "ALL" },
    { key: "unpaid", label: "UNPAID" },
    { key: "paid", label: "PAID" },
    { key: "processing", label: "PROCESSING" },
    { key: "shipped", label: "SHIPPED" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>ORDERS</h1>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>
          {orders.length} orders · <span style={{ color: "#F07228" }}>₱{totalRevenue.toLocaleString()} revenue</span>
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        {[
          { label: "TOTAL ORDERS", value: orders.length, color: "#F0EAD6" },
          { label: "REVENUE", value: `₱${totalRevenue.toLocaleString()}`, color: "#F07228" },
          { label: "PENDING PAYMENT", value: pendingCount, color: "#F5C82A" },
          { label: "TO PROCESS", value: processingCount, color: "#3CCE2A" },
        ].map(s => (
          <div key={s.label} style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "10px", padding: "14px 18px" }}>
            <div style={{ fontFamily: R, fontSize: "1.4rem", color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50", letterSpacing: "1px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ fontFamily: R, fontSize: "11px", letterSpacing: "1px", padding: "6px 14px", borderRadius: "20px", border: `2px solid ${filter === f.key ? "#F07228" : "#2C4820"}`, background: filter === f.key ? "#F07228" : "transparent", color: filter === f.key ? "#080F06" : "#5A7A50", cursor: "pointer" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div style={{ fontFamily: R, color: "#5A7A50", letterSpacing: "2px", padding: "40px", textAlign: "center" }}>LOADING...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((o: any) => (
            <div key={o.id} style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "14px 20px", display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: R, fontSize: "12px", color: "#F0EAD6", letterSpacing: "1px", marginBottom: "4px" }}>
                  #{o.id.slice(0, 8).toUpperCase()} · <span style={{ color: "#8AAA78" }}>{o.profiles?.display_name ?? "Member"}</span>
                </div>
                <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>
                  {new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  {o.shipping_address?.city && ` · ${o.shipping_address.city}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span style={{ fontFamily: R, fontSize: "13px", color: "#F07228" }}>₱{Number(o.total).toLocaleString()}</span>
                <span style={{ fontFamily: R, fontSize: "10px", color: PC[o.payment_status] ?? "#5A7A50", background: (PC[o.payment_status] ?? "#5A7A50") + "20", border: `1px solid ${(PC[o.payment_status] ?? "#5A7A50")}40`, borderRadius: "20px", padding: "2px 10px", letterSpacing: "1px" }}>
                  {o.payment_status.toUpperCase()}
                </span>
                <span style={{ fontFamily: R, fontSize: "10px", color: OC[o.order_status] ?? "#5A7A50", background: (OC[o.order_status] ?? "#5A7A50") + "20", border: `1px solid ${(OC[o.order_status] ?? "#5A7A50")}40`, borderRadius: "20px", padding: "2px 10px", letterSpacing: "1px" }}>
                  {(o.order_status ?? "pending").toUpperCase()}
                </span>
                <Link href={`/admin/orders/${o.id}`} style={{ textDecoration: "none", fontFamily: B, fontSize: "11px", color: "#8AAA78", border: "1px solid #2C4820", borderRadius: "6px", padding: "6px 12px", letterSpacing: "1px" }}>
                  VIEW →
                </Link>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A50" }}>
              NO ORDERS {filter !== "all" ? `WITH STATUS "${filter.toUpperCase()}"` : "YET"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
