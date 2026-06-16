import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { IconShoppingBag } from "@/components/shared/Icons";
export const dynamic = "force-dynamic";
export const revalidate = 0;


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

function CategoryIcon({ name, color }: { name: string; color: string }) {
  const n = name.toLowerCase();
  const s = { stroke: color, strokeWidth: "1.8", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  if (n.includes("apparel") || n.includes("shirt") || n.includes("cloth"))
    return <svg width="28" height="28" viewBox="0 0 24 24" {...{}}><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 001 .74H6v10c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V10h2.15a1 1 0 001-.74l.58-3.57a2 2 0 00-1.35-2.23z" {...s}/></svg>;
  if (n.includes("accessori") || n.includes("jewelr") || n.includes("pin"))
    return <svg width="28" height="28" viewBox="0 0 24 24" {...{}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...s}/></svg>;
  if (n.includes("photocard") || n.includes("photo") || n.includes("card"))
    return <svg width="28" height="28" viewBox="0 0 24 24" {...{}}><rect x="3" y="3" width="18" height="18" rx="2" {...s}/><circle cx="8.5" cy="8.5" r="1.5" {...s}/><path d="M21 15l-5-5L5 21" {...s}/></svg>;
  if (n.includes("bundle") || n.includes("set") || n.includes("pack"))
    return <svg width="28" height="28" viewBox="0 0 24 24" {...{}}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" {...s}/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" {...s}/></svg>;
  if (n.includes("sticker") || n.includes("print"))
    return <svg width="28" height="28" viewBox="0 0 24 24" {...{}}><path d="M12 2a10 10 0 00-9.95 9H12v9.95A10 10 0 0012 2z" {...s}/><path d="M2.05 11H12v9.95" {...s}/></svg>;
  if (n.includes("keychain") || n.includes("charm"))
    return <svg width="28" height="28" viewBox="0 0 24 24" {...{}}><circle cx="12" cy="8" r="4" {...s}/><path d="M12 12v10M8 18h8" {...s}/></svg>;
  // default — shopping bag
  return <svg width="28" height="28" viewBox="0 0 24 24" {...{}}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" {...s}/><path d="M16 10a4 4 0 01-8 0" {...s}/></svg>;
}
const CAT_COLORS = ["#1A8040","#1A8040","#156530","#CC3344","#1A8040","#1A8040","#1A8040","#156530"];

export default async function ShopPage() {
  const supabase = createAdminClient();
  const { data: cats } = await supabase
    .from("product_categories")
    .select("*")
    .order("name", { ascending: true });

  const { data: products } = await supabase
    .from("products")
    .select("*, product_categories(name, slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const display = cats ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#FAFDF9" }}>
      <style>{`
        .cat-card { transition: border-color 0.2s, transform 0.2s; }
        .cat-card:hover { border-color: #1A8040 !important; transform: translateY(-3px); }
        .cat-card:hover .cat-cta { background: #1A8040 !important; color: #080F06 !important; }
      `}</style>
      {/* ── HERO ── */}
      <section style={{ display:"grid", gridTemplateColumns:"1fr 1fr", minHeight:"420px", overflow:"hidden", maxWidth:"1400px", margin:"0 auto", width:"100%" }}>
        <div style={{ padding:"64px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
          
          <h1 style={{ fontFamily:S, fontSize:"clamp(2.4rem,4vw,3.6rem)", color:C.forest, lineHeight:1.05, marginBottom:"16px" }}>
            Rep the Fam.<br /><em style={{ fontStyle:"italic", color:C.sage }}>Wear the Love.</em>
          </h1>
          <p style={{ fontFamily:B, fontSize:"15px", color:C.muted, maxWidth:"400px", lineHeight:1.9 }}>
            Exclusive merch for the fam. Every purchase supports our fan projects for Colet.
          </p>
        </div>
        <div style={{ background:C.mist, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <img src="https://media.coletfs.com/assets/hero/shop/cfs-shop-hero.png" alt="CFS Shop" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", position:"absolute", inset:0 }} />
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px" }}>

        <div style={{display:"none"}}>
        {display.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
<p style={{ fontFamily: B, fontSize: "14px", color: "#3A5A30" }}>Shop coming soon — stay tuned!</p>
          </div>
        ) : (
          <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "16px" }}>
            {display.map((cat: any, i: number) => {
              const accent = CAT_COLORS[i % CAT_COLORS.length];
              return (
                <Link key={cat.id} href={`/shop/${cat.slug}`} style={{ textDecoration: "none" }}>
                  <div className="cat-card" style={{ background: "#ffffff", border: "2px solid #DDE8DD", borderRadius: "14px", padding: "32px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    {/* Icon circle */}
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#FAFDF9", border: `2px solid ${accent}60`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CategoryIcon name={cat.name} color={accent} />
                    </div>
                    <h3 style={{ fontFamily: R, fontSize: "16px", color: "#1B3A2D", letterSpacing: "1.5px", margin: 0 }}>{cat.name}</h3>
                    {cat.description && (
                      <p style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", lineHeight: 1.6, margin: 0 }}>{cat.description}</p>
                    )}
                    {/* CTA */}
                    <div className="cat-cta" style={{ marginTop: "8px", background: "#E8F0E4", border: `1.5px solid ${accent}`, borderRadius: "6px", padding: "8px 20px", fontFamily: R, fontSize: "11px", color: accent, letterSpacing: "1.5px", transition: "background 0.2s, color 0.2s" }}>
                      SHOP NOW →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* All Products */}
        </div>
        <div style={{ marginTop: "48px" }}>
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