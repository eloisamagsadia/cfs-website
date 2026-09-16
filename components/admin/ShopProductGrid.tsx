"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AdminActionButton from "@/components/shared/AdminActionButton";
import ProductVisibilityToggle from "@/components/admin/ProductVisibilityToggle";
import { IconEdit, IconEye, IconEyeOff, IconShoppingBag, IconX } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

// Product grid with multi-select. Hiding a whole shop one card at a time is
// the slow path this replaces — tick the products, hit one action.
//
// Three views over the same selection state: GRID (visual, for picking merch
// by sight), LIST (dense, for scanning price/stock across everything), and
// KANBAN (products bucketed by stock level, so "what's about to run out" is
// answerable at a glance). Selection and bulk actions work identically in all
// three — switching view never loses what you've ticked.

type View = "grid" | "list" | "kanban";

const VIEW_STORAGE_KEY = "cfs.admin.shop.view";

// ONE template drives the list header and every list row. They cannot drift
// apart, which is the bug class that produced the header-alignment fixes on
// /admin/members and the attendees table.
const LIST_COLS = "34px 52px minmax(160px,2.2fr) minmax(90px,1fr) 88px 104px 92px minmax(190px,auto)";

// Stock buckets. Mirrors the out/low maths in app/admin/shop/page.tsx — if that
// threshold ever moves, both must move together.
const STOCK_BUCKETS = [
  { key: "in",   label: "IN STOCK",  hint: "more than 5",  color: "#1A8040", bg: "#E8F0E4", border: "#C7DFC7", match: (s: number) => s > 5 },
  { key: "low",  label: "LOW STOCK", hint: "5 or fewer",   color: "#B78A1F", bg: "#FFF7E6", border: "#F0D889", match: (s: number) => s > 0 && s <= 5 },
  { key: "out",  label: "SOLD OUT",  hint: "none left",    color: "#CC3344", bg: "#FFF0F2", border: "#F2C2C8", match: (s: number) => s <= 0 },
] as const;

