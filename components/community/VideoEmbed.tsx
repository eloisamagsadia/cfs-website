"use client";
import { useEffect, useRef, useState } from "react";
import { IconVideo, IconPhoto } from "@/components/shared/Icons";

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#FF0000",
  tiktok: "#5A7A60",
  instagram: "#E1306C",
  drive: "#4285F4",
  gdrive: "#4285F4",
  unknown: "#5A7A60",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  drive: "Google Drive",
  gdrive: "Google Drive",
  unknown: "Video",
};

const B = "var(--font-barlow,'Barlow',sans-serif)";
const R = "var(--font-righteous,'Righteous',sans-serif)";

function loadScriptOnce(src: string, id: string) {
  if (typeof window === "undefined") return;
  if (document.getElementById(id)) {
    // If it's already there, ask the platform SDK to re-parse
    if (id === "tiktok-embed" && (window as any).tiktok?.load) (window as any).tiktok.load();
    if (id === "instagram-embed" && (window as any).instgrm?.Embeds?.process) (window as any).instgrm.Embeds.process();
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  script.id = id;
  document.body.appendChild(script);
}

interface Props {
  videoUrl?: string | null;
  videoEmbedUrl?: string | null;
  videoPlatform?: string | null;
  height?: number;
}

export default function VideoEmbed({ videoUrl, videoEmbedUrl, videoPlatform, height = 520 }: Props) {
  const url = videoUrl ?? videoEmbedUrl ?? "";
  const platform = (videoPlatform ?? "").toLowerCase();
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (platform === "tiktok") loadScriptOnce("https://www.tiktok.com/embed.js", "tiktok-embed");
    if (platform === "instagram") loadScriptOnce("//www.instagram.com/embed.js", "instagram-embed");
  }, [platform, url]);

  if (!url) return null;

  const color = PLATFORM_COLORS[platform] ?? "#5A7A60";
  const label = PLATFORM_LABELS[platform] ?? "Video";

  function FallbackCard() {
    const target = videoUrl ?? videoEmbedUrl ?? "#";
    return (
      <a href={target} target="_blank" rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px", background: "#FFFFFF", textDecoration: "none" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#F2F7F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {platform === "instagram" ? <IconPhoto size={24} color="#4A7C59" /> : <IconVideo size={24} color="#4A7C59" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: R, fontSize: "12px", color, margin: 0, letterSpacing: "1px" }}>{label.toUpperCase()} VIDEO</p>
          <p style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60", margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{target}</p>
          <p style={{ fontFamily: B, fontSize: "11px", color: "#1A8040", margin: "4px 0 0" }}>Tap to open ↗</p>
        </div>
      </a>
    );
  }

  const wrap = (child: React.ReactNode) => (
    <div style={{ borderRadius: "10px", overflow: "hidden", border: "1.5px solid #DDE8DD", position: "relative", background: "#F7FAF5" }}>
      <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 3, background: color, borderRadius: "6px", padding: "2px 8px", fontFamily: B, fontSize: "10px", color: "#fff", fontWeight: 700 }}>
        {label}
      </div>
      {child}
    </div>
  );

  if (failed) return wrap(<FallbackCard />);

  if (platform === "tiktok") {
    // TikTok's official embed uses a blockquote + embed.js.
    // We can derive the video id from the source URL.
    const videoId = (url.match(/\/video\/(\d+)/) ?? [])[1];
    if (!videoId) return wrap(<FallbackCard />);
    return wrap(
      <div ref={containerRef} style={{ display: "flex", justifyContent: "center", minHeight: `${height}px` }}>
        <blockquote
          className="tiktok-embed"
          cite={videoUrl ?? undefined}
          data-video-id={videoId}
          style={{ maxWidth: "605px", minWidth: "325px", margin: 0 }}
        >
          <a href={videoUrl ?? "#"} target="_blank" rel="noopener noreferrer">Open on TikTok</a>
        </blockquote>
      </div>
    );
  }

  if (platform === "instagram") {
    // Instagram's official embed uses a blockquote + embed.js.
    // Use the source URL as the permalink so reels and posts both work.
    return wrap(
      <div ref={containerRef} style={{ display: "flex", justifyContent: "center", minHeight: `${height}px` }}>
        <blockquote
          className="instagram-media"
          data-instgrm-captioned=""
          data-instgrm-permalink={videoUrl ?? undefined}
          data-instgrm-version="14"
          style={{ maxWidth: "540px", minWidth: "326px", margin: 0, background: "#fff" }}
        >
          <a href={videoUrl ?? "#"} target="_blank" rel="noopener noreferrer">Open on Instagram</a>
        </blockquote>
      </div>
    );
  }

  return wrap(
    <iframe
      src={videoEmbedUrl ?? undefined}
      style={{ width: "100%", height: `${height}px`, border: "none", display: "block" }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      onError={() => setFailed(true)}
    />
  );
}
