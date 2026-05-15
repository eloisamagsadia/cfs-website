"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const FOLDER_LABELS: Record<string, string> = {
  avatars: "Avatar",
  community: "Community Posts",
  products: "Products",
  events: "Events",
  reports: "Reports",
  projects: "Projects",
  badges: "Badges",
  gallery: "Gallery",
};

const FOLDER_ICONS: Record<string, string> = {
  avatars: "👤",
  community: "💬",
  products: "🛍️",
  events: "🎪",
  reports: "📄",
  projects: "🎨",
  badges: "🏅",
  gallery: "🖼️",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function timeAgo(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<Record<string, any[]>>({});
  const [totalSize, setTotalSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ key: string; url: string } | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>("all");

  useEffect(() => {
    fetch("/api/user/media")
      .then(r => r.json())
      .then(({ media, totalSize }) => {
        setMedia(media ?? {});
        setTotalSize(totalSize ?? 0);
        setLoading(false);
      });
  }, []);

  async function handleDelete(key: string) {
    setDeleting(key);
    await fetch("/api/user/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    setMedia(prev => {
      const updated = { ...prev };
      for (const folder in updated) {
        updated[folder] = updated[folder].filter(f => f.key !== key);
        if (updated[folder].length === 0) delete updated[folder];
      }
      return updated;
    });
    setTotalSize(prev => prev - (Object.values(media).flat().find(f => f.key === key)?.size ?? 0));
    setDeleting(null);
    setConfirmDelete(null);
  }

  const folders = Object.keys(media);
  const totalFiles = Object.values(media).flat().length;

  const displayedMedia = activeFolder === "all"
    ? media
    : { [activeFolder]: media[activeFolder] ?? [] };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <Link href="/members/account" style={{ fontFamily: B, fontSize: "12px", color: "#5A7A50", textDecoration: "none" }}>← Account</Link>
          </div>
          <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#F0EAD6", letterSpacing: "3px", marginBottom: "4px" }}>MY MEDIA</h1>
          <p style={{ fontFamily: B, fontSize: "13px", color: "#8AAA78" }}>Your uploaded images and files</p>
        </div>
        {!loading && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: R, fontSize: "20px", color: "#F0EAD6" }}>{totalFiles}</div>
            <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>files · {formatBytes(totalSize)}</div>
          </div>
        )}
      </div>

      {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-text" style={{ width: "80%" }} />
      <div className="skeleton skeleton-text" style={{ width: "60%" }} />
      <div className="skeleton skeleton-card" />
    </div>
      ) : totalFiles === 0 ? (
        <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "12px", padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
          <div style={{ fontFamily: R, fontSize: "14px", color: "#5A7A50", letterSpacing: "2px" }}>NO MEDIA YET</div>
          <div style={{ fontFamily: B, fontSize: "13px", color: "#5A7A50", marginTop: "8px" }}>Upload images in community posts or update your avatar to see them here.</div>
        </div>
      ) : (
        <>
          {/* Folder tabs */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => setActiveFolder("all")}
              style={{ fontFamily: R, fontSize: "11px", background: activeFolder === "all" ? "#1A3D14" : "transparent", border: `1.5px solid ${activeFolder === "all" ? "#3CCE2A" : "#2C4820"}`, color: activeFolder === "all" ? "#3CCE2A" : "#5A7A50", borderRadius: "20px", padding: "5px 14px", cursor: "pointer", letterSpacing: "1px" }}>
              ALL ({totalFiles})
            </button>
            {folders.map(folder => (
              <button key={folder} onClick={() => setActiveFolder(folder)}
                style={{ fontFamily: R, fontSize: "11px", background: activeFolder === folder ? "#1A3D14" : "transparent", border: `1.5px solid ${activeFolder === folder ? "#3CCE2A" : "#2C4820"}`, color: activeFolder === folder ? "#3CCE2A" : "#5A7A50", borderRadius: "20px", padding: "5px 14px", cursor: "pointer", letterSpacing: "1px" }}>
                {FOLDER_ICONS[folder]} {(FOLDER_LABELS[folder] ?? folder).toUpperCase()} ({media[folder].length})
              </button>
            ))}
          </div>

          {/* Media grid per folder */}
          {Object.entries(displayedMedia).map(([folder, files]) => (
            <div key={folder}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "16px" }}>{FOLDER_ICONS[folder]}</span>
                <span style={{ fontFamily: R, fontSize: "13px", color: "#F0EAD6", letterSpacing: "2px" }}>{(FOLDER_LABELS[folder] ?? folder).toUpperCase()}</span>
                <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>{files.length} file{files.length !== 1 ? "s" : ""} · {formatBytes(files.reduce((s, f) => s + f.size, 0))}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px" }}>
                {files.map(file => (
                  <div key={file.key} style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: "1.5px solid #2C4820", background: "#1A2614" }}>
                    <img
                      src={file.url}
                      alt=""
                      style={{ width: "100%", height: "120px", objectFit: "cover", display: "block" }}
                    />
                    <div style={{ padding: "6px 8px" }}>
                      <div style={{ fontFamily: B, fontSize: "10px", color: "#5A7A50" }}>{formatBytes(file.size)}</div>
                      <div style={{ fontFamily: B, fontSize: "10px", color: "#3A5A30" }}>{timeAgo(file.uploaded)}</div>
                    </div>
                    <button
                      onClick={() => setConfirmDelete({ key: file.key, url: file.url })}
                      style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "6px", padding: "4px 7px", cursor: "pointer", fontFamily: B, fontSize: "11px", color: "#F04060" }}
                    >🗑</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "16px", padding: "28px", maxWidth: "320px", width: "90%" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#3D0A14", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", fontSize: "20px" }}>🗑️</div>
            <div style={{ fontFamily: R, fontSize: "16px", color: "#F0EAD6", marginBottom: "8px" }}>Delete this file?</div>
            <div style={{ marginBottom: "16px", borderRadius: "8px", overflow: "hidden" }}>
              <img src={confirmDelete.url} alt="" style={{ width: "100%", height: "120px", objectFit: "cover" }} />
            </div>
            <div style={{ fontFamily: B, fontSize: "13px", color: "#5A7A50", marginBottom: "24px" }}>This will permanently remove the file from storage. Posts that used this image will show a broken image.</div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "none", border: "2px solid #2C4820", cursor: "pointer", fontFamily: R, fontSize: "13px", color: "#5A7A50" }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete.key)} disabled={deleting === confirmDelete.key}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "#F04060", border: "none", cursor: "pointer", fontFamily: R, fontSize: "13px", color: "#fff" }}>
                {deleting === confirmDelete.key ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
