"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

type MediaItem = {
  key: string;
  url: string;
  folder: string;
  name: string;
  size: number;
  lastModified: string;
  type: "image" | "pdf" | "other";
  ext: string;
};

const FOLDERS = ["all", "products", "events", "avatars", "community", "badges", "reports", "projects", "gallery"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("products");
  const [toast, setToast] = useState("");
  const [savings, setSavings] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ keys: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params = folder !== "all" ? `?folder=${folder}` : "";
      const res = await fetch(`/api/admin/media${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      showToast("Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    all: items.length,
    images: items.filter(i => i.type === "image").length,
    pdfs: items.filter(i => i.type === "pdf").length,
  };

  const totalSize = items.reduce((acc, i) => acc + i.size, 0);

  function toggleSelect(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(i => i.key)));
    }
  }

  async function handleDelete(keys: string[]) {
    setDeleteModal({ keys });
  }

  async function confirmDelete(keys: string[]) {
    setDeleteModal(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys }),
      });
      if (!res.ok) throw new Error("Delete failed");
      showToast(`Deleted ${keys.length} file${keys.length > 1 ? "s" : ""}`);
      setSelected(new Set());
      await load();
    } catch {
      showToast("Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function handleUpload(files: FileList) {
    if (!files.length) return;
    setUploading(true);
    setSavings("");
    let successCount = 0;
    let totalOriginal = 0;
    let totalOptimized = 0;

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", uploadFolder);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) { showToast(data.error || "Upload failed"); continue; }
        successCount++;
        totalOriginal += data.originalSize ?? file.size;
        totalOptimized += data.optimizedSize ?? file.size;
      } catch {
        showToast(`Failed to upload ${file.name}`);
      }
    }

    if (successCount > 0) {
      const savedPct = Math.round((1 - totalOptimized / totalOriginal) * 100);
      const msg = savedPct > 0
        ? `Uploaded ${successCount} file${successCount > 1 ? "s" : ""}. Saved ${savedPct}% via WebP optimization!`
        : `Uploaded ${successCount} file${successCount > 1 ? "s" : ""}`;
      showToast(msg);
      setSavings(savedPct > 0 ? `${formatSize(totalOriginal)} → ${formatSize(totalOptimized)} (${savedPct}% saved)` : "");
    }
    setUploading(false);
    await load();
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    showToast("URL copied!");
  }

  const s: Record<string, React.CSSProperties> = {
    page: { display: "flex", flexDirection: "column", gap: "20px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" },
    title: { fontFamily: R, fontSize: "1.5rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" },
    meta: { fontFamily: B, fontSize: "12px", color: "#4A7C59" },
    topRow: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" },
    uploadBtn: { position: "relative" as const, display: "inline-block" },
    uploadBtnShadow: { position: "absolute" as const, top: "3px", left: "3px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" },
    uploadBtnInner: { position: "relative" as const, display: "block", fontFamily: R, fontSize: "12px", background: "#1A8040", color: "#1B3A2D", padding: "8px 16px", border: "2px solid #1B3A2D", borderRadius: "6px", letterSpacing: "1px", cursor: "pointer" },
    select: { fontFamily: B, fontSize: "12px", background: "#FFFFFF", color: "#4A7C59", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "7px 10px" },
    searchBar: { display: "flex", gap: "8px", alignItems: "center" },
    searchInput: { fontFamily: B, fontSize: "12px", background: "#FFFFFF", color: "#1B3A2D", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "7px 12px", width: "200px", outline: "none" },
    folderTabs: { display: "flex", gap: "6px", flexWrap: "wrap" as const },
    tab: { fontFamily: B, fontSize: "11px", background: "#FFFFFF", color: "#4A7C59", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", letterSpacing: "0.5px" },
    tabActive: { fontFamily: B, fontSize: "11px", background: "#2C1A0A", color: "#1A8040", border: "1px solid #1A8040", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", letterSpacing: "0.5px" },
    statsRow: { display: "flex", gap: "10px", flexWrap: "wrap" as const },
    stat: { background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "8px", padding: "8px 14px", fontFamily: B, fontSize: "11px", color: "#4A7C59" },
    statVal: { fontFamily: R, fontSize: "14px", color: "#1B3A2D", display: "block" },
    toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: "8px" },
    toolbarLeft: { display: "flex", gap: "8px", alignItems: "center" },
    checkAll: { fontFamily: B, fontSize: "11px", color: "#4A7C59", background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "5px 10px", cursor: "pointer" },
    delSel: { fontFamily: B, fontSize: "11px", color: "#CC3344", background: "transparent", border: "1px solid #CC3344", borderRadius: "6px", padding: "5px 12px", cursor: "pointer" },
    viewToggle: { display: "flex", gap: "4px" },
    viewBtn: { background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", color: "#4A7C59" },
    viewBtnActive: { background: "#2C1A0A", border: "1px solid #1A8040", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "13px", color: "#1A8040" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" },
    card: { background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "10px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" },
    cardSel: { background: "#FFFFFF", border: "2px solid #1A8040", borderRadius: "10px", overflow: "hidden", cursor: "pointer" },
    thumb: { height: "110px", background: "#F2F7F2", position: "relative" as const, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
    thumbImg: { width: "100%", height: "100%", objectFit: "cover" as const },
    pdfThumb: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: "4px", height: "100%" },
    checkBadge: { position: "absolute" as const, top: "6px", right: "6px", width: "20px", height: "20px", background: "#1A8040", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "white", fontWeight: 700 },
    folderBadge: { position: "absolute" as const, bottom: "6px", left: "6px", background: "rgba(0,0,0,0.65)", borderRadius: "4px", padding: "2px 6px", fontFamily: B, fontSize: "9px", color: "#4A7C59" },
    cardBody: { padding: "8px 10px 10px" },
    cardName: { fontFamily: B, fontSize: "11px", color: "#1B3A2D", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis", marginBottom: "2px" },
    cardMeta: { fontFamily: B, fontSize: "10px", color: "#5A7A60", marginBottom: "8px" },
    cardActions: { display: "flex", gap: "4px" },
    actBtn: { flex: 1, background: "transparent", border: "1px solid #DDE8DD", borderRadius: "4px", padding: "4px 0", fontFamily: B, fontSize: "10px", color: "#4A7C59", cursor: "pointer", textAlign: "center" as const, letterSpacing: "0.5px" },
    actDel: { flex: 1, background: "transparent", border: "1px solid #3A1010", borderRadius: "4px", padding: "4px 0", fontFamily: B, fontSize: "10px", color: "#CC3344", cursor: "pointer", textAlign: "center" as const },
    listTable: { width: "100%", borderCollapse: "collapse" as const },
    listTh: { fontFamily: B, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px", padding: "8px 12px", textAlign: "left" as const, borderBottom: "1px solid #DDE8DD" },
    listTd: { fontFamily: B, fontSize: "12px", color: "#1B3A2D", padding: "8px 12px", borderBottom: "1px solid #DDE8DD", verticalAlign: "middle" as const },
    empty: { textAlign: "center" as const, padding: "48px", fontFamily: R, color: "#5A7A60", fontSize: "13px", letterSpacing: "1px" },
    toast: { position: "fixed" as const, bottom: "24px", right: "24px", background: "#FFFFFF", border: "1px solid #1A8040", borderRadius: "8px", padding: "10px 18px", fontFamily: B, fontSize: "12px", color: "#1A8040", zIndex: 9999 },
    lightboxOverlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" as const, gap: "16px", padding: "24px" },    lightboxImg: { maxWidth: "80vw", maxHeight: "70vh", borderRadius: "8px", objectFit: "contain" as const },
    lightboxName: { fontFamily: R, fontSize: "13px", color: "#1B3A2D", letterSpacing: "1px" },
    lightboxClose: { position: "absolute" as const, top: "20px", right: "20px", background: "transparent", border: "1px solid #5A7A50", color: "#4A7C59", borderRadius: "6px", padding: "6px 14px", fontFamily: B, fontSize: "12px", cursor: "pointer" },
    lightboxActions: { display: "flex", gap: "10px" },
    lightboxBtn: { background: "#FFFFFF", border: "1px solid #DDE8DD", borderRadius: "6px", padding: "7px 18px", fontFamily: B, fontSize: "12px", color: "#4A7C59", cursor: "pointer" },
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.title}>MEDIA LIBRARY</div>
          <div style={s.meta}>{counts.all} files · {counts.images} images · {counts.pdfs} PDFs · {formatSize(totalSize)} total</div>
          {savings && <div style={{ fontFamily: B, fontSize: "11px", color: "#1A8040", marginTop: "2px" }}>✓ {savings}</div>}
        </div>
        <div style={s.topRow}>
          <select
            style={s.select}
            value={uploadFolder}
            onChange={e => setUploadFolder(e.target.value)}
          >
            {FOLDERS.filter(f => f !== "all").map(f => (
              <option key={f} value={f}>{f}/</option>
            ))}
          </select>
          <div style={s.uploadBtn}>
            <span style={s.uploadBtnShadow} />
            <span
              style={s.uploadBtnInner}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "UPLOADING..." : "+ UPLOAD"}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            style={{ display: "none" }}
            onChange={e => { if (e.target.files) handleUpload(e.target.files); e.target.value = ""; }}
          />
        </div>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        {FOLDERS.filter(f => f !== "all").map(f => {
          const count = items.filter(i => i.folder === f).length;
          if (count === 0) return null;
          return (
            <div key={f} style={s.stat}>
              <span style={s.statVal}>{count}</span>
              {f}/
            </div>
          );
        })}
      </div>

      {/* Folder tabs + search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={s.folderTabs}>
          {FOLDERS.map(f => (
            <span
              key={f}
              style={folder === f ? s.tabActive : s.tab}
              onClick={() => setFolder(f)}
            >
              {f === "all" ? "ALL" : `${f}/`}
            </span>
          ))}
        </div>
        <input
          style={s.searchInput}
          placeholder="Search files..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <div style={s.toolbarLeft}>
          <button style={s.checkAll} onClick={toggleAll}>
            {selected.size === filtered.length && filtered.length > 0 ? "Deselect all" : `Select all (${filtered.length})`}
          </button>
          {selected.size > 0 && (
            <button
              style={s.delSel}
              onClick={() => handleDelete(Array.from(selected))}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : `Delete ${selected.size} selected`}
            </button>
          )}
        </div>
        <div style={s.viewToggle}>
          <button style={view === "grid" ? s.viewBtnActive : s.viewBtn} onClick={() => setView("grid")}>⊞</button>
          <button style={view === "list" ? s.viewBtnActive : s.viewBtn} onClick={() => setView("list")}>☰</button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={s.empty}>LOADING...</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>NO FILES FOUND</div>
      ) : view === "grid" ? (
        <div style={s.grid}>
          {filtered.map(item => (
            <div
              key={item.key}
              style={selected.has(item.key) ? s.cardSel : s.card}
              onClick={() => toggleSelect(item.key)}
            >
              <div style={s.thumb}>
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    style={s.thumbImg}
                    loading="lazy"
                    onClick={e => { e.stopPropagation(); setLightbox(item); }}
                  />
                ) : item.type === "pdf" ? (
                  <div style={s.pdfThumb}>
                    <span style={{ fontSize: "32px" }}>📄</span>
                    <span style={{ fontFamily: B, fontSize: "10px", color: "#4A7C59" }}>PDF</span>
                  </div>
                ) : (
                  <span style={{ fontSize: "28px" }}>📁</span>
                )}
                {selected.has(item.key) && <div style={s.checkBadge}>✓</div>}
                {folder === "all" && <div style={s.folderBadge}>{item.folder}/</div>}
              </div>
              <div style={s.cardBody}>
                <div style={s.cardName} title={item.name}>{item.name}</div>
                <div style={s.cardMeta}>{formatSize(item.size)} · {formatDate(item.lastModified)}</div>
                <div style={s.cardActions} onClick={e => e.stopPropagation()}>
                  <button style={s.actBtn} onClick={() => copyUrl(item.url)}>Copy URL</button>
                  <button style={s.actDel} onClick={() => handleDelete([item.key])}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table style={s.listTable}>
          <thead>
            <tr>
              <th style={s.listTh}></th>
              <th style={s.listTh}>FILE</th>
              <th style={s.listTh} className="media-list-col-folder">FOLDER</th>
              <th style={s.listTh} className="media-list-col-size">SIZE</th>
              <th style={s.listTh} className="media-list-col-uploaded">UPLOADED</th>
              <th style={s.listTh} className="media-list-col-actions">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr
                key={item.key}
                style={{ background: selected.has(item.key) ? "#2C1A0A" : "transparent", cursor: "pointer" }}
                onClick={() => toggleSelect(item.key)}
              >
                <td style={{ ...s.listTd, width: "36px" }}>
                  <div style={{ width: "16px", height: "16px", border: `2px solid ${selected.has(item.key) ? "#1A8040" : "#DDE8DD"}`, borderRadius: "4px", background: selected.has(item.key) ? "#1A8040" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "white" }}>
                    {selected.has(item.key) ? "✓" : ""}
                  </div>
                </td>
                <td style={s.listTd}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {item.type === "image" ? (
                      <img src={item.url} alt={item.name} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px", border: "1px solid #DDE8DD" }} loading="lazy" />
                    ) : (
                      <div style={{ width: "36px", height: "36px", background: "#F2F7F2", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>📄</div>
                    )}
                    <span style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                  </div>
                </td>
                <td style={{ ...s.listTd, color: "#4A7C59" }} className="media-list-col-folder">{item.folder}/</td>
                <td style={{ ...s.listTd, color: "#4A7C59" }} className="media-list-col-size">{formatSize(item.size)}</td>
                <td style={{ ...s.listTd, color: "#4A7C59" }} className="media-list-col-uploaded">{formatDate(item.lastModified)}</td>
                <td style={s.listTd} className="media-list-col-actions" onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button style={s.actBtn} onClick={() => copyUrl(item.url)}>Copy URL</button>
                    {item.type === "pdf" && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ ...s.actBtn, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>View</a>
                    )}
                    <button style={s.actDel} onClick={() => handleDelete([item.key])}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Delete Modal */}
      {deleteModal && createPortal(
        <>
          <div onClick={() => setDeleteModal(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9997 }}/>
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:"#FFFFFF", border:"2px solid #DDE8DD", borderRadius:"16px", padding:"32px 28px", zIndex:9998, width:"320px", textAlign:"center" }}>
            <div style={{ width:"56px", height:"56px", background:"#FFE8EC", borderRadius:"12px", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:"24px" }}>🗑️</div>
            <div style={{ fontFamily:R, fontSize:"1.2rem", color:"#1B3A2D", marginBottom:"10px", letterSpacing:"1px" }}>Delete {deleteModal.keys.length > 1 ? `${deleteModal.keys.length} files` : "file"}?</div>
            <div style={{ fontFamily:B, fontSize:"13px", color:"#4A7C59", marginBottom:"28px", lineHeight:"1.6" }}>This action can&apos;t be undone. The {deleteModal.keys.length > 1 ? "files" : "file"} will be permanently removed.</div>
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={() => setDeleteModal(null)} style={{ flex:1, fontFamily:B, fontSize:"13px", background:"transparent", color:"#4A7C59", border:"2px solid #DDE8DD", borderRadius:"10px", padding:"12px", cursor:"pointer" }}>Cancel</button>
              <button onClick={() => confirmDelete(deleteModal.keys)} style={{ flex:1, fontFamily:B, fontSize:"13px", background:"#CC3344", color:"white", border:"none", borderRadius:"10px", padding:"12px", cursor:"pointer", fontWeight:700 }}>Delete</button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Lightbox */}
      {lightbox && createPortal(
        <div style={s.lightboxOverlay} onClick={() => setLightbox(null)}>
          <button style={s.lightboxClose} onClick={() => setLightbox(null)}>✕ CLOSE</button>
          <img src={lightbox.url} alt={lightbox.name} style={s.lightboxImg} onClick={e => e.stopPropagation()} />
          <div style={s.lightboxName}>{lightbox.name} · {formatSize(lightbox.size)} · {lightbox.folder}/</div>
          <div style={s.lightboxActions} onClick={e => e.stopPropagation()}>
            <button style={s.lightboxBtn} onClick={() => copyUrl(lightbox.url)}>Copy URL</button>
            <button style={{ ...s.lightboxBtn, color: "#CC3344", borderColor: "#CC3344" }} onClick={() => { handleDelete([lightbox.key]); setLightbox(null); }}>Delete</button>
          </div>
        </div>,
        document.body
      )}

      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  );
}
