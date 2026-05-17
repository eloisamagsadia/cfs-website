"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

const CATEGORIES = [
  { value: "all", label: "All", icon: "✨" },
  { value: "events", label: "Events", icon: "🎪" },
  { value: "projects", label: "Projects", icon: "🎨" },
  { value: "behind_scenes", label: "Behind the Scenes", icon: "🎬" },
];

export default function ExclusivePage() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch("/api/exclusive")
      .then(r => r.json())
      .then((data) => {
        const { content, error } = data ?? {};
        if (!data) { setError("Failed to load"); setLoading(false); return; }
        if (error) setError(error);
        else setContent(content ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = activeCategory === "all" ? content : content.filter(c => c.category === activeCategory);

  if (error === "Sponsors only") return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center", gap: "16px" }}>
      <div style={{ fontSize: "48px" }}>✦</div>
      <h1 style={{ fontFamily: R, fontSize: "1.4rem", color: "#F0EAD6", letterSpacing: "3px" }}>SPONSORS ONLY</h1>
      <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78", maxWidth: "400px", lineHeight: 1.7 }}>
        This section is exclusive to CFS Sponsors. Sponsors get access to behind-the-scenes photos and videos from events and projects.
      </p>
      <div style={{ background: "#1A2614", border: "2px solid #B47FE360", borderRadius: "12px", padding: "20px 24px" }}>
        <div style={{ fontFamily: R, fontSize: "12px", color: "#B47FE3", letterSpacing: "2px", marginBottom: "8px" }}>HOW TO BECOME A SPONSOR</div>
        <div style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>Contact the CFS team to learn more about sponsorship.</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontFamily: R, fontSize: "11px", color: "#B47FE3", background: "#B47FE320", border: "1px solid #B47FE360", borderRadius: "20px", padding: "3px 12px", letterSpacing: "1px" }}>✦ SPONSORS ONLY</span>
        </div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>EXCLUSIVE CONTENT</h1>
        <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "14px", color: "#8AAA78" }}>Behind-the-scenes photos and videos just for you 💜</p>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setActiveCategory(cat.value)}
            style={{ fontFamily: R, fontSize: "11px", background: activeCategory === cat.value ? "#B47FE320" : "transparent", border: `1.5px solid ${activeCategory === cat.value ? "#B47FE3" : "#2C4820"}`, color: activeCategory === cat.value ? "#B47FE3" : "#5A7A50", borderRadius: "20px", padding: "5px 14px", cursor: "pointer", letterSpacing: "1px" }}>
            {cat.icon} {cat.label.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
          <div style={{ fontFamily: R, fontSize: "14px", color: "#5A7A50", letterSpacing: "2px" }}>NO CONTENT YET</div>
          <div style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", marginTop: "8px" }}>Check back soon for exclusive content!</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
          {filtered.map(item => (
            <div key={item.id} onClick={() => setSelected(item)}
              style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#B47FE3")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#2C4820")}
            >
              <div style={{ position: "relative", height: "180px", background: "#0F1A0B" }}>
                {item.type === "photo" && (item.thumbnail_url || item.media_url) && (
                  <img src={item.thumbnail_url || item.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                {item.type === "video" && (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px", background: "#1A2614" }}>
                    {item.thumbnail_url
                      ? <img src={item.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, opacity: 0.5 }} />
                      : null}
                    <span style={{ fontSize: "40px", position: "relative", zIndex: 1 }}>▶️</span>
                  </div>
                )}
                <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.6)", borderRadius: "20px", padding: "2px 8px" }}>
                  <span style={{ fontFamily: B, fontSize: "9px", color: "#B47FE3" }}>
                    {CATEGORIES.find(c => c.value === item.category)?.icon} {item.category.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", marginBottom: "4px" }}>{item.title}</div>
                {item.description && <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{item.description}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#1A2614", border: "2px solid #B47FE3", borderRadius: "16px", overflow: "hidden", maxWidth: "800px", width: "100%" }}>
            {selected.type === "photo"
              ? <img src={selected.media_url} alt="" style={{ width: "100%", maxHeight: "500px", objectFit: "contain", background: "#0F1A0B" }} />
              : <video src={selected.media_url} controls autoPlay style={{ width: "100%", maxHeight: "500px", background: "#000" }} />
            }
            <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: R, fontSize: "15px", color: "#F0EAD6", marginBottom: "4px" }}>{selected.title}</div>
                {selected.description && <div style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78" }}>{selected.description}</div>}
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", color: "#5A7A50", cursor: "pointer", fontFamily: R, fontSize: "12px", letterSpacing: "1px" }}>
                CLOSE ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
