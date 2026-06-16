"use client";
import SkeletonPage from "@/components/shared/SkeletonPage";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "long", day: "numeric", year: "numeric"
  });
}

export default function LetterDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [letter, setLetter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/letters")
      .then(r => r.json())
      .then(({ letters }) => {
        const found = (letters ?? []).find((l: any) => l.slug === slug);
        if (!found) router.push("/members/letters");
        else setLetter(found);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return (
<div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px" }}>
      <SkeletonPage />
    </div>
  );

  if (!letter) return null;

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Back */}
      <Link href="/members/letters" style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
        ← Back to Letters
      </Link>

      {/* Tags */}
      {letter.tags.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {letter.tags.map((tag: string) => (
            <span key={tag} style={{ fontFamily: B, fontSize: "10px", color: "#F07228", background: "#3D1A0A", borderRadius: "20px", padding: "2px 10px" }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 style={{ fontFamily: S, fontSize: "2rem", color: "#1B3A2D", lineHeight: 1.3, margin: 0 }}>
        {letter.title}
      </h1>

      {/* Author + date */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "20px", borderBottom: "1px solid #DDE8DD" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", border: "2px solid #DDE8DD" }}>
          <img src="https://cdn-images-1.medium.com/fit/c/150/150/1*OKtnsFxtdnvoBrTZ_8o1Nw@2x.jpeg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ fontFamily: R, fontSize: "12px", color: "#1B3A2D", letterSpacing: "1px" }}>letters from colet</div>
          <div style={{ fontFamily: B, fontSize: "11px", color: "#5A7A60" }}>{formatDate(letter.pubDate)}</div>
        </div>
        <a href={letter.link} target="_blank" rel="noopener noreferrer"
          style={{ marginLeft: "auto", fontFamily: R, fontSize: "11px", color: "#3CCE2A", textDecoration: "none", border: "1.5px solid #DDE8DD", borderRadius: "20px", padding: "5px 14px", letterSpacing: "1px" }}>
          READ ON MEDIUM →
        </a>
      </div>

      {/* Content */}
      <div
        dangerouslySetInnerHTML={{ __html: letter.content }}
        className="letter-content"
        style={{ fontFamily: B, fontSize: "15px", color: "#5A7A60", lineHeight: 1.9 }}
      />

      {/* Content styles */}
      <style>{`
        .letter-content p { margin: 0 0 20px; }
        .letter-content strong, .letter-content b { color: #1B3A2D; font-weight: 700; }
        .letter-content em, .letter-content i { font-style: italic; color: #5A7A60; }
        .letter-content figure { margin: 24px 0; border-radius: 10px; overflow: hidden; }
        .letter-content figure img { width: 100%; height: auto; display: block; border-radius: 10px; }
        .letter-content blockquote { border-left: 3px solid #2CB520; margin: 24px 0; padding: 12px 20px; background: #E8F0E4; border-radius: 0 8px 8px 0; color: #4A7C59; font-style: italic; }
        .letter-content a { color: #2CB520; text-decoration: none; }
        .letter-content a:hover { text-decoration: underline; }
        .letter-content h1, .letter-content h2, .letter-content h3 { font-family: ${S}; color: #1B3A2D; margin: 28px 0 12px; }
      `}</style>

      {/* Bottom CTA */}
      <div style={{ borderTop: "1px solid #DDE8DD", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/members/letters" style={{ fontFamily: B, fontSize: "12px", color: "#5A7A60", textDecoration: "none" }}>
          ← Back to Letters
        </Link>
        <a href={letter.link} target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: R, fontSize: "11px", color: "#3CCE2A", textDecoration: "none", letterSpacing: "1px" }}>
          CLAP ON MEDIUM →
        </a>
      </div>

    </div>
  );
}
