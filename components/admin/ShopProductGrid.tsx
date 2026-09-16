"use client";
import { useMemo, useState, useTransition } from "react";
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
export default function ShopProductGrid({ products }: { products: any[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => toggleOne(p.id)}
                    style={{ width: "16px", height: "16px", accentColor: "#1A8040", cursor: "pointer", margin: 0 }}
                  />
                </label>
              </div>

              <div style={{ padding: "14px", flex: 1 }}>
                <div style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "1px", marginBottom: "4px" }}>{p.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: R, fontSize: "14px", color: "#1A8040" }}>₱{Number(p.price).toLocaleString()}</span>
                  <span style={{ fontFamily: B, fontSize: "11px", color: p.stock > 0 ? "#1A8040" : "#CC3344" }}>
                    {p.stock > 0 ? `${p.stock} in stock` : "OUT OF STOCK"}
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

        {!products.length && (
          <div style={{ gridColumn: "1/-1", background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A60" }}>
            NO PRODUCTS YET
          </div>
        )}
      </div>
    </div>
  );
}
