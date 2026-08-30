"use client";
import type { ReactNode } from "react";

const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";
const B  = "var(--font-barlow,'Barlow',sans-serif)";

export interface StatItem {
  label: string;
  value: string | number | ReactNode;
  color?: string;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}

interface Props {
  items: StatItem[];
}

const DEFAULT_ACCENT = "#1A8040";

export default function StatBar({ items }: Props) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {items.map((item, i) => {
        const color = item.color ?? DEFAULT_ACCENT;
        const clickable = !!item.onClick;
        const active = !!item.active;
        return (
          <button
            key={`${item.label}-${i}`}
            type="button"
            onClick={item.onClick}
            disabled={!clickable}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              background: active ? color : `${color}12`,
              border: `1.5px solid ${active ? color : `${color}30`}`,
              borderRadius: "999px",
              cursor: clickable ? "pointer" : "default",
              outline: "none",
              transition: "background 0.15s, border-color 0.15s, transform 0.1s",
              boxShadow: active ? `0 2px 10px ${color}40` : "none",
            }}
            onMouseEnter={clickable && !active ? (e) => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.borderColor = `${color}55`; } : undefined}
            onMouseLeave={clickable && !active ? (e) => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}30`; } : undefined}
          >
            <span style={{ fontFamily: SG, fontSize: "18px", fontWeight: 700, color: active ? "#ffffff" : color, letterSpacing: "-0.3px", lineHeight: 1 }}>{item.value}</span>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
              <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: active ? "rgba(255,255,255,0.9)" : color, letterSpacing: "1.4px", textTransform: "uppercase" }}>{item.label}</span>
              {item.hint && <span style={{ fontFamily: B, fontSize: "10px", color: active ? "rgba(255,255,255,0.75)" : "#9AAA98", marginTop: "3px" }}>{item.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
