"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function LettersPage() {
  const router = useRouter();
  const [letters, setLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/letters")
      .then(r => r.json())
      .then(({ letters, error }) => {
        if (error) setError(error);
        else setLetters(letters ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: R, fontSize: "1.6rem", color: "#1B3A2D", letterSpacing: "3px", marginBottom: "4px" }}>LETTERS FROM COLET</h1>
        <p style={{ fontFamily: S, fontStyle: "italic", fontSize: "14px", color: "#4A7C59" }}>Thoughts, reflections, and words from the heart 💌</p>
      </div>

      {loading ? (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
      ) : error ? (
        <div style={{ background: "#FFFFFF", border: "2px solid #F04060", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
          <div style={{ fontFamily: B, fontSize: "13px", color: "#F04060" }}>Failed to load letters. Please try again later.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {letters.map((letter, i) => (
            <div
              key={i}
              onClick={() => router.push(`/members/letters/${letter.slug}`)}
              style={{ textDecoration: "none", cursor: "pointer" }}
            >
              <div
                className="letter-card" style={{ display: "flex", gap: "20px", alignItems: "flex-start", padding: "24px", background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "16px", marginBottom: "10px", transition: "border-color 0.15s", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#3CCE2A")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#DDE8DD")}
              >
                {/* Text content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Tags */}
                  {letter.tags.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {letter.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} style={{ fontFamily: B, fontSize: "10px", color: "#F07228", background: "#3D1A0A", borderRadius: "20px", padding: "2px 10px", letterSpacing: "0.5px" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <div style={{ fontFamily: S, fontSize: "1.2rem", color: "#1B3A2D", lineHeight: 1.4, marginBottom: "10px" }}>
                    {letter.title}
                  </div>

                  {/* Excerpt */}
                  <div style={{ fontFamily: B, fontSize: "13px", color: "#4A7C59", lineHeight: 1.7, marginBottom: "14px" }}>
                    {letter.excerpt}
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", overflow: "hidden", border: "1.5px solid #DDE8DD" }}>
                        <img src="https://cdn-images-1.medium.com/fit/c/150/150/1*OKtnsFxtdnvoBrTZ_8o1Nw@2x.jpeg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <span style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60" }}>letters from colet</span>
                    </div>
                    <span style={{ fontFamily: B, fontSize: "12px", color: "#3A5A30" }}>{timeAgo(letter.pubDate)}</span>
                    <span style={{ fontFamily: R, fontSize: "11px", color: "#3CCE2A", marginLeft: "auto", letterSpacing: "1px" }}>READ ON MEDIUM →</span>
                  </div>
                </div>

                {/* Thumbnail */}
                {letter.thumbnail && (
                  <div className="letter-thumbnail" style={{ width: "140px", height: "100px", borderRadius: "10px", overflow: "hidden", flexShrink: 0 }}>
                    <img src={letter.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Medium link */}
      {!loading && letters.length > 0 && (
        <div style={{ textAlign: "center", paddingBottom: "16px" }}>
          <a href="https://medium.com/@lettersfromcolet" target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: R, fontSize: "12px", color: "#5A7A60", textDecoration: "none", letterSpacing: "1px" }}>
            VIEW ALL ON MEDIUM →
          </a>
        </div>
      )}
    </div>
  );
}
