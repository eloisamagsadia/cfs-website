import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddToCartButton from "@/components/public/AddToCartButton";
import ProductImageGallery from "@/components/public/ProductImageGallery";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const revalidate = 0;


const R = "var(--font-righteous,'Righteous',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const C = { paper:"#FAFDF9", cream:"#F2F7F2", mist:"#E8F0E4", forest:"#1B3A2D", sage:"#4A7C59", border:"#DDE8DD", muted:"#7A8E7A", green:"#3CCE2A" };

const CAT_COLORS: Record<string, string> = {
  apparel: "#F07228", photocards: "#F5C82A", accessories: "#8EE440",
  bundles: "#F04060", default: "#3CCE2A",
};

export async function generateMetadata({ params }: { params: { category: string; id: string } }): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data: pRaw } = await (((supabase.from("products") as any) as any) as any).select("name, description").eq("id", params.id).single();
  const p = pRaw as any;
  return { title: p?.name ?? "Product", description: p?.description ?? "" };
}

export default async function ProductDetailPage({ params }: { params: { category: string; id: string } }) {
  const supabase = createAdminClient();
  const { userId } = auth();
  const user = userId ? { id: userId } : null;

  const [{ data: product, error: productError }, { data: category }] = await Promise.all([
    (((supabase.from("products") as any) as any) as any).select("*, product_categories(name,slug)").eq("id", params.id).single(),
    (((supabase.from("product_categories") as any) as any) as any).select("*").eq("slug", params.category).single(),
  ]);
  if (productError) console.error("Product query error:", productError);

  if (!product) { console.error("Product not found:", params.id); notFound(); }

  // Related products
  const { data: related } = await supabase
    .from("products").select("id,name,price,images")
    .eq("category_id", product.category_id)
    .eq("is_active", true)
    .neq("id", params.id)
    .limit(4);

  const accentColor = CAT_COLORS[params.category] ?? CAT_COLORS.default;
  const inStock = product.stock > 0;
  const images: string[] = product.images ?? [];

  return (
    <div style={{ minHeight: "100vh", background: C.paper }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 16px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          <Link href="/shop" style={{ fontFamily: R, fontSize: "11px", color: "#5A7A50", textDecoration: "none", letterSpacing: "1px" }}>SHOP</Link>
          <span style={{ color: "#3A5030" }}>/</span>
          <Link href={`/shop/${params.category}`} style={{ fontFamily: R, fontSize: "11px", color: "#5A7A50", textDecoration: "none", letterSpacing: "1px" }}>
            {(product.product_categories as any)?.name?.toUpperCase() ?? params.category.toUpperCase()}
          </Link>
          <span style={{ color: "#3A5030" }}>/</span>
          <span style={{ fontFamily: R, fontSize: "11px", color: C.sage, letterSpacing: "0.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{product.name.toUpperCase()}</span>
        </div>

        {/* Main product layout */}
        <div className="product-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start", marginBottom: "48px" }}>

          {/* Left: Images */}
          <div>
            <ProductImageGallery images={images} productName={product.name} inStock={inStock} accentColor={accentColor} />
          </div>
          {/* Right: Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Category badge */}
            <div>
              <Link href={`/shop/${params.category}`} style={{ fontFamily: R, fontSize: "11px", color: C.sage, background: C.mist, border: `1px solid ${C.border}`, borderRadius: "20px", padding: "3px 12px", textDecoration: "none", letterSpacing: "1px" }}>
                {(product.product_categories as any)?.name?.toUpperCase() ?? "PRODUCT"}
              </Link>
            </div>

            {/* Name */}
            <h1 style={{ fontFamily: S, fontSize: "clamp(1.6rem,4vw,2.4rem)", color: C.forest, letterSpacing: "0" }}>{product.name}</h1>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <span style={{ fontFamily: S, fontSize: "2rem", color: C.forest }}> ₱{Number(product.price).toLocaleString()}</span>
              {inStock
                ? <span style={{ fontFamily: B, fontSize: "12px", color: "#3CCE2A" }}>{product.stock <= 5 ? `Only ${product.stock} left!` : "In stock"}</span>
                : <span style={{ fontFamily: B, fontSize: "12px", color: "#F04060" }}>Out of stock</span>
              }
            </div>

            {/* Description */}
            {product.description && (
              <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "15px", color: C.muted, lineHeight: 1.9 }}>
                {product.description}
              </p>
            )}

            {/* Variants */}
            {product.variants && Object.keys(product.variants).length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(product.variants as Record<string, string[]>).map(([key, values]) => (
                  <div key={key}>
                    <div style={{ fontFamily: B, fontSize: "11px", color: C.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>{key}</div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {(values as string[]).map((v: string) => (
                        <button key={v} style={{ fontFamily: R, fontSize: "12px", color: C.forest, background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "6px", padding: "7px 14px", cursor: "pointer", letterSpacing: "1px" }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div style={{ height: "1px", background: C.border }}/>

            {/* Add to cart */}
            <AddToCartButton
              productId={product.id}
              isLoggedIn={!!user}
              inStock={inStock}
              accentColor={accentColor}
            />

            {/* Delivery info */}
            <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" rx="1" stroke={C.sage} strokeWidth="1.8"/><path d="M16 8h4l3 5v3h-7V8z" stroke={C.sage} strokeWidth="1.8" strokeLinejoin="round"/><circle cx="5.5" cy="18.5" r="1.5" stroke={C.sage} strokeWidth="1.8"/><circle cx="18.5" cy="18.5" r="1.5" stroke={C.sage} strokeWidth="1.8"/></svg>
                <span style={{ fontFamily:B, fontSize:"12px", color:C.muted }}>Ships within 3-5 business days</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={C.sage} strokeWidth="1.8" strokeLinejoin="round"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={C.sage} strokeWidth="1.8"/></svg>
                <span style={{ fontFamily:B, fontSize:"12px", color:C.muted }}>Shipping fee based on region and weight</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke={C.sage} strokeWidth="1.8"/><path d="M7 11V7a5 5 0 0110 0v4" stroke={C.sage} strokeWidth="1.8" strokeLinecap="round"/></svg>
                <span style={{ fontFamily:B, fontSize:"12px", color:C.muted }}>Secure checkout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related && related.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <h2 style={{ fontFamily: R, fontSize: "1.2rem", color: C.forest, letterSpacing: "1px" }}>MORE FROM {(product.product_categories as any)?.name?.toUpperCase()}</h2>
              <div style={{ flex: 1, height: "1px", background: C.border }}/>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "12px" }}>
              {related.map((p: any) => (
                <Link key={p.id} href={`/shop/${params.category}/${p.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
                    <div style={{ height: "160px", background: C.mist, overflow: "hidden" }}>
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy"/>
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>🛍</div>
                      }
                    </div>
                    <div style={{ padding: "12px" }}>
                      <div style={{ fontFamily: R, fontSize: "13px", color: C.forest, marginBottom: "4px" }}>{p.name}</div>
                      <div style={{ fontFamily: B, fontSize: "14px", color: C.sage }}>₱{Number(p.price).toLocaleString()}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
