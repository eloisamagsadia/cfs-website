"use client";
import { useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";

export default function ProductImageGallery({ images, productName, inStock, accentColor }: {
  images: string[];
  productName: string;
  inStock: boolean;
  accentColor: string;
}) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);

  return (
    <div style={{ maxWidth: "100%", overflow: "hidden" }}>
      {/* Main image */}
      <div style={{ position: "relative", padding: "4px 4px 8px 0", marginBottom: "10px", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "calc(100% - 4px)", height: "calc(100% - 4px)", borderRadius: "12px", background: "#080F06", overflow: "hidden" }} />
        <div
          onMouseEnter={() => { if (window.innerWidth > 768 && !lightbox) setZoomed(true); }}
          onMouseLeave={() => setZoomed(false)}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setMousePos({ x, y });
          }}
          onClick={() => { setLightbox(true); setZoomed(false); }}
          className="product-main-image" style={{ position: "relative", background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", overflow: "hidden", zIndex: 1, height: "420px", cursor: "zoom-in" }}>
          {images[selected]
            ? <img src={images[selected]} alt={productName} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.1s ease", transform: zoomed ? "scale(2)" : "scale(1)", transformOrigin: `${mousePos.x}% ${mousePos.y}%` }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "72px" }}>🛍</div>
          }
          {!inStock && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(8,15,6,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: R, fontSize: "16px", color: "#F04060", letterSpacing: "2px", background: "#3D0A18", border: "2px solid #F04060", borderRadius: "8px", padding: "10px 20px" }}>OUT OF STOCK</span>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: "flex", gap: "8px", maxWidth: "100%" }}>
          {images.slice(0, 4).map((img, i) => (
            <div key={i} onClick={() => { setSelected(i); }}
              style={{ width: "72px", height: "72px", borderRadius: "8px", overflow: "hidden", border: `2px solid ${selected === i ? accentColor : "#2C4820"}`, flexShrink: 0, cursor: "pointer", transition: "border-color 0.15s", opacity: selected === i ? 1 : 0.6 }}>
              <img src={img} alt={`${productName} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
            </div>
          ))}
          {images.length > 4 && (
            <div onClick={() => { setSelected(4); setLightbox(true); }}
              style={{ width: "72px", height: "72px", borderRadius: "8px", overflow: "hidden", border: "2px solid #2C4820", flexShrink: 0, cursor: "pointer", background: "#1A2614", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontFamily: "var(--font-righteous,'Righteous',sans-serif)", fontSize: "14px", color: "#F0EAD6" }}>+{images.length - 4}</span>
              <span style={{ fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "9px", color: "#5A7A50", letterSpacing: "1px" }}>MORE</span>
            </div>
          )}
        </div>
      )}
    {/* Lightbox */}
      {lightbox && (
        <div onClick={() => { setLightbox(false); setZoomed(false); }}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", flexDirection: "column" }}>
          <button onClick={() => setLightbox(false)}
            style={{ position: "absolute", top: "20px", right: "24px", background: "none", border: "none", color: "#F0EAD6", fontSize: "28px", cursor: "pointer", zIndex: 2001 }}>✕</button>
          {selected > 0 && (
            <button onClick={e => { e.stopPropagation(); setSelected(s => s - 1); }}
              style={{ position: "absolute", left: "20px", background: "rgba(255,255,255,0.1)", border: "none", color: "#F0EAD6", fontSize: "28px", cursor: "pointer", borderRadius: "50%", width: "48px", height: "48px", zIndex: 2001 }}>‹</button>
          )}
          {selected < images.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setSelected(s => s + 1); }}
              style={{ position: "absolute", right: "20px", background: "rgba(255,255,255,0.1)", border: "none", color: "#F0EAD6", fontSize: "28px", cursor: "pointer", borderRadius: "50%", width: "48px", height: "48px", zIndex: 2001 }}>›</button>
          )}
          <div onClick={e => e.stopPropagation()}
            style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh", overflow: "hidden" }}>
            <img src={images[selected]} alt={productName}
              style={{ maxWidth: "100vw", maxHeight: "100vh", objectFit: "contain", borderRadius: "0" }} />
          </div>
          {images.length > 1 && (
            <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px" }}>
              {images.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setSelected(i); }}
                  style={{ width: "8px", height: "8px", borderRadius: "50%", background: selected === i ? "#F0EAD6" : "rgba(255,255,255,0.3)", border: "none", cursor: "pointer", padding: 0 }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
