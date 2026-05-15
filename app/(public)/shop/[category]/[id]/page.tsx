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
    <div style={{ minHeight: "100vh", background: "#0F1A0B" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          <Link href="/shop" style={{ fontFamily: R, fontSize: "11px", color: "#5A7A50", textDecoration: "none", letterSpacing: "1px" }}>SHOP</Link>
          <span style={{ color: "#3A5030" }}>/</span>
          <Link href={`/shop/${params.category}`} style={{ fontFamily: R, fontSize: "11px", color: "#5A7A50", textDecoration: "none", letterSpacing: "1px" }}>
            {(product.product_categories as any)?.name?.toUpperCase() ?? params.category.toUpperCase()}
          </Link>
          <span style={{ color: "#3A5030" }}>/</span>
          <span style={{ fontFamily: R, fontSize: "11px", color: accentColor, letterSpacing: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{product.name.toUpperCase()}</span>
        </div>

        {/* Main product layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start", marginBottom: "48px" }}>

          {/* Left: Images */}
          <div>
            <ProductImageGallery images={images} productName={product.name} inStock={inStock} accentColor={accentColor} />
          </div>
          {/* Right: Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Category badge */}
            <div>
              <Link href={`/shop/${params.category}`} style={{ fontFamily: R, fontSize: "11px", color: accentColor, background: accentColor + "20", border: `1px solid ${accentColor}40`, borderRadius: "20px", padding: "3px 12px", textDecoration: "none", letterSpacing: "1px" }}>
                {(product.product_categories as any)?.name?.toUpperCase() ?? "PRODUCT"}
              </Link>
            </div>

            {/* Name */}
            <h1 style={{ fontFamily: R, fontSize: "clamp(1.4rem,4vw,2.2rem)", color: "#F0EAD6", letterSpacing: "2px" }}>{product.name}</h1>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <span style={{ fontFamily: R, fontSize: "2rem", color: accentColor }}> ₱{Number(product.price).toLocaleString()}</span>
              {inStock
                ? <span style={{ fontFamily: B, fontSize: "12px", color: "#3CCE2A" }}>{product.stock <= 5 ? `Only ${product.stock} left!` : "In stock"}</span>
                : <span style={{ fontFamily: B, fontSize: "12px", color: "#F04060" }}>Out of stock</span>
              }
            </div>

            {/* Description */}
            {product.description && (
              <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "15px", color: "#8AAA78", lineHeight: 1.9 }}>
                {product.description}
              </p>
            )}

            {/* Variants */}
            {product.variants && Object.keys(product.variants).length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(product.variants as Record<string, string[]>).map(([key, values]) => (
                  <div key={key}>
                    <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>{key}</div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {(values as string[]).map((v: string) => (
                        <button key={v} style={{ fontFamily: R, fontSize: "12px", color: "#F0EAD6", background: "#1A2614", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "7px 14px", cursor: "pointer", letterSpacing: "1px" }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div style={{ height: "1px", background: "#2C4820" }}/>

            {/* Add to cart */}
            <AddToCartButton
              productId={product.id}
              isLoggedIn={!!user}
              inStock={inStock}
              accentColor={accentColor}
            />

            {/* Delivery info */}
            <div style={{ background: "#1A2614", border: "1.5px solid #2C4820", borderRadius: "8px", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { icon: "🚚", text: "Ships within 3-5 business days" },
                { icon: "📦", text: "Shipping fee based on region and weight" },
                { icon: "🔒", text: "Secure checkout" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "14px" }}>{icon}</span>
                  <span style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related && related.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <h2 style={{ fontFamily: R, fontSize: "1.2rem", color: "#F0EAD6", letterSpacing: "2px" }}>MORE FROM {(product.product_categories as any)?.name?.toUpperCase()}</h2>
              <div style={{ flex: 1, height: "1px", background: "#2C4820" }}/>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "12px" }}>
              {related.map((p: any) => (
                <Link key={p.id} href={`/shop/${params.category}/${p.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ height: "160px", background: "#243520", overflow: "hidden" }}>
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy"/>
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>🛍</div>
                      }
                    </div>
                    <div style={{ padding: "12px" }}>
                      <div style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", letterSpacing: "1px", marginBottom: "4px" }}>{p.name}</div>
                      <div style={{ fontFamily: R, fontSize: "14px", color: accentColor }}>₱{Number(p.price).toLocaleString()}</div>
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
