"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { IconShoppingBag, IconX } from "@/components/shared/Icons";

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
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

// Mirrors EventsBrowser: filter pills with live counts + search + card grid,
// so /shop and /events read as the same page with different nouns. Events
// filter by status; products have no status, so we filter by category instead.
export default function ShopBrowser({ products }: { products: any[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Categories are derived from the products themselves rather than fetched
  // separately — an empty category would only ever render a dead filter pill.
  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) {
      const slug = p.product_categories?.slug;
      const name = p.product_categories?.name;
      if (slug && name && !seen.has(slug)) seen.set(slug, name);
    }
    return Array.from(seen, ([slug, name]) => ({ slug, name }));
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      if (filter !== "all" && p.product_categories?.slug !== filter) return false;
      if (!q) return true;
      const name = (p.name ?? "").toLowerCase();
      const cat  = (p.product_categories?.name ?? "").toLowerCase();
      return name.includes(q) || cat.includes(q) || (p.is_preorder && "pre-order preorder".includes(q));
    });
  }, [products, filter, search]);

  const filters: { key: string; label: string; count: number }[] = [
    { key: "all", label: "ALL", count: products.length },
    ...categories.map(c => ({
      key: c.slug,
      label: c.name.toUpperCase(),
      count: products.filter(p => p.product_categories?.slug === c.slug).length,
    })),
  ];

  return (
    <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "40px 48px 96px" }}>
      <style>{`
        .shb-card { transition: transform 0.2s, border-color 0.2s; }
        .shb-card:hover { transform: translateY(-2px); border-color: #1A8040 !important; }
        @media (max-width: 720px) {
          .shb-shell { padding: 24px !important; }
          .shb-toolbar { flex-direction: column !important; align-items: stretch !important; }
          .shb-search-wrap { max-width: 100% !important; }
        }
      `}</style>

      {/* Filter + search */}
      <div className="shb-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {filters.map(f => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  fontFamily: SG, fontSize: "11px", fontWeight: 700, letterSpacing: "1.2px",
                  color: active ? "#ffffff" : C.forest,
                  background: active ? C.green : C.mist,
                  border: `1.5px solid ${active ? C.green : "transparent"}`,
                  borderRadius: "999px",
                  padding: "9px 16px",
                  cursor: "pointer",
                  outline: "none",
                  transition: "background 0.15s, color 0.15s",
                  boxShadow: active ? "0 2px 8px rgba(26,128,64,0.25)" : "none",
                }}>
                {f.label}
                <span style={{ fontSize: "10px", background: active ? "rgba(255,255,255,0.22)" : "rgba(26,128,64,0.14)", borderRadius: "999px", padding: "1px 7px", color: active ? "#ffffff" : C.green }}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="shb-search-wrap" style={{ position: "relative", maxWidth: "320px", width: "100%" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7A8E7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search merch or category…"
            style={{ width: "100%", background: "#ffffff", border: `1.5px solid ${C.border}`, borderRadius: "999px", padding: "10px 40px 10px 40px", color: C.forest, fontFamily: B, fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              aria-label="Clear search"
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: C.mist, border: "1px solid " + C.border, borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <IconX size={10} color="#5A7A60" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: `1.5px dashed ${C.border}`, borderRadius: "16px", padding: "72px 24px", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: C.mist, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
            <IconShoppingBag size={26} color={C.sage} />
          </div>
          <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: C.forest, letterSpacing: "2px", marginBottom: "6px" }}>
            {products.length ? "NO MERCH MATCHES THIS FILTER" : "NO MERCH YET"}
          </div>
          <p style={{ fontFamily: B, fontSize: "13px", color: C.muted, margin: "0 0 16px" }}>
            {products.length ? "Try a different filter or clear your search." : "Check back soon — the next drop is on the way!"}
          </p>
          {(search || filter !== "all") && products.length > 0 && (
            <button type="button" onClick={() => { setSearch(""); setFilter("all"); }}
              style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: C.green, border: "none", borderRadius: "10px", padding: "9px 18px", cursor: "pointer", letterSpacing: "1.2px", boxShadow: "0 2px 8px rgba(26,128,64,0.25)" }}>
              CLEAR FILTERS
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "20px", alignItems: "stretch" }}>
          {filtered.map(p => {
            const outOfStock = p.stock === 0;
            const lowStock = p.stock > 0 && p.stock <= 5;
            return (
              <Link key={p.id} href={`/shop/${p.product_categories?.slug}/${p.id}`} style={{ textDecoration: "none", height: "100%", display: "block" }}>
                <div className="shb-card" style={{ background: "#ffffff", border: `1px solid ${C.border}`, borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", boxShadow: "0 2px 12px rgba(15,42,30,0.04)" }}>
                  <div style={{ position: "relative", aspectRatio: "1/1", background: C.mist }}>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IconShoppingBag size={36} color="#B7CDB7" />
                      </div>
                    )}
                    {/* Top fade keeps the badges readable on light product shots */}
                    {p.images?.[0] && (
                      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(15,42,30,0.35) 0%, transparent 34%)" }} />
                    )}
                    {/* Admin-only marker — mirrors the preview rule on the detail page */}
                    {p.is_active === false && (
                      <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2 }}>
                        <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: "#B45309", borderRadius: "999px", padding: "3px 10px", letterSpacing: "1.5px", boxShadow: "0 4px 12px rgba(0,0,0,0.35)" }}>HIDDEN</span>
                      </div>
                    )}
                    <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 2, display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end" }}>
                      {/* Pre-order first: it changes what the buyer is agreeing
                          to, so it must be legible before the stock pill. */}
                      {p.is_preorder && (
                        <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: "#7A5AB8", borderRadius: "999px", padding: "3px 10px", letterSpacing: "1.5px", boxShadow: "0 4px 12px rgba(0,0,0,0.35)" }}>
                          PRE-ORDER
                        </span>
                      )}
                      <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#ffffff", background: outOfStock ? "#CC3344" : lowStock ? "#B78A1F" : C.green, borderRadius: "999px", padding: "3px 10px", letterSpacing: "1.5px", boxShadow: "0 4px 12px rgba(0,0,0,0.35)" }}>
                        {outOfStock ? "SOLD OUT" : lowStock ? `ONLY ${p.stock} LEFT` : "IN STOCK"}
                      </span>
                    </div>
                    {outOfStock && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(250,253,249,0.72)" }} />
                    )}
                  </div>

                  <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                    <h3 style={{ fontFamily: S, fontSize: "17px", color: C.forest, margin: 0, lineHeight: 1.25 }}>{p.name}</h3>

                    {p.product_categories?.name && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <IconShoppingBag size={12} color={C.sage} />
                        <span style={{ fontFamily: B, fontSize: "12px", color: C.muted }}>{p.product_categories.name}</span>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginTop: "auto", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontFamily: S, fontSize: "16px", color: outOfStock ? C.muted : C.green }}>
                        ₱{Number(p.price).toLocaleString()}
                      </span>
                      <span style={{ marginLeft: "auto", fontFamily: SG, fontSize: "10px", fontWeight: 700, color: C.green, letterSpacing: "1.4px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        VIEW →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
