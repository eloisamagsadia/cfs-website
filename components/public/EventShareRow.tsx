"use client";
import { useEffect, useState } from "react";

const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Props {
  title: string;
}

export default function EventShareRow({ title }: Props) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => { setUrl(window.location.href); }, []);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  function copyLink() {
    navigator.clipboard?.writeText(url);
    setCopied(true);
  }

  const btn = {
    flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px",
    fontFamily: SG, fontSize: "10px", fontWeight: 700, letterSpacing: "1.2px",
    color: "#0F2A1E", background: "#F2F7F2", border: "1px solid #DDE8DD",
    borderRadius: "10px", padding: "10px 8px", cursor: "pointer", textDecoration: "none",
    transition: "background 0.15s, border-color 0.15s, color 0.15s",
  } as const;

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <a href={twitterHref} target="_blank" rel="noopener noreferrer" style={btn}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        TWITTER
      </a>
      <a href={facebookHref} target="_blank" rel="noopener noreferrer" style={btn}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        FACEBOOK
      </a>
      <button type="button" onClick={copyLink}
        style={{ ...btn, background: copied ? "#1A8040" : "#F2F7F2", color: copied ? "#ffffff" : "#0F2A1E", borderColor: copied ? "#1A8040" : "#DDE8DD" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {copied ? (
            <polyline points="20 6 9 17 4 12" />
          ) : (
            <>
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </>
          )}
        </svg>
        {copied ? "COPIED" : "COPY LINK"}
      </button>
    </div>
  );
}
