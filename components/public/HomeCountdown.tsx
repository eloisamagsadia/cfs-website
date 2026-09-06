"use client";
import { useEffect, useState } from "react";

const S  = "var(--font-dm-serif,'DM Serif Display',serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Props {
  target: string;
  label?: string;
  variant?: "pill" | "stat";
}

function pad(n: number) { return n.toString().padStart(2, "0"); }

export default function HomeCountdown({ target, label = "Next event in", variant = "pill" }: Props) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const targetMs = new Date(target).getTime();
  const delta = now === null ? 0 : Math.max(0, targetMs - now);

  const days = Math.floor(delta / 86_400_000);
  const hours = Math.floor((delta % 86_400_000) / 3_600_000);
  const mins = Math.floor((delta % 3_600_000) / 60_000);
  const secs = Math.floor((delta % 60_000) / 1000);

  const live = now !== null && delta > 0;

  if (variant === "stat") {
    return (
      <>
        <div className="hero-stat-num" suppressHydrationWarning style={{ fontFamily: S, color: "#1B3A2D", lineHeight: 1, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}>
          {live ? days : "—"}
          <span style={{ fontSize: "0.44em", color: "#4A7C59", marginLeft: "2px" }}>d</span>
        </div>
        <div className="hero-stat-label" suppressHydrationWarning style={{ fontFamily: SG, fontWeight: 700, color: "#4A7C59", letterSpacing: "1.8px", textTransform: "uppercase", fontVariantNumeric: "tabular-nums" }}>
          {live ? `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s till next` : "no event yet"}
        </div>
      </>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#FFF3D6", border: "1px solid #F0C48A", padding: "5px 12px", borderRadius: "999px", color: "#8B5E1F", fontFamily: B, fontSize: "12px" }}>
      <span aria-hidden="true" className="hero-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#1A8040", display: "inline-block" }} />
      <span>{label}</span>
      <strong suppressHydrationWarning style={{ fontFamily: SG, letterSpacing: "0.5px", color: "#5A4020", fontVariantNumeric: "tabular-nums" }}>
        {live ? `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s` : "loading…"}
      </strong>
    </span>
  );
}
