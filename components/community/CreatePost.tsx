"use client";
import { useState, useRef } from "react";
import { IconX, IconMusic, IconPhoto, IconCamera, IconVideo, IconWarning } from "@/components/shared/Icons";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";

const IMAGE_ALLOWED_CATEGORIES = ["Fan Cam", "Events", "Projects", "Fan Art"];

interface CreatePostProps {
  categories: any[];
  currentUser: any;
  onPostCreated: (post: any, newCount?: number) => void;
  imagePostCount?: number;
}

interface VideoEmbed {
  url: string;
  embedUrl: string;
  platform: "youtube" | "tiktok" | "instagram" | "drive" | "unknown";
}

function detectVideo(url: string): VideoEmbed | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");

    // YouTube
    if (host === "youtube.com" || host === "youtu.be") {
      let id = "";
      if (host === "youtu.be") id = u.pathname.slice(1);
      else id = u.searchParams.get("v") ?? u.pathname.split("/").pop() ?? "";
      if (!id) return null;
      return { url, embedUrl: `https://www.youtube.com/embed/${id}`, platform: "youtube" };
    }

    // TikTok
    if (host === "tiktok.com") {
      const match = u.pathname.match(/\/video\/(\d+)/);
      const id = match?.[1];
      if (!id) return null;
      return { url, embedUrl: `https://www.tiktok.com/embed/v2/${id}`, platform: "tiktok" };
    }

    // Instagram
    if (host === "instagram.com") {
      const match = u.pathname.match(/\/(p|reel)\/([^/]+)/);
      const id = match?.[2];
      if (!id) return null;
      return { url, embedUrl: `https://www.instagram.com/p/${id}/embed`, platform: "instagram" };
    }

    // Google Drive
    if (host === "drive.google.com") {
      const match = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = match?.[1];
      if (!id) return null;
      return { url, embedUrl: `https://drive.google.com/file/d/${id}/preview`, platform: "drive" };
    }

    return null;
  } catch {
    return null;
  }
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF0000",
  tiktok: "#5A7A60",
  instagram: "#E1306C",
  drive: "#4285F4",
  unknown: "#5A7A60",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  drive: "Google Drive",
  unknown: "Video",
};

