"use client";
import { SkListLoading } from "@/components/shared/Skeleton";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminActionButton from "@/components/shared/AdminActionButton";
import StatBar from "@/components/shared/StatBar";
import { IconPrinter } from "@/components/shared/Icons";
import { usePagination, TableCountBar, TablePagination } from "@/components/shared/TablePagination";

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
  const [placed, setPlaced] = useState<"any" | "7d" | "30d" | "90d">("any");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg]   = useState("");

  async function refresh() {
    const r = await fetch("/api/admin/orders");
    const d = await r.json();
    setOrders(d.orders ?? []);
  }

  useEffect(() => { refresh().finally(() => setLoading(false)); }, []);

  // One predicate per filter key, shared by the chips and their counts — a chip
  // can never disagree with the rows it produces. DELIVERED and CANCELLED were
  // missing entirely: those orders existed but could not be isolated.
  // NEEDS TRACKING is the operational one — shipped with no tracking number is
  // exactly the set a customer emails about.
  const MATCHERS: Record<string, (o: any) => boolean> = {
    all:        () => true,
    unpaid:     o => o.payment_status === "pending",
    paid:       o => o.payment_status === "paid",
    processing: o => o.order_status === "processing",
    shipped:    o => o.order_status === "shipped",
    delivered:  o => o.order_status === "delivered",
    cancelled:  o => o.order_status === "cancelled",
    untracked:  o => o.order_status === "shipped" && !o.tracking_number,
  };

  const placedCutoff = useMemo(() => {
    if (placed === "any") return 0;
    const days = placed === "7d" ? 7 : placed === "30d" ? 30 : 90;
    return Date.now() - days * 24 * 60 * 60 * 1000;
  }, [placed]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(o => {
      if (!(MATCHERS[filter] ?? MATCHERS.all)(o)) return false;
      if (placedCutoff && new Date(o.created_at).getTime() < placedCutoff) return false;
      if (!q) return true;
      // Tracking number included so "where is TRK123" is answerable by pasting
      // the number a customer quotes.
      return o.id.toLowerCase().includes(q)
          || (o.profiles?.display_name ?? "").toLowerCase().includes(q)
          || (o.shipping_address?.full_name ?? "").toLowerCase().includes(q)
          || (o.shipping_address?.city ?? "").toLowerCase().includes(q)
          || (o.tracking_number ?? "").toLowerCase().includes(q)
          || (o.courier ?? "").toLowerCase().includes(q);
    });
  }, [orders, filter, search, placedCutoff]);

  // Counts over ALL orders, not the filtered subset, so a chip states how many
  // exist rather than how many survive the other filters.
  const countFor = (key: string) => orders.filter(MATCHERS[key] ?? MATCHERS.all).length;
  const filtersActive = !!search || filter !== "all" || placed !== "any";
  const clearFilters  = () => { setSearch(""); setFilter("all"); setPlaced("any"); };

  // Orders is empty today but grows one row per sale. Paging it now means the
  // page never becomes the problem later. resetKey returns to page 1 whenever
  // the status filter or search narrows the list.
  const { page, setPage, pageSize, setPageSize, pageCount, startIdx, paged } =
    usePagination(filtered, 25, `${filter}|${search}|${placed}`);

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
    { key: "untracked", label: "NEEDS TRACKING" },
    { key: "delivered", label: "DELIVERED" },
    { key: "cancelled", label: "CANCELLED" },
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
        {FILTERS.map(f => {
          const active = filter === f.key;
          // Orders needing tracking are a to-do, not a status — amber marks it.
          const accent = f.key === "untracked" ? "#B78A1F" : f.key === "cancelled" ? "#CC3344" : "#1A8040";
          const n = countFor(f.key);
          return (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              style={{ fontFamily: R, fontSize: "11px", letterSpacing: "1px", padding: "6px 14px", borderRadius: "20px", border: `1.5px solid ${active ? accent : "#DDE8DD"}`, background: active ? accent : "transparent", color: active ? "#ffffff" : "#5A7A60", cursor: "pointer", outline: "none", display: "inline-flex", alignItems: "center", gap: "7px" }}>
              {f.label}
              <span style={{ fontFamily: B, fontSize: "10px", fontWeight: 700, background: active ? "rgba(255,255,255,0.25)" : `${accent}18`, color: active ? "#ffffff" : accent, borderRadius: "999px", padding: "1px 7px" }}>
                {n}
              </span>
            </button>
          );
        })}

        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", letterSpacing: 1.2 }}>
          PLACED
          <select value={placed} onChange={e => setPlaced(e.target.value as "any" | "7d" | "30d" | "90d")}
            style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#1B3A2D", background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: 8, padding: "5px 8px", cursor: "pointer" }}>
            <option value="any">Any time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </label>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order id / customer / city / tracking…"
          style={{ flex: 1, minWidth: 200, background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 8, padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: 13, outline: "none" }} />

        {filtersActive && (
          <button type="button" onClick={clearFilters}
            style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#5A7A60", background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 999, padding: "7px 14px", cursor: "pointer", letterSpacing: 1.2 }}>
            CLEAR FILTERS
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "#FFF3D6", border: "1.5px solid #F0D889", borderRadius: 12, padding: "10px 14px" }}>
          <span style={{ fontFamily: SG, fontSize: 11, fontWeight: 700, color: "#7A5A0F", letterSpacing: 1.3 }}>{selected.size} SELECTED</span>
          <button onClick={openBatchSlips} disabled={bulkBusy}
            style={{ fontFamily: SG, fontSize: 10, fontWeight: 700, color: "#7A5A0F", background: "#ffffff", border: "1.5px solid #F0D889", borderRadius: 8, padding: "6px 12px", cursor: "pointer", letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <IconPrinter size={10} color="#7A5A0F" /> PRINT SLIPS
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
      <SkListLoading />
    </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.length > 0 && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 6px", fontFamily: B, fontSize: 12, color: "#5A7A60", cursor: "pointer" }}>
              <input type="checkbox" checked={filtered.every(o => selected.has(o.id))} onChange={toggleAll} />
              Select all {filtered.length}
            </label>
          )}
          <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
            <TableCountBar total={orders.length} filteredTotal={filtered.length} pageSize={pageSize} setPageSize={setPageSize} noun="ORDERS" />
          </div>
          {paged.map((o: any) => (
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
          <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
            <TablePagination page={page} setPage={setPage} pageCount={pageCount} startIdx={startIdx} pageSize={pageSize} filteredTotal={filtered.length} />
          </div>
        </div>
      )}
    </div>
  );
}
