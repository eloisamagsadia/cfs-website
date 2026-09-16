import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";
import ShopBrowser from "@/components/public/ShopBrowser";
import { IconShoppingBag } from "@/components/shared/Icons";

export const metadata: Metadata = { title: "Shop — CFS" };
export const revalidate = 300;

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  paper:  "#FAFDF9",
  cream:  "#F2F7F2",
  mist:   "#E8F0E4",
  forest: "#1B3A2D",
  deep:   "#0F2A1E",
  sage:   "#4A7C59",
  border: "#DDE8DD",
  muted:  "#7A8E7A",
  green:  "#1A8040",
};

export default async function ShopPage() {
  const supabase = createAdminClient();

  // Admins/super_admins see hidden products here too, tagged HIDDEN, so the
  // full buy flow can be tested from the real listing while the shop is
  // closed to the public. Mirrors the preview rule on the detail page.
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const isPrivileged = role === "admin" || role === "super_admin";

  const query = supabase
    .from("products")
    .select("*, product_categories(name, slug)")
    .order("created_at", { ascending: false });
  const { data: productsRaw } = await (isPrivileged ? query : query.eq("is_active", true));

  const products = (productsRaw ?? []) as any[];
  const inStock  = products.filter(p => p.stock > 0).length;
  const soldOut  = products.filter(p => p.stock === 0).length;
  const hidden   = products.filter(p => p.is_active === false).length;
  const categoryCount = new Set(
    products.map(p => p.product_categories?.slug).filter(Boolean)
  ).size;

  // Featured = newest in-stock product (the query is already created_at desc).
  // Falls back to the newest product overall so the slot is never empty just
  // because the latest drop sold out.
  const featured = products.find(p => p.stock > 0) ?? products[0] ?? null;
  const featuredImage: string | undefined = featured?.images?.[0];

  const statChips = [
    { label: "ITEMS",      value: products.length, color: C.forest },
    { label: "IN STOCK",   value: inStock,         color: "#1A8040" },
    { label: "SOLD OUT",   value: soldOut,         color: "#CC3344" },
    { label: "CATEGORIES", value: categoryCount,   color: C.sage },
    ...(isPrivileged && hidden
      ? [{ label: "HIDDEN", value: hidden, color: "#B45309" }]
      : []),
  ];

  return (
    <div className="scrap-paper" style={{ minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 900px) {
          .shl-hero-grid { grid-template-columns: 1fr !important; padding: 40px 24px !important; }
          .shl-hero-title { font-size: clamp(2rem, 8vw, 2.6rem) !important; }
          .shl-hero-stats { justify-content: flex-start !important; }
        }
      `}</style>

      {/* ── HERO ── warm scrapbook header, mirroring /events ── */}
      <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px dashed #DDE8DD" }}>
        <div className="scrap-glow" />
        <div className="scrap-glow" style={{ top: "auto", bottom: "-100px", left: "auto", right: "-100px", background: "radial-gradient(circle, rgba(184, 230, 193, 0.35), transparent 65%)" }} />

        <div className="shl-hero-grid" style={{ position: "relative", maxWidth: "1240px", margin: "0 auto", padding: "64px 48px", display: "grid", gridTemplateColumns: "1fr 0.9fr", gap: "48px", alignItems: "center" }}>

          {/* Left: intro + stats */}
          <div>
            <div style={{ marginBottom: "20px" }}>
              <span className="scrap-tape scrap-tape-mint">merch table</span>
            </div>

            <h1 className="shl-hero-title" style={{ fontFamily: S, fontSize: "clamp(2.6rem, 5vw, 4rem)", color: "#1B3A2D", lineHeight: 1.02, letterSpacing: "-1px", margin: "0 0 12px" }}>
              Rep the Fam.
            </h1>
            <p className="scrap-note" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", color: "#4A7C59", margin: "0 0 20px", lineHeight: 1.1 }}>
              Wear the Love ✦
            </p>

            <p style={{ fontFamily: B, fontSize: "15px", color: "#1B3A2D", lineHeight: 1.8, maxWidth: "440px", margin: "0 0 28px" }}>
              Exclusive merch for the fam — tees, keychains, and drop-only bundles. Every purchase funds our fan projects for Colet.
            </p>

            {/* Stat chips */}
            <div className="shl-hero-stats" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {statChips.map(s => (
                <span key={s.label} style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: `${s.color}12`, border: `1px solid ${s.color}30`, borderRadius: "999px" }}>
                  <span style={{ fontFamily: SG, fontSize: "18px", fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: s.color, letterSpacing: "1.4px" }}>{s.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Right: featured product card OR empty-state placeholder */}
          {featured ? (
            <Link href={`/shop/${featured.product_categories?.slug}/${featured.id}`} className="btn-fx" style={{ textDecoration: "none", display: "block" }}>
              <div style={{ background: "#FFFFFF", borderRadius: "20px", overflow: "hidden", boxShadow: "0 1px 0 rgba(15,42,30,0.04), 0 12px 32px rgba(15,42,30,0.10)", border: "1px solid #DDE8DD", position: "relative", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}>
                {/* Product shot */}
                <div style={{ position: "relative", aspectRatio: "4/3", background: "#E8F0E4" }}>
                  {featuredImage ? (
                    <Image src={featuredImage} alt={featured.name} fill sizes="(max-width: 768px) 100vw, 800px" priority style={{ objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #E8F0E4 0%, #C7E1CE 100%)" }}>
                      <IconShoppingBag size={54} color="#4A7C59" />
                    </div>
                  )}
                  {/* Chip row on top of the shot */}
                  <div style={{ position: "absolute", top: "14px", left: "14px", display: "flex", gap: "6px", zIndex: 2 }}>
                    <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: "#1A8040", borderRadius: "999px", padding: "5px 12px", letterSpacing: "1.5px", boxShadow: "0 2px 8px rgba(15,42,30,0.30)" }}>LATEST DROP</span>
                    {featured.stock > 0 && featured.stock <= 5 && (
                      <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#1B3A2D", background: "rgba(255,255,255,0.96)", borderRadius: "999px", padding: "5px 12px", letterSpacing: "1.5px", boxShadow: "0 2px 8px rgba(15,42,30,0.20)" }}>
                        ONLY {featured.stock} LEFT
                      </span>
                    )}
                    {featured.is_active === false && (
                      <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: "#B45309", borderRadius: "999px", padding: "5px 12px", letterSpacing: "1.5px", boxShadow: "0 2px 8px rgba(15,42,30,0.30)" }}>HIDDEN</span>
                    )}
                  </div>
                  {/* Price badge */}
                  <div style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.98)", borderRadius: "12px", padding: "9px 13px", textAlign: "center", minWidth: "60px", boxShadow: "0 4px 14px rgba(15,42,30,0.25)", zIndex: 2 }}>
                    <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: C.sage, letterSpacing: "1.5px" }}>PRICE</div>
                    <div style={{ fontFamily: S, fontSize: "24px", color: "#1B3A2D", lineHeight: 1 }}>
                      ₱{Number(featured.price).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "18px 22px 20px" }}>
                  {featured.product_categories?.name && (
                    <div style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#1A8040", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>
                      {featured.product_categories.name}
                    </div>
                  )}
                  <h2 style={{ fontFamily: S, fontSize: "22px", color: "#1B3A2D", lineHeight: 1.15, margin: "0 0 10px", letterSpacing: "-0.3px" }}>{featured.name}</h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <IconShoppingBag size={12} color="#7A8E7A" />
                      {featured.stock > 0 ? `${featured.stock} in stock` : "Sold out"}
                    </span>
                  </div>
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #DDE8DD", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: S, fontSize: "20px", color: featured.stock > 0 ? "#1A8040" : C.muted }}>
                      ₱{Number(featured.price).toLocaleString()}
                    </span>
                    <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1A8040", letterSpacing: "1.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <IconShoppingBag size={11} color="#1A8040" /> SHOP NOW →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            /* No products — decorative placeholder */
            <div style={{ background: "#ffffff", borderRadius: "20px", border: `1.5px dashed ${C.border}`, padding: "48px 32px", textAlign: "center" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: C.mist, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <IconShoppingBag size={32} color={C.sage} />
              </div>
              <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: C.forest, letterSpacing: "2px", marginBottom: "6px" }}>NO MERCH YET</div>
              <p style={{ fontFamily: B, fontSize: "13px", color: C.muted, margin: 0, lineHeight: 1.7 }}>Follow us on socials — we&apos;ll announce the next drop soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── FILTER + GRID (client) ── */}
      <ShopBrowser products={products} />
    </div>
  );
}
