"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconCheck, IconWarning } from "@/components/shared/Icons";

const R  = "var(--font-righteous,'Righteous',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

const inp: React.CSSProperties = {
  background: "#ffffff", border: "1.5px solid #DDE8DD", borderRadius: "10px",
  padding: "9px 14px", color: "#1B3A2D", fontFamily: B, fontSize: "13px",
  outline: "none", boxSizing: "border-box",
};

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
  image: string | null;
  sold_30d: number;
}

type Tier = "out" | "low" | "healthy";

function tierOf(stock: number, threshold: number): Tier {
  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";
  return "healthy";
}

const TIER_META: Record<Tier, { color: string; bg: string; label: string }> = {
  out:     { color: "#8A1E27", bg: "#FFE8EC", label: "OUT OF STOCK" },
  low:     { color: "#7A5A0F", bg: "#FFF3D6", label: "LOW STOCK" },
  healthy: { color: "#156530", bg: "#E8F0E4", label: "HEALTHY" },
};

const STORAGE_KEY = "cfs:shop-low-stock-threshold";

export default function ShopStockDashboard() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [status, setStatus]       = useState("");
  const [busy, setBusy]           = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<Tier | "all">("all");
  const [threshold, setThreshold] = useState<number>(() => {
    if (typeof window === "undefined") return 5;
    return parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "5") || 5;
  });
  const [edit, setEdit] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, String(threshold));
  }, [threshold]);

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/admin/shop/stock");
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setProducts(d.products ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => {
    const c: Record<Tier | "all", number> = { all: products.length, out: 0, low: 0, healthy: 0 };
    for (const p of products) c[tierOf(p.stock, threshold)]++;
    return c;
  }, [products, threshold]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p =>
      (filter === "all" || tierOf(p.stock, threshold) === filter) &&
      (!q || p.name.toLowerCase().includes(q))
    );
  }, [products, filter, search, threshold]);

  async function save(p: Product) {
    const raw = edit[p.id];
    if (raw === undefined) return;
    const n = parseInt(raw);
    if (!Number.isFinite(n) || n < 0) { setError("Stock must be 0 or a positive integer."); return; }
    setBusy(p.id); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/products?id=${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock: n }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, stock: n } : x));
      setEdit(prev => { const c = { ...prev }; delete c[p.id]; return c; });
      setStatus(`Updated "${p.name}" to ${n} in stock.`);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function adjust(p: Product, delta: number) {
    const n = Math.max(0, p.stock + delta);
    setBusy(p.id); setError(""); setStatus("");
    try {
      const r = await fetch(`/api/admin/products?id=${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock: n }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, stock: n } : x));
    } catch (e: any) { setError(e.message); }
    finally { setBusy(null); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>STOCK</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59" }}>
            Full inventory sorted by stock ascending, with 30-day sales velocity so you can spot burn-through before it becomes an OUT badge.
          </p>
        </div>
        <Link href="/admin/shop" style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px" }}>
          ← ALL PRODUCTS
        </Link>
      </div>

      {/* Tier tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
        {(["out", "low", "healthy"] as Tier[]).map(t => {
          const meta = TIER_META[t];
          const active = filter === t;
          return (
            <button key={t} onClick={() => setFilter(active ? "all" : t)}
              style={{ background: active ? meta.bg : "#ffffff", border: `1.5px solid ${active ? meta.color : "#DDE8DD"}`, borderRadius: "12px", padding: "14px 16px", textAlign: "left" as const, cursor: "pointer", display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: meta.color, letterSpacing: "1.3px" }}>{meta.label}</span>
              <span style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "1px" }}>{counts[t]}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setFilter("all")}
          style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: filter === "all" ? "#ffffff" : "#1B3A2D", background: filter === "all" ? "#1A8040" : "#ffffff", border: `1.5px solid ${filter === "all" ? "#1A8040" : "#DDE8DD"}`, borderRadius: "999px", padding: "6px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
          ALL ({counts.all})
        </button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ ...inp, flex: 1, minWidth: "200px" }} />
        <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>
          Low threshold ≤
          <input type="number" min="1" max="999" value={threshold} onChange={e => setThreshold(parseInt(e.target.value) || 1)}
            style={{ ...inp, width: "70px", padding: "6px 10px" }} />
        </label>
      </div>

      {error && <div style={{ background: "#FFE8EC", border: "1.5px solid #CC3344", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#CC3344", display: "flex", gap: "8px", alignItems: "center" }}><IconWarning size={13} color="#CC3344" /> {error}</div>}
      {status && <div style={{ background: "#E8F0E4", border: "1.5px solid #1A8040", borderRadius: "10px", padding: "10px 14px", fontFamily: B, fontSize: "13px", color: "#156530", display: "flex", gap: "8px", alignItems: "center" }}><IconCheck size={13} color="#156530" /> {status}</div>}

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", fontFamily: SG, letterSpacing: "2px", color: "#7A8E7A" }}>LOADING…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1.5px dashed #DDE8DD", borderRadius: "14px", padding: "56px 24px", textAlign: "center", fontFamily: B, fontSize: "13px", color: "#7A8E7A" }}>
          No products match your filter.
        </div>
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #DDE8DD", borderRadius: "14px", overflow: "hidden" }}>
          {filtered.map((p, i) => {
            const tier = tierOf(p.stock, threshold);
            const meta = TIER_META[tier];
            const daysLeft = p.sold_30d > 0 ? Math.floor(p.stock / (p.sold_30d / 30)) : null;
            const editVal = edit[p.id];
            const dirty = editVal !== undefined && parseInt(editVal) !== p.stock;

            return (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "48px 1fr auto auto auto", gap: "12px", padding: "12px 18px", borderTop: i === 0 ? "none" : "1px solid #F0F5F0", background: i % 2 === 0 ? "#ffffff" : "#FBFDFB", alignItems: "center" }}>

                <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#F2F7F2", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {p.image ? <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: SG, fontSize: "9px", color: "#B7CDB7", letterSpacing: "1px" }}>NO IMG</span>}
                </div>

                <div style={{ minWidth: 0 }}>
                  <Link href={`/admin/shop/${p.id}`} style={{ fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "1px", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, display: "block" }}>{p.name}</Link>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>₱{Number(p.price).toLocaleString("en-PH")}</span>
                    <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>· {p.sold_30d} sold /30d</span>
                    {daysLeft != null && daysLeft < 30 && (
                      <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: daysLeft < 7 ? "#8A1E27" : "#7A5A0F", background: daysLeft < 7 ? "#FFE8EC" : "#FFF3D6", borderRadius: "6px", padding: "1px 6px", letterSpacing: "1.1px" }}>
                        ~{daysLeft}d left
                      </span>
                    )}
                    {!p.is_active && <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#5A5A5A", background: "#F0F0F0", borderRadius: "6px", padding: "1px 6px", letterSpacing: "1.1px" }}>INACTIVE</span>}
                  </div>
                </div>

                <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: meta.color, background: meta.bg, borderRadius: "6px", padding: "3px 8px", letterSpacing: "1.2px", whiteSpace: "nowrap" as const }}>{meta.label}</span>

                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button onClick={() => adjust(p, -1)} disabled={busy === p.id || p.stock <= 0}
                    style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#5A7A60", background: "#F2F7F2", border: "none", borderRadius: "8px", padding: "5px 10px", cursor: busy === p.id || p.stock <= 0 ? "not-allowed" : "pointer" }}>−</button>
                  <input value={editVal ?? String(p.stock)}
                    onChange={e => setEdit(prev => ({ ...prev, [p.id]: e.target.value }))}
                    onBlur={() => { if (dirty) save(p); else setEdit(prev => { const c = { ...prev }; delete c[p.id]; return c; }); }}
                    onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    type="number" min="0"
                    style={{ ...inp, width: "72px", padding: "6px 8px", fontSize: "13px", textAlign: "center" as const, fontWeight: 700, borderColor: dirty ? "#F0D889" : "#DDE8DD" }} />
                  <button onClick={() => adjust(p, +1)} disabled={busy === p.id}
                    style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#156530", background: "#E8F0E4", border: "none", borderRadius: "8px", padding: "5px 10px", cursor: busy === p.id ? "not-allowed" : "pointer" }}>+</button>
                </div>

                <Link href={`/admin/shop/${p.id}`}
                  style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#5A7A60", textDecoration: "none", letterSpacing: "1.2px", padding: "6px 10px" }}>
                  EDIT →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
