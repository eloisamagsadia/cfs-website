"use client";
import { useRef, useState } from "react";
import { IconFile, IconPhoto, IconX, IconUpload } from "@/components/shared/Icons";
import MediaPicker from "./MediaPicker";

const B  = "var(--font-barlow,'Barlow',sans-serif)";
const R  = "var(--font-righteous,'Righteous',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

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
  const [pickerOpen, setPickerOpen] = useState(false);

  const isPdf = accept.includes("pdf");
  const pickerTypes: ("image" | "pdf" | "other")[] = isPdf ? ["pdf", "image"] : ["image"];

  function pickExisting(url: string) {
    setPreview(url);
    onUploaded(url);
    setError("");
  }

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
      <label style={{ fontFamily: B, fontSize: "12px", color: "#4A7C59", letterSpacing: "1px" }}>{label}</label>

      {preview ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {isPdf ? (
            <div style={{ background: "#E8F0E4", border: "2px solid #1A8040", borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <IconFile size={24} color="#1A8040" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: R, fontSize: "11px", color: "#1A8040", letterSpacing: "1px" }}>PDF UPLOADED</div>
                <a href={preview} target="_blank" rel="noopener noreferrer" style={{ fontFamily: B, fontSize: "11px", color: "#4A7C59", wordBreak: "break-all" }}>View PDF →</a>
              </div>
              <button type="button" onClick={handleRemove} style={{ background: "#FFE8EC", border: "1px solid #CC334440", borderRadius: "4px", color: "#CC3344", padding: "4px 8px", cursor: "pointer", fontFamily: B, fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}><IconX size={10} color="#CC3344" /> Remove</button>
            </div>
          ) : (
            <div style={{ position: "relative", width: "160px", height: "120px", borderRadius: "8px", overflow: "hidden", border: "2px solid #1A8040" }}>
              <img src={preview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button type="button" onClick={handleRemove} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "4px", color: "#CC3344", padding: "2px 4px", cursor: "pointer", display: "flex", alignItems: "center" }}><IconX size={10} color="#CC3344" /></button>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ flex: 1, height: "1px", background: "#E4EDE4" }} />
            <span style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A", letterSpacing: "1.2px", textTransform: "uppercase" }}>or replace</span>
            <div style={{ flex: 1, height: "1px", background: "#E4EDE4" }} />
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{ flex: "1 1 180px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "10px", padding: "10px 14px", cursor: uploading ? "wait" : "pointer", letterSpacing: "1.2px", outline: "none" }}
            >
              <IconUpload size={12} color="#1B3A2D" />
              {uploading ? "UPLOADING…" : "UPLOAD NEW"}
            </button>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              style={{ flex: "1 1 180px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", background: "#E8F0E4", border: "1.5px solid transparent", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", letterSpacing: "1.2px", outline: "none", transition: "background 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#DDE8DD"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#E8F0E4"; }}
            >
              <IconPhoto size={12} color="#1B3A2D" />
              PICK FROM LIBRARY
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            style={{ border: "2px dashed #DDE8DD", borderRadius: "8px", padding: "24px", textAlign: "center", cursor: uploading ? "not-allowed" : "pointer", background: "#F2F7F2", transition: "border-color 0.2s" }}
          >
            {uploading ? (
              <div style={{ fontFamily: R, fontSize: "12px", color: "#1A8040", letterSpacing: "2px" }}>UPLOADING...</div>
            ) : (
              <>
                <div style={{ marginBottom: "6px" }}>{isPdf ? <IconFile size={28} color="#5A7A60" /> : <IconPhoto size={28} color="#5A7A60" />}</div>
                <div style={{ fontFamily: R, fontSize: "11px", color: "#5A7A60", letterSpacing: "1px", marginBottom: "4px" }}>
                  CLICK OR DRAG TO UPLOAD
                </div>
                <div style={{ fontFamily: B, fontSize: "10px", color: "#3A5A30" }}>
                  {isPdf ? "PDF up to 20MB" : "JPG, PNG, WEBP up to 5MB"}
                </div>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ flex: 1, height: "1px", background: "#E4EDE4" }} />
            <span style={{ fontFamily: B, fontSize: "10px", color: "#7A8E7A", letterSpacing: "1.2px", textTransform: "uppercase" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "#E4EDE4" }} />
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#1B3A2D", background: "#E8F0E4", border: "1.5px solid transparent", borderRadius: "10px", padding: "10px 14px", cursor: "pointer", letterSpacing: "1.2px", outline: "none", transition: "background 0.15s, border-color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#DDE8DD"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#E8F0E4"; }}
          >
            <IconPhoto size={12} color="#1B3A2D" />
            PICK FROM LIBRARY
          </button>
        </div>
      )}

      {error && <div style={{ fontFamily: B, fontSize: "11px", color: "#CC3344" }}>{error}</div>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <MediaPicker
        folder={folder}
        types={pickerTypes}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={pickExisting}
      />
    </div>
  );
}
