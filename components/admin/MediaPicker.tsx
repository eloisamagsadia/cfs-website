"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { IconX, IconPhoto, IconFile } from "@/components/shared/Icons";

const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface MediaItem {
  key: string;
  url: string;
  folder: string;
  name: string;
  size: number;
  lastModified: string;
  type: "image" | "pdf" | "other";
}

interface Props {
  /** If provided, the picker opens filtered to this folder; otherwise shows all. */
  folder?: string;
  /** Only show items of these types (default: images) */
  types?: ("image" | "pdf" | "other")[];
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
}

const FOLDERS = ["all", "products", "events", "avatars", "community", "badges", "reports", "projects", "gallery"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPicker({ folder, types = ["image"], open, onClose, onPick }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<string>(folder ?? "all");
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const url = activeFolder === "all" ? "/api/admin/media" : `/api/admin/media?folder=${activeFolder}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setItems(d.items ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, activeFolder]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(i => {
      if (!types.includes(i.type)) return false;
      if (!q) return true;
      return i.name.toLowerCase().includes(q);
    });
  }, [items, search, types]);

  if (!open || !mounted) return null;

  return createPortal(
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,42,30,0.72)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "1080px", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", borderBottom: "1px solid #E4EDE4" }}>
          <div>
            <div style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#4A7C59", letterSpacing: "2px" }}>PICK FROM LIBRARY</div>
            <div style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A", marginTop: "2px" }}>{filtered.length} items · pick an existing file instead of uploading again</div>
          </div>
          <button type="button" onClick={onClose}
            style={{ background: "#F2F7F2", border: "1px solid #DDE8DD", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <IconX size={14} color="#5A7A60" />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: "14px 22px", borderBottom: "1px solid #F0F5F0", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {FOLDERS.map(f => {
              const active = activeFolder === f;
              return (
                <button key={f} type="button" onClick={() => setActiveFolder(f)}
                  style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "1.2px", color: active ? "#ffffff" : "#1B3A2D", background: active ? "#1A8040" : "#F2F7F2", border: `1.5px solid ${active ? "#1A8040" : "transparent"}`, borderRadius: "999px", padding: "6px 12px", cursor: "pointer", outline: "none" }}>
                  {f === "all" ? "ALL" : `${f.toUpperCase()}/`}
                </button>
              );
            })}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search filename…"
            style={{ marginLeft: "auto", fontFamily: B, fontSize: "12px", background: "#F7FAF5", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "8px 14px", color: "#1B3A2D", outline: "none", minWidth: "200px" }} />
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 22px", background: "#FAFDF9" }}>
          {loading ? (
            <div style={{ fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#7A8E7A", letterSpacing: "2px", padding: "48px", textAlign: "center" }}>LOADING…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "56px 24px", textAlign: "center" }}>
              <div style={{ marginBottom: "10px" }}><IconPhoto size={32} color="#B7CDB7" /></div>
              <div style={{ fontFamily: SG, fontSize: "12px", fontWeight: 700, color: "#4A7C59", letterSpacing: "2px" }}>NO MATCHES</div>
              <div style={{ fontFamily: B, fontSize: "12px", color: "#7A8E7A", marginTop: "6px" }}>Try a different folder or search term.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px" }}>
              {filtered.map(item => (
                <button key={item.key} type="button"
                  onClick={() => { onPick(item.url); onClose(); }}
                  style={{ background: "#ffffff", border: "1.5px solid #E4EDE4", borderRadius: "12px", padding: 0, overflow: "hidden", cursor: "pointer", textAlign: "left" as const, display: "flex", flexDirection: "column", transition: "border-color 0.15s, transform 0.15s", outline: "none" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#1A8040"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#E4EDE4"; e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <div style={{ aspectRatio: "1/1", background: "#F2F7F2", position: "relative", overflow: "hidden" }}>
                    {item.type === "image" ? (
                      <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : item.type === "pdf" ? (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><IconFile size={30} color="#B7CDB7" /></div>
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><IconPhoto size={30} color="#B7CDB7" /></div>
                    )}
                    <span style={{ position: "absolute", top: "6px", left: "6px", fontFamily: SG, fontSize: "8px", fontWeight: 700, color: "#ffffff", background: "rgba(15,42,30,0.72)", borderRadius: "999px", padding: "2px 7px", letterSpacing: "1px" }}>{item.folder}</span>
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontFamily: B, fontSize: "11px", color: "#1B3A2D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{item.name}</div>
                    <div style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A", marginTop: "2px" }}>{formatSize(item.size)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
