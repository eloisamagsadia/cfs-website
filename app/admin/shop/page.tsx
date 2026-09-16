import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import type { Metadata } from "next";
import ShopProductGrid from "@/components/admin/ShopProductGrid";
export const metadata: Metadata = { title: "Manage Shop" };
export const revalidate = 30;

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

export default async function AdminShopPage() {
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, product_categories(name,slug)")
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

      <ShopProductGrid products={(products ?? []) as any[]} />

    </div>
  );
}
