import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { IconShoppingBag } from "@/components/shared/Icons";
export const revalidate = 300;



export const metadata: Metadata = { title: "Shop — CFS" };

const R = "var(--font-righteous,'Righteous',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const C = {
  paper:  "#FAFDF9",
  cream:  "#F2F7F2",
  mist:   "#E8F0E4",
  forest: "#1B3A2D",
  sage:   "#4A7C59",
  border: "#DDE8DD",
  muted:  "#7A8E7A",
  green:  "#1A8040",
};

export default async function ShopPage() {
  const supabase = createAdminClient();

  const { data: products } = await supabase
    .from("products")
    .select("*, product_categories(name, slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div style={{ minHeight: "100vh", background: "#FAFDF9" }}>
      <style>{`
        .cat-card { transition: border-color 0.2s, transform 0.2s; }
        .cat-card:hover { border-color: #1A8040 !important; transform: translateY(-3px); }
      `}</style>
      {/* ── HERO ── */}
      <section className="public-hero" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:"420px", overflow:"hidden", maxWidth:"1400px", margin:"0 auto", width:"100%" }}>
        <div className="public-hero-copy" style={{ padding:"64px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
          
          <h1 style={{ fontFamily:S, fontSize:"clamp(2.4rem,4vw,3.6rem)", color:C.forest, lineHeight:1.05, marginBottom:"16px" }}>
            Rep the Fam.<br /><em style={{ fontStyle:"italic", color:C.sage }}>Wear the Love.</em>
          </h1>
          <p style={{ fontFamily:B, fontSize:"15px", color:C.muted, maxWidth:"400px", lineHeight:1.9 }}>
            Exclusive merch for the fam. Every purchase supports our fan projects for Colet.
          </p>
        </div>
        <div className="public-hero-art" style={{ background:C.mist, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <img src="https://media.coletfs.com/assets/hero/shop/cfs-shop-hero.png" alt="CFS Shop" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", position:"absolute", inset:0 }} />
        </div>
      </section>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px" }}>

        {/* ── ALL PRODUCTS ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
            <span style={{ fontFamily: R, fontSize: "12px", color: "#4A7C59", letterSpacing: "2px" }}>ALL PRODUCTS</span>
            <div style={{ flex: 1, height: "1px", background: "#DDE8DD" }} />
          </div>
          <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "20px" }}>
            {(products ?? []).map((p: any) => (
              <Link key={p.id} href={`/shop/${p.product_categories?.slug}/${p.id}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column" }}>
                <div className="cat-card" style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", transition: "transform 0.2s, box-shadow 0.2s" }}>
                  <div style={{ height: "auto", background: C.mist, overflow: "hidden", position: "relative", aspectRatio: "1/1" }}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><IconShoppingBag size={40} color="#DDE8DD" /></div>
                    }
                    {p.stock === 0 && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#CC3344", letterSpacing: "2px", background: "#fff", padding: "6px 14px", borderRadius: "20px", border: "1px solid #CC3344" }}>OUT OF STOCK</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontFamily: S, fontSize: "15px", color: C.forest, lineHeight: 1.3 }}>{p.name}</div>
                    {p.product_categories?.name && (
                      <div style={{ fontFamily: B, fontSize: "11px", color: C.muted }}>{p.product_categories.name}</div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontFamily: S, fontSize: "17px", color: "#1A8040" }}>₱{Number(p.price).toLocaleString()}</span>
                      <span style={{ fontFamily: B, fontSize: "10px", fontWeight: 700, color: p.stock > 0 ? C.sage : "#CC3344", background: p.stock > 0 ? C.mist : "#FFF0F0", borderRadius: "20px", padding: "3px 10px" }}>
                        {p.stock > 0 ? "In stock" : "Out of stock"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        </div>
      </div>
  );
}