"use client";
import { useState, useRef } from "react";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

interface CreatePostProps {
  categories: any[];
  currentUser: any;
  onPostCreated: (post: any) => void;
}

export default function CreatePost({ categories, currentUser, onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string; type: "image" | "video" }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File): Promise<string | null> {
    const folder = file.type.startsWith("video/") ? "community" : "community";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url ?? null;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newMedia = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" as const : "image" as const,
    }));
    setMediaFiles(prev => [...prev, ...newMedia].slice(0, 4)); // max 4
    setExpanded(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeMedia(i: number) {
    setMediaFiles(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (!content.trim() && mediaFiles.length === 0) return;
    setSubmitting(true);
    setUploading(mediaFiles.length > 0);
    try {
      // Upload media files
      const uploadedUrls: string[] = [];
      for (const m of mediaFiles) {
        const url = await uploadFile(m.file);
        if (url) uploadedUrls.push(url);
      }
      setUploading(false);

      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, category_id: categoryId || null, images: uploadedUrls }),
      });
      const { post } = await res.json();
      if (post) {
        onPostCreated(post);
        setContent(""); setCategoryId(""); setMediaFiles([]); setExpanded(false);
      }
    } finally {
      setSubmitting(false); setUploading(false);
    }
  }

  return (
    <div style={{ background: "#1A2614", border: "2px solid #2C4820", borderRadius: "16px", padding: "16px 18px", marginBottom: "12px" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        {/* Avatar */}
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#3CCE2A,#F07228)", padding: "2px", flexShrink: 0 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#1A2614", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {currentUser?.avatar_url
              ? <img src={currentUser.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontFamily: R, fontSize: "16px", color: "#3CCE2A" }}>{(currentUser?.display_name ?? "M")[0].toUpperCase()}</span>
            }
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); if (e.target.value) setExpanded(true); }}
            onFocus={() => setExpanded(true)}
            placeholder="What's on your mind? Use @username to mention someone ♪"
            rows={expanded ? 3 : 1}
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: expanded ? "1px solid #2C4820" : "none", padding: "6px 0", color: "#F0EAD6", fontFamily: B, fontSize: "14px", outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.6, transition: "all 0.2s" }}
          />

          {/* Media previews */}
          {mediaFiles.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(mediaFiles.length, 2)}, 1fr)`, gap: "6px", marginTop: "10px" }}>
              {mediaFiles.map((m, i) => (
                <div key={i} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", height: "120px" }}>
                  {m.type === "video"
                    ? <video src={m.preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                    : <img src={m.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  }
                  <button onClick={() => removeMedia(i)} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "22px", height: "22px", color: "#fff", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                  {m.type === "video" && <div style={{ position: "absolute", bottom: "4px", left: "6px", background: "rgba(0,0,0,0.6)", borderRadius: "4px", padding: "1px 6px", fontFamily: B, fontSize: "10px", color: "#fff" }}>VIDEO</div>}
                </div>
              ))}
            </div>
          )}

          {expanded && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
              {/* Left: media + category */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {/* Photo/video button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mediaFiles.length >= 4}
                  title="Add photo or video"
                  style={{ background: "none", border: "1.5px solid #2C4820", borderRadius: "8px", padding: "6px 10px", cursor: mediaFiles.length >= 4 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "5px", opacity: mediaFiles.length >= 4 ? 0.4 : 1 }}
                >
                  <span style={{ fontSize: "16px" }}>📷</span>
                  <span style={{ fontFamily: B, fontSize: "11px", color: "#5A7A50" }}>
                    {mediaFiles.length > 0 ? `${mediaFiles.length}/4` : "Photo/Video"}
                  </span>
                </button>

                <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                  style={{ background: "#243520", border: "1.5px solid #2C4820", borderRadius: "6px", padding: "6px 10px", color: categoryId ? "#F0EAD6" : "#5A7A50", fontFamily: B, fontSize: "12px", outline: "none" }}>
                  <option value="">Category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>

              {/* Right: cancel + post */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { setExpanded(false); setContent(""); setMediaFiles([]); }}
                  style={{ fontFamily: R, fontSize: "11px", background: "transparent", border: "1.5px solid #2C4820", borderRadius: "6px", color: "#5A7A50", padding: "7px 12px", cursor: "pointer", letterSpacing: "1px" }}>
                  CANCEL
                </button>
                <button onClick={handleSubmit} disabled={(!content.trim() && mediaFiles.length === 0) || submitting}
                  style={{ position: "relative", display: "inline-block", background: "transparent", border: "none", padding: 0, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>
                  <span style={{ position: "absolute", top: "2px", left: "2px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
                  <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "11px", background: (!content.trim() && mediaFiles.length === 0) || submitting ? "#1A3D14" : "#3CCE2A", color: (!content.trim() && mediaFiles.length === 0) || submitting ? "#5A7A50" : "#080F06", padding: "7px 16px", border: "2px solid #080F06", borderRadius: "6px", letterSpacing: "1.5px" }}>
                    {uploading ? "UPLOADING..." : submitting ? "POSTING..." : "POST ✦"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,video/mp4,video/webm" multiple style={{ display: "none" }} onChange={handleFileChange} />
    </div>
  );
}
