"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "@/components/admin/FileUpload";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
interface Variant { name: string; options: string }

export default function AdminShopCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "", category_id: "", is_active: true });
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addVariant = () => setVariants(v => [...v, { name: "", options: "" }]);
  const setVariant = (i: number, k: keyof Variant, v: string) => setVariants(vs => vs.map((vt, idx) => idx === i ? { ...vt, [k]: v } : vt));
  const removeVariant = (i: number) => setVariants(vs => vs.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) return setError("Product name is required.");
    if (!form.price || isNaN(Number(form.price))) return setError("Valid price is required.");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, price: Number(form.price), stock: Number(form.stock || 0), images,
          variants: variants.filter(v => v.name.trim()).map(v => ({ name: v.name.trim(), options: v.options.split(",").map(o => o.trim()).filter(Boolean) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      router.push("/admin/shop"); router.refresh();
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const inputStyle = { width: "100%", background: "#0F1A0C", border: "2px solid #2C4820", borderRadius: "8px", padding: "10px 14px", color: "#F0EAD6", fontFamily: B, fontSize: "14px", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { fontFamily: B, fontSize: "12px", color: "#8AAA78", letterSpacing: "1px", marginBottom: "6px", display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "720px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>ADD PRODUCT</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#5A7A50" }}>Fill in the details below</p>
        </div>
        <button onClick={() => router.back()} style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>

      {error && <div style={{ background: "#2C1010", border: "2px solid #F04060", borderRadius: "8px", padding: "12px 16px", fontFamily: B, fontSize: "13px", color: "#F04060" }}>{error}</div>}

      <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div><label style={labelStyle}>PRODUCT NAME *</label><input style={inputStyle} placeholder="e.g. CFS Tote Bag" value={form.name} onChange={e => set("name", e.target.value)} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} placeholder="Describe the product..." value={form.description} onChange={e => set("description", e.target.value)} /></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div><label style={labelStyle}>PRICE (₱) *</label><input style={inputStyle} type="number" min="0" placeholder="0.00" value={form.price} onChange={e => set("price", e.target.value)} /></div>
          <div><label style={labelStyle}>STOCK</label><input style={inputStyle} type="number" min="0" placeholder="0" value={form.stock} onChange={e => set("stock", e.target.value)} /></div>
        </div>

        <div><label style={labelStyle}>CATEGORY ID</label><input style={inputStyle} placeholder="UUID from product_categories" value={form.category_id} onChange={e => set("category_id", e.target.value)} /></div>

        {/* Image uploads */}
        <div>
          <label style={labelStyle}>PRODUCT IMAGES</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {images.map((url, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <FileUpload
                    folder="products"
                    label={`Image ${i + 1}`}
                    currentUrl={url}
                    onUploaded={newUrl => setImages(imgs => imgs.map((img, idx) => idx === i ? newUrl : img))}
                    onRemove={() => setImages(imgs => imgs.filter((_, idx) => idx !== i))}
                  />
                </div>
              </div>
            ))}
            <button onClick={() => setImages(imgs => [...imgs, ""])} style={{ alignSelf: "flex-start", background: "none", border: "2px dashed #2C4820", borderRadius: "6px", color: "#5A7A50", fontFamily: B, fontSize: "12px", padding: "6px 14px", cursor: "pointer" }}>
              + Add Image
            </button>
          </div>
        </div>

        {/* Variants */}
        <div>
          <label style={labelStyle}>VARIANTS (optional)</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {variants.map((v, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "8px", alignItems: "center" }}>
                <input style={inputStyle} placeholder="Name (e.g. Size)" value={v.name} onChange={e => setVariant(i, "name", e.target.value)} />
                <input style={inputStyle} placeholder="Options: S,M,L,XL" value={v.options} onChange={e => setVariant(i, "options", e.target.value)} />
                <button onClick={() => removeVariant(i)} style={{ background: "#2C1010", border: "2px solid #F04060", borderRadius: "6px", color: "#F04060", fontFamily: B, fontSize: "11px", padding: "8px 10px", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <button onClick={addVariant} style={{ alignSelf: "flex-start", background: "none", border: "2px dashed #2C4820", borderRadius: "6px", color: "#5A7A50", fontFamily: B, fontSize: "12px", padding: "6px 14px", cursor: "pointer" }}>+ Add Variant</button>
          </div>
        </div>

        {/* Active toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => set("is_active", !form.is_active)} style={{ width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", background: form.is_active ? "#3CCE2A" : "#2C4820", position: "relative", transition: "background 0.2s" }}>
            <span style={{ position: "absolute", top: "3px", left: form.is_active ? "22px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#F0EAD6", transition: "left 0.2s" }} />
          </button>
          <span style={{ fontFamily: B, fontSize: "13px", color: form.is_active ? "#3CCE2A" : "#5A7A50" }}>{form.is_active ? "Active — visible in shop" : "Inactive — hidden from shop"}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={handleSubmit} disabled={loading} style={{ position: "relative", display: "inline-block", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          <span style={{ position: "absolute", top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
          <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "12px", background: "#F07228", color: "#F0EAD6", padding: "10px 28px", border: "2px solid #080F06", borderRadius: "6px", letterSpacing: "1.5px" }}>{loading ? "SAVING..." : "CREATE PRODUCT"}</span>
        </button>
        <button onClick={() => router.back()} style={{ fontFamily: R, fontSize: "12px", background: "none", border: "2px solid #2C4820", borderRadius: "6px", color: "#5A7A50", padding: "10px 20px", cursor: "pointer", letterSpacing: "1px" }}>CANCEL</button>
      </div>
    </div>
  );
}
