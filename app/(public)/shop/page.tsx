import type { Metadata } from "next";
import Link from "next/link";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const metadata: Metadata = { title: "Shop — CFS" };

const R = "var(--font-righteous,'Righteous',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

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
const CAT_COLORS = ["#3CCE2A","#F07228","#F5C82A","#F04060","#8EE440","#3CCE2A","#F07228","#F5C82A"];

export default async function ShopPage() {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: cats } = await supabase
    .from("product_categories")
    .select("*")
    .order("name", { ascending: true });

  const display = cats ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#0F1A0B" }}>
      <style>{`
        .cat-card { transition: border-color 0.2s, transform 0.2s; }
        .cat-card:hover { border-color: #3CCE2A !important; transform: translateY(-3px); }
        .cat-card:hover .cat-cta { background: #3CCE2A !important; color: #080F06 !important; }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ background: "#1A3D14", borderBottom: "2px solid #2C4820", padding: "56px 24px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(60,206,42,0.1) 1.5px,transparent 1.5px)", backgroundSize: "18px 18px" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#0F1A0B", border: "1.5px solid #F07228", borderRadius: "20px", padding: "4px 16px", marginBottom: "20px" }}>
<span style={{ fontFamily: R, fontSize: "10px", color: "#F07228", letterSpacing: "2.5px" }}>CFS OFFICIAL MERCH</span>
          </div>
          <h1 style={{ fontFamily: R, fontSize: "clamp(2rem,5vw,3.2rem)", color: "#F0EAD6", letterSpacing: "4px", marginBottom: "14px" }}>
            OFFICIAL SHOP
          </h1>
          <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "15px", color: "#8AAA78", maxWidth: "460px", margin: "0 auto", lineHeight: 1.8 }}>
            Rep the CFS fam — exclusive merch for members. Every purchase supports our fan projects for Colet.
          </p>
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
          <span style={{ fontFamily: R, fontSize: "12px", color: "#5A7A50", letterSpacing: "2px" }}>BROWSE CATEGORIES</span>
          <div style={{ flex: 1, height: "1px", background: "#2C4820" }} />
        </div>

        {display.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
<p style={{ fontFamily: B, fontSize: "14px", color: "#3A5A30" }}>Shop coming soon — stay tuned!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "16px" }}>
            {display.map((cat: any, i: number) => {
              const accent = CAT_COLORS[i % CAT_COLORS.length];
              return (
                <Link key={cat.id} href={`/shop/${cat.slug}`} style={{ textDecoration: "none" }}>
                  <div className="cat-card" style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "14px", padding: "32px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    {/* Icon circle */}
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#0F1A0B", border: `2px solid ${accent}60`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CategoryIcon name={cat.name} color={accent} />
                    </div>
                    <h3 style={{ fontFamily: R, fontSize: "16px", color: "#F0EAD6", letterSpacing: "1.5px", margin: 0 }}>{cat.name}</h3>
                    {cat.description && (
                      <p style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", lineHeight: 1.6, margin: 0 }}>{cat.description}</p>
                    )}
                    {/* CTA */}
                    <div className="cat-cta" style={{ marginTop: "8px", background: "#243520", border: `1.5px solid ${accent}`, borderRadius: "6px", padding: "8px 20px", fontFamily: R, fontSize: "11px", color: accent, letterSpacing: "1.5px", transition: "background 0.2s, color 0.2s" }}>
                      SHOP NOW →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Members only note */}
        <div style={{ marginTop: "40px", background: "#1A2614", border: "1.5px solid #2C4820", borderRadius: "12px", padding: "18px 24px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#0F2A0B", border: "1.5px solid #3CCE2A40", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5zm0 12c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z" fill="#3CCE2A"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: R, fontSize: "12px", color: "#F0EAD6", letterSpacing: "1px", marginBottom: "3px" }}>MEMBERS ONLY</div>
            <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", lineHeight: 1.5 }}>
              Some items are exclusive to CFS members. <Link href="/login" style={{ color: "#3CCE2A", textDecoration: "none" }}>Log in</Link> or <Link href="/register" style={{ color: "#3CCE2A", textDecoration: "none" }}>join the fam</Link> to unlock everything.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}