export default function CreatePost({ categories, currentUser, onPostCreated, imagePostCount = 0 }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeMedia, setActiveMedia] = useState<"none" | "photo" | "video">("none");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoEmbed, setVideoEmbed] = useState<VideoEmbed | null>(null);
  const [videoError, setVideoError] = useState("");
  const [tiktokFailed, setTiktokFailed] = useState(false);
  const [postError, setPostError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const IMAGE_POST_LIMIT = 10;
  const imagePostsRemaining = IMAGE_POST_LIMIT - imagePostCount;

  const selectedCategory = categories.find(c => c.id === categoryId);
  const allowsMedia = selectedCategory
    ? IMAGE_ALLOWED_CATEGORIES.includes(selectedCategory.name)
    : false;

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "community");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url ?? null;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newMedia = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setMediaFiles(prev => [...prev, ...newMedia].slice(0, 4));
    setExpanded(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeMedia(i: number) {
    setMediaFiles(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleVideoInput(val: string) {
    setVideoUrl(val);
    setVideoError("");
    setTiktokFailed(false);
    if (!val.trim()) { setVideoEmbed(null); return; }
    const embed = detectVideo(val.trim());
    if (embed) {
      setVideoEmbed(embed);
    } else {
      setVideoEmbed(null);
      if (val.length > 10) setVideoError("Unsupported link. Paste a YouTube, TikTok, Instagram, or Google Drive link.");
    }
  }

  function switchMedia(mode: "photo" | "video") {
    if (activeMedia === mode) return;
    setActiveMedia(mode);
    setMediaFiles([]);
    setVideoUrl("");
    setVideoEmbed(null);
    setVideoError("");
    setTiktokFailed(false);
    if (mode === "photo") setTimeout(() => fileInputRef.current?.click(), 50);
  }

  function clearMedia() {
    setActiveMedia("none");
    setMediaFiles([]);
    setVideoUrl("");
    setVideoEmbed(null);
    setVideoError("");
    setTiktokFailed(false);
  }

  async function handleSubmit() {
    if (!content.trim() && mediaFiles.length === 0 && !videoEmbed) return;
    setPostError("");
    setSubmitting(true);
    setUploading(mediaFiles.length > 0);
    try {
      const uploadedUrls: string[] = [];
      for (const m of mediaFiles) {
        const url = await uploadFile(m.file);
        if (url) uploadedUrls.push(url);
      }
      setUploading(false);

      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          category_id: categoryId || null,
          images: uploadedUrls,
          video_url: videoEmbed?.url ?? null,
          video_embed_url: videoEmbed?.embedUrl ?? null,
          video_platform: videoEmbed?.platform ?? null,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setPostError(data.error);
        return;
      }

      if (data.post) {
        onPostCreated(data.post, data.image_post_count);
        setContent(""); setCategoryId(""); setMediaFiles([]);
        setExpanded(false); clearMedia(); setPostError("");
      }
    } finally {
      setSubmitting(false); setUploading(false);
    }
  }

  const canPost = (content.trim() || mediaFiles.length > 0 || videoEmbed) && !submitting;

  return (
    <div style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "16px", padding: "20px", marginBottom: "12px" }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        {/* Avatar */}
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#1A8040,#1A8040)", padding: "2px", flexShrink: 0 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {currentUser?.avatar_url
              ? <img src={currentUser.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontFamily: R, fontSize: "16px", color: "#1A8040" }}>{(currentUser?.display_name ?? "M")[0].toUpperCase()}</span>
            }
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); if (e.target.value) setExpanded(true); }}
            onFocus={() => setExpanded(true)}
            placeholder="What's on your mind? Use @username to mention someone ♪"
            rows={expanded ? 4 : 2}
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: expanded ? "1px solid #DDE8DD" : "none", padding: "6px 0", color: "#1B3A2D", fontFamily: B, fontSize: "14px", outline: "none", resize: "none", WebkitAppearance: "none", boxSizing: "border-box", lineHeight: 1.6, transition: "all 0.2s" }}
          />

          {/* Photo previews */}
          {mediaFiles.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(mediaFiles.length, 2)}, 1fr)`, gap: "6px", marginTop: "10px" }}>
              {mediaFiles.map((m, i) => (
                <div key={i} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", height: "120px" }}>
                  <img src={m.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => removeMedia(i)} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><IconX size={10} color="#CC3344" /></button>
                </div>
              ))}
            </div>
          )}

          {/* Video input */}
          {activeMedia === "video" && (
            <div style={{ marginTop: "10px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={e => handleVideoInput(e.target.value)}
                  placeholder="Paste YouTube, TikTok, Instagram, or Google Drive link..."
                  style={{ flex: 1, background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "8px", padding: "8px 12px", color: "#1B3A2D", fontFamily: B, fontSize: "13px", outline: "none" }}
                />
                {videoUrl && (
                  <button onClick={() => { setVideoUrl(""); setVideoEmbed(null); setVideoError(""); setTiktokFailed(false); }}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}><IconX size={16} color="#5A7A60" /></button>
                )}
              </div>
              {videoError && (
                <p style={{ fontFamily: B, fontSize: "11px", color: "#CC3344", margin: "4px 0 0" }}>{videoError}</p>
              )}

              {/* Video embed preview */}
              {videoEmbed && (
                <div style={{ marginTop: "10px", borderRadius: "10px", overflow: "hidden", border: "1.5px solid #DDE8DD", position: "relative" }}>
                  {/* Platform badge */}
                  <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 2, background: PLATFORM_COLORS[videoEmbed.platform], borderRadius: "6px", padding: "2px 8px", fontFamily: B, fontSize: "10px", color: "#fff", fontWeight: 700 }}>
                    {PLATFORM_LABELS[videoEmbed.platform]}
                  </div>
                  {videoEmbed.platform === "tiktok" && tiktokFailed ? (
                    /* TikTok fallback — link card */
                    <a href={videoEmbed.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px", background: "#F2F7F2", textDecoration: "none" }}>
                      <IconMusic size={28} color="#4A7C59" />
                      <div>
                        <p style={{ fontFamily: B, fontSize: "12px", color: "#1B3A2D", margin: 0 }}>TikTok Video</p>
                        <p style={{ fontFamily: B, fontSize: "10px", color: "#5A7A60", margin: "2px 0 0" }}>Click to open on TikTok</p>
                      </div>
                    </a>
                  ) : (
                    <iframe
                      src={videoEmbed.embedUrl}
                      style={{ width: "100%", height: "280px", border: "none", display: "block" }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onError={() => { if (videoEmbed.platform === "tiktok") setTiktokFailed(true); }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Image post counter */}
          {allowsMedia && imagePostCount > 0 && (
            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontFamily: B, fontSize: "11px", color: imagePostsRemaining <= 5 ? "#1A8040" : "#5A7A60" }}>
                <IconPhoto size={11} color={imagePostsRemaining <= 5 ? "#1A8040" : "#5A7A60"} /> {imagePostCount}/{IMAGE_POST_LIMIT} image posts used this month
                {imagePostsRemaining <= 5 && imagePostsRemaining > 0 && ` — ${imagePostsRemaining} left`}
                {imagePostsRemaining === 0 && " — limit reached!"}
              </span>
            </div>
          )}

          {/* Post error */}
          {postError && (
            <div style={{ marginTop: "8px", background: "#FFE8EC", border: "1.5px solid #CC334440", borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <IconWarning size={12} color="#CC3344" /><span style={{ fontFamily: B, fontSize: "12px", color: "#CC3344" }}>{postError}</span>
            </div>
          )}

          {expanded && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
              {/* Left: photo + video + category */}
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>

                {allowsMedia && (
                  <>
                    {/* Photo button */}
                    <button
                      onClick={() => switchMedia("photo")}
                      disabled={mediaFiles.length >= 4}
                      title="Add photos"
                      style={{ background: activeMedia === "photo" ? "#DDE8DD" : "none", border: `1.5px solid ${activeMedia === "photo" ? "#1A8040" : "#DDE8DD"}`, borderRadius: "8px", padding: "6px 10px", cursor: mediaFiles.length >= 4 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "5px", opacity: mediaFiles.length >= 4 && activeMedia !== "photo" ? 0.4 : 1, transition: "all 0.15s" }}
                    >
                      <IconCamera size={15} color={activeMedia === "photo" ? "#1A8040" : "#5A7A60"} />
                      <span style={{ fontFamily: B, fontSize: "11px", color: activeMedia === "photo" ? "#1A8040" : "#5A7A60" }}>
                        {mediaFiles.length > 0 ? `${mediaFiles.length}/4` : "Photo"}
                      </span>
                    </button>

                    {/* Video button */}
                    <button
                      onClick={() => switchMedia("video")}
                      title="Add video link"
                      style={{ background: activeMedia === "video" ? "#DDE8DD" : "none", border: `1.5px solid ${activeMedia === "video" ? "#1A8040" : "#DDE8DD"}`, borderRadius: "8px", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", transition: "all 0.15s" }}
                    >
                      <IconVideo size={15} color={activeMedia === "video" ? "#1A8040" : "#5A7A60"} />
                      <span style={{ fontFamily: B, fontSize: "11px", color: activeMedia === "video" ? "#1A8040" : "#5A7A60" }}>
                        {videoEmbed ? PLATFORM_LABELS[videoEmbed.platform] : "Video"}
                      </span>
                    </button>
                  </>
                )}

                <select
                  value={categoryId}
                  onChange={e => {
                    setCategoryId(e.target.value);
                    const cat = categories.find(c => c.id === e.target.value);
                    if (cat && !IMAGE_ALLOWED_CATEGORIES.includes(cat.name)) {
                      clearMedia();
                    }
                  }}
                  style={{ background: "#F2F7F2", border: "1.5px solid #DDE8DD", borderRadius: "6px", padding: "6px 10px", color: categoryId ? "#1B3A2D" : "#5A7A60", fontFamily: B, fontSize: "12px", outline: "none" }}
                >
                  <option value="">Category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>

              {/* Right: cancel + post */}
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginLeft: "auto" }}>
                <button onClick={() => { setExpanded(false); setContent(""); clearMedia(); }}
                  style={{ fontFamily: R, fontSize: "11px", background: "transparent", border: "1.5px solid #DDE8DD", borderRadius: "6px", color: "#5A7A60", padding: "7px 12px", cursor: "pointer", letterSpacing: "1px" }}>
                  CANCEL
                </button>
                <button onClick={handleSubmit} disabled={!canPost}
                  style={{ position: "relative", display: "inline-block", background: "transparent", border: "none", padding: 0, cursor: canPost ? "pointer" : "not-allowed", opacity: submitting ? 0.7 : 1 }}>
                  <span style={{ position: "absolute", top: "2px", left: "2px", width: "100%", height: "100%", background: "#080F06", borderRadius: "6px" }} />
                  <span style={{ position: "relative", display: "block", fontFamily: R, fontSize: "11px", background: canPost ? "#1A8040" : "#E8F0E4", color: canPost ? "#080F06" : "#5A7A60", padding: "7px 16px", border: "2px solid #1B3A2D", borderRadius: "6px", letterSpacing: "1.5px" }}>
                    {uploading ? "UPLOADING..." : submitting ? "POSTING..." : "POST ✦"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      {allowsMedia && (
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileChange} />
      )}
    </div>
  );
}