export default function ShopProductGrid({ products }: { products: any[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>("grid");
  const [, startTransition] = useTransition();

  // Read the saved view after mount rather than in useState's initialiser, so
  // server and first client render agree and React doesn't flag a mismatch.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (saved === "grid" || saved === "list" || saved === "kanban") setView(saved);
    } catch { /* private mode / storage disabled — the default is fine */ }
  }, []);

  const chooseView = (v: View) => {
    setView(v);
    try { window.localStorage.setItem(VIEW_STORAGE_KEY, v); } catch { /* non-fatal */ }
  };

  const allIds = useMemo(() => products.map(p => p.id), [products]);
  const allSelected = selected.size > 0 && selected.size === allIds.length;

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => (prev.size === allIds.length ? new Set() : new Set(allIds)));
  };

  async function bulkSet(is_active: boolean) {
    if (busy || selected.size === 0) return;
    const ids = Array.from(selected);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Request failed");
      toast.success(
        is_active
          ? `${data.updated} product${data.updated === 1 ? "" : "s"} now visible in the shop.`
          : `${data.updated} product${data.updated === 1 ? "" : "s"} hidden from the shop.`
      );
      setSelected(new Set());
      startTransition(() => router.refresh());
    } catch (e: any) {
      toast.error(e?.message ?? "Bulk update failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const hiddenCount = products.filter(p => p.is_active === false).length;

  const columns = useMemo(
    () => STOCK_BUCKETS.map(b => ({ ...b, items: products.filter(p => b.match(Number(p.stock ?? 0))) })),
    [products]
  );

  const selectBox = (id: string, size = 16) => (
    <input
      type="checkbox"
      checked={selected.has(id)}
      onChange={() => toggleOne(id)}
      style={{ width: `${size}px`, height: `${size}px`, accentColor: "#1A8040", cursor: "pointer", margin: 0 }}
    />
  );

  const stockLabel = (p: any) => {
    const s = Number(p.stock ?? 0);
    if (s <= 0) return { text: "OUT OF STOCK", color: "#CC3344" };
    if (s <= 5) return { text: `${s} left`,    color: "#B78A1F" };
    return { text: `${s} in stock`,            color: "#1A8040" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <style>{`
        .shg-list-row:hover { background: #F7FAF5; }
        @media (max-width: 900px) {
          .shg-list-scroll { overflow-x: auto; }
          .shg-list-inner  { min-width: 880px; }
        }
      `}</style>

      {/* Selection toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "12px", padding: "12px 16px" }}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            style={{ width: "17px", height: "17px", accentColor: "#1A8040", cursor: "pointer" }}
          />
          <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", letterSpacing: "1.2px" }}>
            {allSelected ? "DESELECT ALL" : "SELECT ALL"}
          </span>
        </label>

        <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>
          {selected.size > 0 ? `${selected.size} selected` : `${products.length} products · ${hiddenCount} hidden`}
        </span>

        {/* View switcher — segmented control, always visible so the current
            view is obvious rather than hidden behind a menu. */}
        <div style={{ display: "inline-flex", gap: "2px", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "3px", marginLeft: selected.size > 0 ? undefined : "auto" }}>
          {([
            { key: "grid",   label: "GRID" },
            { key: "list",   label: "LIST" },
            { key: "kanban", label: "KANBAN" },
          ] as { key: View; label: string }[]).map(v => {
            const active = view === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => chooseView(v.key)}
                aria-pressed={active}
                style={{
                  fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "1.2px",
                  color: active ? "#ffffff" : "#5A7A60",
                  background: active ? "#1A8040" : "transparent",
                  border: "none", borderRadius: "7px", padding: "7px 13px", cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}>
                {v.label}
              </button>
            );
          })}
        </div>

        {selected.size > 0 && (
          <div style={{ display: "flex", gap: "8px", marginLeft: "auto", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => bulkSet(false)}
              disabled={busy}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#B45309", background: "#FFF3E0", border: "1.5px solid #F0C48A", borderRadius: "10px", padding: "9px 16px", letterSpacing: "1.2px", cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}
            >
              <IconEyeOff size={12} color="#B45309" /> HIDE SELECTED
            </button>
            <button
              type="button"
              onClick={() => bulkSet(true)}
              disabled={busy}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", background: "#E8F0E4", border: "1.5px solid #C7DFC7", borderRadius: "10px", padding: "9px 16px", letterSpacing: "1.2px", cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}
            >
              <IconEye size={12} color="#1B3A2D" /> SHOW SELECTED
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              disabled={busy}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "9px 14px", letterSpacing: "1.2px", cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}
            >
              <IconX size={12} color="#5A7A60" /> CLEAR
            </button>
          </div>
        )}
      </div>

      {!products.length && (
        <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A60" }}>
          NO PRODUCTS YET
        </div>
      )}

      {/* ── GRID ── */}
      {!!products.length && view === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "10px" }}>
          {products.map((p: any) => {
            const isSel = selected.has(p.id);
            return (
              <div
                key={p.id}
                style={{ background: "#FFFFFF", border: `2px solid ${isSel ? "#1A8040" : "#DDE8DD"}`, borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: isSel ? "0 4px 14px rgba(26,128,64,0.18)" : "none", transition: "border-color 0.15s, box-shadow 0.15s" }}
              >
                <div style={{ height: "140px", background: "#F2F7F2", overflow: "hidden", position: "relative" }}>
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><IconShoppingBag size={32} color="#DDE8DD" /></div>
                  }
                  {/* Select checkbox sits on the image so the whole card stays clickable-free */}
                  <label
                    style={{ position: "absolute", top: "8px", left: "8px", zIndex: 2, display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", background: "rgba(255,255,255,0.95)", border: `1.5px solid ${isSel ? "#1A8040" : "#DDE8DD"}`, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}
                    title={isSel ? "Deselect" : "Select"}
                  >
                    {selectBox(p.id)}
                  </label>
                </div>

                <div style={{ padding: "14px", flex: 1 }}>
                  <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "1px", marginBottom: "4px" }}>{p.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: R, fontSize: "14px", color: "#1A8040" }}>₱{Number(p.price).toLocaleString()}</span>
                    <span style={{ fontFamily: B, fontSize: "11px", color: stockLabel(p).color }}>
                      {stockLabel(p).text}
                    </span>
                  </div>
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", marginTop: "4px" }}>
                    {p.product_categories?.name ?? "Uncategorized"}
                  </div>
                  {!p.is_active && (
                    <div style={{ marginTop: "6px", display: "inline-block", background: "#FFE8EC", border: "1px solid #CC3344", borderRadius: "4px", padding: "2px 8px", fontFamily: B, fontSize: "10px", color: "#CC3344" }}>
                      INACTIVE
                    </div>
                  )}
                </div>

                {/* Edit + one-click hide/show + jump to the public page. The single
                    toggle stays useful for one-off changes; the toolbar above
                    handles the whole shop at once. */}
                <div style={{ padding: "0 14px 14px", display: "flex", gap: "8px", alignItems: "stretch", flexWrap: "wrap" }}>
                  <AdminActionButton href={`/admin/shop/${p.id}/edit`} variant="primary" icon={<IconEdit size={12} color="#ffffff" />}>EDIT</AdminActionButton>
                  <ProductVisibilityToggle id={p.id} initialActive={p.is_active ?? true} />
                  {p.product_categories?.slug && (
                    <AdminActionButton href={`/shop/${p.product_categories.slug}/${p.id}`} variant="secondary" icon={<IconEye size={12} color="#1B3A2D" />}>VIEW</AdminActionButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LIST ── dense scan of price/stock/visibility across everything ── */}
      {!!products.length && view === "list" && (
        <div className="shg-list-scroll" style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: "12px", overflow: "hidden" }}>
          <div className="shg-list-inner">
            {/* Header — same LIST_COLS template as the rows below */}
            <div style={{ display: "grid", gridTemplateColumns: LIST_COLS, gap: "12px", alignItems: "center", padding: "11px 16px", background: "#F2F7F2", borderBottom: "1.5px solid #DDE8DD" }}>
              <span />
              <span />
              {["PRODUCT", "CATEGORY", "PRICE", "STOCK", "STATUS", "ACTIONS"].map(h => (
                <span key={h} style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#5A7A60", letterSpacing: "1.4px" }}>{h}</span>
              ))}
            </div>

            {products.map((p: any) => {
              const isSel = selected.has(p.id);
              const st = stockLabel(p);
              return (
                <div
                  key={p.id}
                  className="shg-list-row"
                  style={{ display: "grid", gridTemplateColumns: LIST_COLS, gap: "12px", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #EDF3ED", background: isSel ? "#F0F7F0" : "transparent", transition: "background 0.12s" }}
                >
                  <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }} title={isSel ? "Deselect" : "Select"}>
                    {selectBox(p.id, 17)}
                  </label>

                  <div style={{ width: "44px", height: "44px", borderRadius: "8px", overflow: "hidden", background: "#F2F7F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <IconShoppingBag size={18} color="#DDE8DD" />}
                  </div>

                  <span style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "0.6px", lineHeight: 1.35 }}>{p.name}</span>

                  <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>
                    {p.product_categories?.name ?? "Uncategorized"}
                  </span>

                  <span style={{ fontFamily: R, fontSize: "13px", color: "#1A8040" }}>₱{Number(p.price).toLocaleString()}</span>

                  <span style={{ fontFamily: B, fontSize: "11px", fontWeight: 600, color: st.color }}>{st.text}</span>

                  <span style={{ justifySelf: "start", fontFamily: SG, fontSize: "9px", fontWeight: 700, letterSpacing: "1.2px", borderRadius: "999px", padding: "3px 9px", color: p.is_active === false ? "#B45309" : "#1B3A2D", background: p.is_active === false ? "#FFF3E0" : "#E8F0E4", border: `1px solid ${p.is_active === false ? "#F0C48A" : "#C7DFC7"}` }}>
                    {p.is_active === false ? "HIDDEN" : "LIVE"}
                  </span>

                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <AdminActionButton href={`/admin/shop/${p.id}/edit`} variant="primary" icon={<IconEdit size={11} color="#ffffff" />}>EDIT</AdminActionButton>
                    <ProductVisibilityToggle id={p.id} initialActive={p.is_active ?? true} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── KANBAN ── bucketed by stock level. Read-only by design: a column is
          derived from a number, so dragging a card between columns has no
          sensible meaning. Change stock via EDIT or the stock dashboard. ── */}
      {!!products.length && view === "kanban" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "12px", alignItems: "start" }}>
          {columns.map(col => (
            <div key={col.key} style={{ background: "#FFFFFF", border: `1.5px solid ${col.border}`, borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ background: col.bg, borderBottom: `1.5px solid ${col.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: col.color, letterSpacing: "1.4px" }}>{col.label}</span>
                <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: col.color, borderRadius: "999px", padding: "2px 8px" }}>{col.items.length}</span>
                <span style={{ marginLeft: "auto", fontFamily: B, fontSize: "10px", color: "#7A8E7A" }}>{col.hint}</span>
              </div>

              <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "8px", minHeight: "80px" }}>
                {col.items.map((p: any) => {
                  const isSel = selected.has(p.id);
                  return (
                    <div key={p.id} style={{ background: isSel ? "#F0F7F0" : "#FFFFFF", border: `1.5px solid ${isSel ? "#1A8040" : "#DDE8DD"}`, borderRadius: "10px", padding: "10px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", paddingTop: "2px" }} title={isSel ? "Deselect" : "Select"}>
                        {selectBox(p.id)}
                      </label>

                      <div style={{ width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", background: "#F2F7F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <IconShoppingBag size={16} color="#DDE8DD" />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: R, fontSize: "11px", color: "#1B3A2D", letterSpacing: "0.5px", lineHeight: 1.35, marginBottom: "3px" }}>{p.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: R, fontSize: "12px", color: "#1A8040" }}>₱{Number(p.price).toLocaleString()}</span>
                          <span style={{ fontFamily: B, fontSize: "10px", color: col.color, fontWeight: 600 }}>{stockLabel(p).text}</span>
                          {p.is_active === false && (
                            <span style={{ fontFamily: SG, fontSize: "8px", fontWeight: 700, color: "#B45309", background: "#FFF3E0", border: "1px solid #F0C48A", borderRadius: "999px", padding: "1px 7px", letterSpacing: "1px" }}>HIDDEN</span>
                          )}
                        </div>
                        <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <AdminActionButton href={`/admin/shop/${p.id}/edit`} variant="primary" icon={<IconEdit size={11} color="#ffffff" />}>EDIT</AdminActionButton>
                          <ProductVisibilityToggle id={p.id} initialActive={p.is_active ?? true} />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!col.items.length && (
                  <div style={{ fontFamily: B, fontSize: "11px", color: "#9AAE9A", textAlign: "center", padding: "18px 8px" }}>
                    Nothing here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
