import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Manage Shop" };
export const dynamic = "force-dynamic";
export const revalidate = 0;
const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

export default async function AdminShopPage() {
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, product_categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>SHOP</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>{products?.length ?? 0} products</p>
        </div>
        <Link href="/admin/shop/create" style={{ textDecoration: "none", position: "relative", display: "inline-block" }}>
          <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
          <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "12px", background: "#1A8040", color: "#1B3A2D", padding: "8px 18px", border: "2px solid #080F06", borderRadius: "6px", letterSpacing: "1.5px" }}>+ ADD PRODUCT</span>
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "10px" }}>
        {(products ?? []).map((p: any) => (
          <div key={p.id} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ height: "140px", background: "#F2F7F2", overflow: "hidden" }}>
              {p.images?.[0]
                ? <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>🛍</div>
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
                <div style={{ marginTop: "6px", display: "inline-block", background: "#2C1010", border: "1px solid #CC3344", borderRadius: "4px", padding: "2px 8px", fontFamily: B, fontSize: "10px", color: "#CC3344" }}>
                  INACTIVE
                </div>
              )}
            </div>
            {/* Edit button */}
            <div style={{ padding: "0 14px 14px" }}>
              <Link href={`/admin/shop/${p.id}/edit`} style={{ textDecoration: "none", display: "block", textAlign: "center", fontFamily: B, fontSize: "11px", color: "#4A7C59", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "6px", letterSpacing: "1px" }}>
                ✏ EDIT
              </Link>
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
