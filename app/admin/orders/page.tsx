"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminActionButton from "@/components/shared/AdminActionButton";
import StatBar from "@/components/shared/StatBar";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const PC: any = { paid: "#1A8040", pending: "#156530", failed: "#CC3344", free: "#1A8040", cancelled: "#5A7A60" };
const OC: any = { processing: "#1A8040", shipped: "#1A8040", delivered: "#1A8040", pending: "#156530", cancelled: "#CC3344" };

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg]   = useState("");

  async function refresh() {
    const r = await fetch("/api/admin/orders");
    const d = await r.json();
    setOrders(d.orders ?? []);
  }

  useEffect(() => { refresh().finally(() => setLoading(false)); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(o => {
      const passFilter =
        filter === "all" ? true :
        filter === "unpaid" ? o.payment_status === "pending" :
        filter === "paid" ? o.payment_status === "paid" :
        filter === "processing" ? o.order_status === "processing" :
        filter === "shipped" ? o.order_status === "shipped" : true;
      if (!passFilter) return false;
      if (!q) return true;
      return o.id.toLowerCase().includes(q)
          || (o.profiles?.display_name ?? "").toLowerCase().includes(q)
          || (o.shipping_address?.full_name ?? "").toLowerCase().includes(q)
          || (o.shipping_address?.city ?? "").toLowerCase().includes(q);
    });
  }, [orders, filter, search]);

  function toggleOne(id: string) {
    setSelected(prev => { const c = new Set(prev); if (c.has(id)) c.delete(id); else c.add(id); return c; });
  }
  function toggleAll() {
    const allVisible = filtered.map(o => o.id);
    const allChecked = allVisible.every(id => selected.has(id));
    setSelected(prev => {
      const c = new Set(prev);
      if (allChecked) allVisible.forEach(id => c.delete(id));
      else            allVisible.forEach(id => c.add(id));
      return c;
    });
  }

  async function bulk(patch: any, label: string) {
    if (selected.size === 0) return;
    if (!confirm(`${label} for ${selected.size} order${selected.size === 1 ? "" : "s"}?`)) return;
    setBulkBusy(true); setBulkMsg("");
    try {
      const r = await fetch("/api/admin/orders/bulk", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: Array.from(selected), ...patch }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setBulkMsg(`Updated ${d.updated} order${d.updated === 1 ? "" : "s"}.`);
      setSelected(new Set());
      refresh();
    } catch (e: any) { setBulkMsg(e.message); }
    finally { setBulkBusy(false); }
  }

  function openBatchSlips() {
    if (selected.size === 0) return;
    const url = `/admin/orders/packing-slips?ids=${Array.from(selected).join(",")}`;
    window.open(url, "_blank");
  }

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4px" }}>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px" }}>ORDERS</h1>
          <Link href="/admin/orders/create" style={{ textDecoration: "none", position: "relative", display: "inline-block" }}>
            <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "10px" }} />
            <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "12px", fontWeight: 700, background: "#1A8040", color: "#ffffff", padding: "11px 22px", border: "1.5px solid #1B3A2D", borderRadius: "10px", letterSpacing: "1.5px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              ADD ORDER
            </span>
          </Link>
        </div>
        <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>
          {orders.length} orders · <span style={{ color: "#1A8040" }}>₱{totalRevenue.toLocaleString()} revenue</span>
        </p>
      </div>

      {/* Stats */}
      <StatBar items={[
        { label: "TOTAL ORDERS",    value: orders.length,                          color: "#1B3A2D", active: filter === "all",        onClick: () => setFilter("all") },
        { label: "REVENUE",         value: `₱${totalRevenue.toLocaleString()}`,    color: "#1A8040" },
        { label: "PENDING PAYMENT", value: pendingCount,                           color: "#156530", active: filter === "unpaid",     onClick: () => setFilter("unpaid") },
        { label: "TO PROCESS",      value: processingCount,                        color: "#1A8040", active: filter === "processing", onClick: () => setFilter("processing") },
      ]} />


      {/* Filters + search */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        {FILTERS.map(f => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)} style={{ fontFamily: R, fontSize: "11px", letterSpacing: "1px", padding: "6px 14px", borderRadius: "20px", border: `1.5px solid ${filter === f.key ? "#1A8040" : "#DDE8DD"}`, background: filter === f.key ? "#1A8040" : "transparent", color: filter === f.key ? "#ffffff" : "#5A7A60", cursor: "pointer", outline: "none" }}>
            {f.label}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order id / customer / city…"
          style={{ flex: 1, minWidth: 200, background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 8, padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: 13, outline: "none" }} />
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "#FFF3D6", border: "1.5px solid #F0D889", borderRadius: 12, padding: "10px 14px" }}>
          <span style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#7A5A0F", letterSpacing: 1.3 }}>{selected.size} SELECTED</span>
          <button onClick={openBatchSlips} disabled={bulkBusy}
            style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#7A5A0F", background: "#ffffff", border: "1.5px solid #F0D889", borderRadius: 8, padding: "6px 12px", cursor: "pointer", letterSpacing: 1.2 }}>
            🖨 PRINT SLIPS
          </button>
          <button onClick={() => bulk({ order_status: "processing" }, "Mark PROCESSING")} disabled={bulkBusy}
            style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#156530", background: "#ffffff", border: "1.5px solid #B7D8B7", borderRadius: 8, padding: "6px 12px", cursor: "pointer", letterSpacing: 1.2 }}>
            MARK PROCESSING
          </button>
          <button onClick={() => bulk({ order_status: "shipped" }, "Mark SHIPPED")} disabled={bulkBusy}
            style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", letterSpacing: 1.2 }}>
            MARK SHIPPED
          </button>
          <button onClick={() => bulk({ order_status: "delivered" }, "Mark DELIVERED")} disabled={bulkBusy}
            style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#156530", background: "#ffffff", border: "1.5px solid #B7D8B7", borderRadius: 8, padding: "6px 12px", cursor: "pointer", letterSpacing: 1.2 }}>
            MARK DELIVERED
          </button>
          <button onClick={() => setSelected(new Set())} disabled={bulkBusy}
            style={{ marginLeft: "auto", fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: 8, padding: "6px 12px", cursor: "pointer", letterSpacing: 1.2 }}>
            CLEAR
          </button>
        </div>
      )}
      {bulkMsg && <div style={{ fontFamily: B, fontSize: 12, color: bulkMsg.startsWith("Updated") ? "#156530" : "#CC3344" }}>{bulkMsg}</div>}

      {/* Orders list */}
      {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.length > 0 && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 6px", fontFamily: B, fontSize: 12, color: "#5A7A60", cursor: "pointer" }}>
              <input type="checkbox" checked={filtered.every(o => selected.has(o.id))} onChange={toggleAll} />
              Select all {filtered.length}
            </label>
          )}
          {filtered.map((o: any) => (
            <div key={o.id} style={{ background: "#FFFFFF", border: `2px solid ${selected.has(o.id) ? "#F0D889" : "#DDE8DD"}`, borderRadius: "12px", padding: "14px 20px", display: "flex", gap: "16px", alignItems: "center" }}>
              <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} onClick={e => e.stopPropagation()}
                style={{ flexShrink: 0, cursor: "pointer" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "1px", marginBottom: "4px" }}>
                  #{o.id.slice(0, 8).toUpperCase()} · <span style={{ color: "#4A7C59" }}>{o.profiles?.display_name ?? "Member"}</span>
                </div>
                <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>
                  {new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  {o.shipping_address?.city && ` · ${o.shipping_address.city}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span style={{ fontFamily: R, fontSize: "13px", color: "#1A8040" }}>₱{Number(o.total).toLocaleString()}</span>
                <span style={{ fontFamily: R, fontSize: "10px", color: PC[o.payment_status] ?? "#5A7A60", background: (PC[o.payment_status] ?? "#5A7A60") + "20", border: `1px solid ${(PC[o.payment_status] ?? "#5A7A60")}40`, borderRadius: "20px", padding: "2px 10px", letterSpacing: "1px" }}>
                  {o.payment_status.toUpperCase()}
                </span>
                <span style={{ fontFamily: R, fontSize: "10px", color: OC[o.order_status] ?? "#5A7A60", background: (OC[o.order_status] ?? "#5A7A60") + "20", border: `1px solid ${(OC[o.order_status] ?? "#5A7A60")}40`, borderRadius: "20px", padding: "2px 10px", letterSpacing: "1px" }}>
                  {(o.order_status ?? "pending").toUpperCase()}
                </span>
                <AdminActionButton href={`/admin/orders/${o.id}`} variant="primary">VIEW →</AdminActionButton>
              </div>
            </div>
          ))}
          {!filtered.length && (
            <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A60" }}>
              NO ORDERS {filter !== "all" ? `WITH STATUS "${filter.toUpperCase()}"` : "YET"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
