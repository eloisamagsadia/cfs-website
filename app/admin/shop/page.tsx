import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Metadata } from "next";
import { IconEdit, IconShoppingBag } from "@/components/shared/Icons";
import AdminActionButton from "@/components/shared/AdminActionButton";
export const metadata: Metadata = { title: "Manage Shop" };
export const revalidate = 30;

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

export default async function AdminShopPage() {
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, product_categories(name)")
    .order("created_at", { ascending: false });

  const outCount = (products ?? []).filter((p: any) => (p.stock ?? 0) <= 0).length;
  const lowCount = (products ?? []).filter((p: any) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>SHOP</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>{products?.length ?? 0} products</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/admin/shop/stock" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "11px", fontWeight: 700, background: outCount + lowCount > 0 ? "#FFF3D6" : "#F2F7F2", color: outCount + lowCount > 0 ? "#7A5A0F" : "#5A7A60", padding: "10px 16px", border: `1.5px solid ${outCount + lowCount > 0 ? "#F0D889" : "#DDE8DD"}`, borderRadius: "10px", letterSpacing: "1.3px" }}>
            STOCK DASHBOARD
            {outCount > 0 && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: "#8A1E27", borderRadius: "999px", padding: "2px 7px", letterSpacing: "1px" }}>{outCount} OUT</span>}
            {lowCount > 0 && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: "#B78A1F", borderRadius: "999px", padding: "2px 7px", letterSpacing: "1px" }}>{lowCount} LOW</span>}
          </Link>
          <Link href="/admin/shop/create" style={{ textDecoration: "none", position: "relative", display: "inline-block" }}>
            <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "10px" }} />
            <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: SG, fontSize: "12px", fontWeight: 700, background: "#1A8040", color: "#ffffff", padding: "11px 22px", border: "1.5px solid #1B3A2D", borderRadius: "10px", letterSpacing: "1.5px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              ADD PRODUCT
            </span>
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "10px" }}>
        {(products ?? []).map((p: any) => (
          <div key={p.id} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ height: "140px", background: "#F2F7F2", overflow: "hidden" }}>
              {p.images?.[0]
                ? <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><IconShoppingBag size={32} color="#DDE8DD" /></div>
              }
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
            {/* Edit button */}
            <div style={{ padding: "0 14px 14px", display: "flex" }}>
              <AdminActionButton href={`/admin/shop/${p.id}/edit`} variant="primary" icon={<IconEdit size={12} color="#ffffff" />}>EDIT</AdminActionButton>
            </div>
          </div>
        ))}
        {!products?.length && (
          <div style={{ gridColumn: "1/-1", background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "48px", textAlign: "center", fontFamily: R, color: "#5A7A60" }}>
            NO PRODUCTS YET
          </div>
        )}
      </div>
    </div>
  );
}
