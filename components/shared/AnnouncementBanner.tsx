"use client";
import { useEffect, useState } from "react";
import { IconX } from "@/components/shared/Icons";

const B = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Props {
  text: string;
  color?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}

/** Tiny 32-bit hash so dismiss state is keyed to the message content. */
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return String(h >>> 0);
}

export default function AnnouncementBanner({ text, color, ctaLabel, ctaUrl }: Props) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const key = `cfs.announcement.dismissed.${hash(text + (ctaUrl ?? "") + (color ?? ""))}`;

  useEffect(() => {
    try { setDismissed(localStorage.getItem(key) === "1"); }
    catch { setDismissed(false); }
  }, [key]);

  if (dismissed || !text?.trim()) return null;

  const c = color || "#1A8040";
  const hasCta = !!(ctaLabel?.trim() && ctaUrl?.trim());

  const dismiss = () => {
    try { localStorage.setItem(key, "1"); } catch {}
    setDismissed(true);
  };

  return (
    <div style={{ background: c + "18", borderBottom: `2px solid ${c}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
      <span style={{ fontFamily: B, fontSize: "13px", color: "#1B3A2D", lineHeight: 1.5 }}>{text}</span>
      {hasCta && (
        <a href={ctaUrl!} target={ctaUrl!.startsWith("http") ? "_blank" : undefined} rel={ctaUrl!.startsWith("http") ? "noopener noreferrer" : undefined}
          style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontFamily: SG, fontSize: "11px", fontWeight: 700, color: "#ffffff", background: c, borderRadius: "8px", padding: "5px 11px", letterSpacing: "1px", textDecoration: "none" }}>
          {ctaLabel} →
        </a>
      )}
      <button onClick={dismiss} aria-label="Dismiss announcement"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", marginLeft: "4px" }}>
        <IconX size={12} color={c} />
      </button>
    </div>
  );
}
