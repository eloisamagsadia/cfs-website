"use client";
import type { ReactNode } from "react";

const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

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
  /** min width per stat cell (default 130px) */
  minCell?: number;
}

const DEFAULT_ACCENT = "#1A8040";

export default function StatBar({ items, minCell = 130 }: Props) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        display: "flex",
        flexWrap: "wrap",
        overflow: "hidden",
        boxShadow: "0 1px 0 rgba(15,42,30,0.04), 0 6px 18px rgba(15,42,30,0.06)",
      }}
    >
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
              flex: `1 1 ${minCell}px`,
              minWidth: `${minCell}px`,
              display: "flex",
              alignItems: "stretch",
              padding: 0,
              background: active ? `${color}12` : "transparent",
              border: "none",
              borderLeft: i > 0 ? "1px solid #F0F5F0" : "none",
              cursor: clickable ? "pointer" : "default",
              outline: "none",
              textAlign: "left" as const,
              transition: "background 0.15s",
            }}
            onMouseEnter={clickable && !active ? (e) => { e.currentTarget.style.background = "#F7FAF5"; } : undefined}
            onMouseLeave={clickable && !active ? (e) => { e.currentTarget.style.background = "transparent"; } : undefined}
          >
            {/* Accent bar */}
            <span style={{ width: "3px", background: color, flexShrink: 0, opacity: active ? 1 : 0.7 }} />
            {/* Content */}
            <span style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
              <span style={{ fontFamily: SG, fontSize: "22px", fontWeight: 700, color, letterSpacing: "-0.3px", lineHeight: 1 }}>{item.value}</span>
              <span style={{ fontFamily: SG, fontSize: "9px", fontWeight: 700, color: "#7A8E7A", letterSpacing: "1.5px" }}>{item.label}</span>
              {item.hint && <span style={{ fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "10px", color: "#9AAA98", marginTop: "2px" }}>{item.hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
