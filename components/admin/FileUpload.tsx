"use client";
import { useRef, useState } from "react";

const B = "var(--font-barlow,'Barlow',sans-serif)";
const R = "var(--font-righteous,'Righteous',sans-serif)";

interface Props {
  folder: "products" | "events" | "reports" | "projects" | "avatars" | "badges";
  accept?: string; // e.g. "image/*" or "application/pdf,image/*"
  label?: string;
  currentUrl?: string;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
}

export default function FileUpload({ folder, accept = "image/*", label = "IMAGE", currentUrl, onUploaded, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string>(currentUrl ?? "");

  const isPdf = accept.includes("pdf");

  async function handleFile(file: File) {
    setError(""); setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPreview(data.url);
      onUploaded(data.url);
    } catch (e: any) { setError(e.message); }
    finally { setUploading(false); }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview("");
    onRemove?.();
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label style={{ fontFamily: B, fontSize: "12px", color: "#8AAA78", letterSpacing: "1px" }}>{label}</label>

      {preview ? (
        <div style={{ position: "relative", display: "inline-block" }}>
          {isPdf ? (
            <div style={{ background: "#1A3D14", border: "2px solid #3CCE2A", borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>📄</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: R, fontSize: "11px", color: "#3CCE2A", letterSpacing: "1px" }}>PDF UPLOADED</div>
                <a href={preview} target="_blank" rel="noopener noreferrer" style={{ fontFamily: B, fontSize: "11px", color: "#8AAA78", wordBreak: "break-all" }}>View PDF →</a>
              </div>
              <button onClick={handleRemove} style={{ background: "#2C1010", border: "1px solid #F04060", borderRadius: "4px", color: "#F04060", padding: "4px 8px", cursor: "pointer", fontFamily: B, fontSize: "11px" }}>✕ Remove</button>
            </div>
          ) : (
            <div style={{ position: "relative", width: "160px", height: "120px", borderRadius: "8px", overflow: "hidden", border: "2px solid #3CCE2A" }}>
              <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={handleRemove} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "4px", color: "#F04060", padding: "2px 6px", cursor: "pointer", fontSize: "12px" }}>✕</button>
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          style={{ border: "2px dashed #2C4820", borderRadius: "8px", padding: "24px", textAlign: "center", cursor: uploading ? "not-allowed" : "pointer", background: "#0F1A0C", transition: "border-color 0.2s" }}
        >
          {uploading ? (
            <div style={{ fontFamily: R, fontSize: "12px", color: "#3CCE2A", letterSpacing: "2px" }}>UPLOADING...</div>
          ) : (
            <>
              <div style={{ fontSize: "28px", marginBottom: "6px" }}>{isPdf ? "📄" : "🖼"}</div>
              <div style={{ fontFamily: R, fontSize: "11px", color: "#5A7A50", letterSpacing: "1px", marginBottom: "4px" }}>
                CLICK OR DRAG TO UPLOAD
              </div>
              <div style={{ fontFamily: B, fontSize: "10px", color: "#3A5A30" }}>
                {isPdf ? "PDF up to 20MB" : "JPG, PNG, WEBP up to 5MB"}
              </div>
            </>
          )}
        </div>
      )}

      {error && <div style={{ fontFamily: B, fontSize: "11px", color: "#F04060" }}>{error}</div>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
