"use client";
import Link from "next/link";
import type { ReactNode } from "react";

const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children: ReactNode;
}

type LinkProps = CommonProps & { href: string; onClick?: never; type?: never; disabled?: never };
type ButtonProps = CommonProps & { href?: never; onClick?: (e: React.MouseEvent) => void; type?: "button" | "submit"; disabled?: boolean };

type Props = LinkProps | ButtonProps;

const variants: Record<Variant, { bg: string; color: string; border: string; shadow?: string; hoverBg: string; hoverBorder?: string }> = {
  primary:   { bg: "#1A8040", color: "#ffffff", border: "1.5px solid #1A8040", shadow: "0 2px 8px rgba(26,128,64,0.25)", hoverBg: "#156530", hoverBorder: "#156530" },
  secondary: { bg: "#E8F0E4", color: "#1B3A2D", border: "1.5px solid transparent", hoverBg: "#DDE8DD" },
  ghost:     { bg: "transparent", color: "#4A7C59", border: "1.5px solid #DDE8DD", hoverBg: "#F2F7F2", hoverBorder: "#1A8040" },
  danger:    { bg: "#FFE8EC", color: "#CC3344", border: "1.5px solid #CC334440", hoverBg: "#FFD5DB" },
};

const sizes: Record<Size, { fontSize: string; padding: string; iconSize: number }> = {
  sm: { fontSize: "10px", padding: "7px 12px", iconSize: 11 },
  md: { fontSize: "11px", padding: "9px 16px", iconSize: 12 },
};

export default function AdminActionButton(props: Props) {
  const { variant = "secondary", size = "md", icon, children } = props;
  const v = variants[variant];
  const s = sizes[size];

  const style: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontFamily: SG,
    fontSize: s.fontSize,
    fontWeight: 700,
    letterSpacing: "1.2px",
    background: v.bg,
    color: v.color,
    border: v.border,
    borderRadius: "10px",
    padding: s.padding,
    textDecoration: "none",
    cursor: "pointer",
    outline: "none",
    boxShadow: v.shadow,
    transition: "background 0.15s, border-color 0.15s, transform 0.15s, box-shadow 0.15s, color 0.15s",
  };

  // Inline hover via mouse events (works without global CSS)
  function onEnter(e: React.MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    el.style.background = v.hoverBg;
    if (v.hoverBorder) el.style.borderColor = v.hoverBorder;
    if (variant === "primary") { el.style.transform = "translateY(-1px)"; el.style.boxShadow = "0 4px 14px rgba(21,101,48,0.3)"; }
  }
  function onLeave(e: React.MouseEvent<HTMLElement>) {
    const el = e.currentTarget;
    el.style.background = v.bg;
    el.style.borderColor = variant === "secondary" ? "transparent" : v.border.split(" ").pop() ?? v.bg;
    if (v.hoverBorder && variant !== "secondary") {
      // reset to base color from variant border string
      const baseColor = variants[variant].border.split(" ").pop() ?? "";
      el.style.borderColor = baseColor;
    }
    if (variant === "primary") { el.style.transform = "translateY(0)"; el.style.boxShadow = v.shadow ?? ""; }
  }

  const iconNode = icon ? <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span> : null;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} style={style} onMouseEnter={onEnter} onMouseLeave={onLeave}>
        {iconNode}
        {children}
      </Link>
    );
  }

  const { onClick, type = "button", disabled } = props as ButtonProps;
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...style, opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
      onMouseEnter={disabled ? undefined : onEnter}
      onMouseLeave={disabled ? undefined : onLeave}
    >
      {iconNode}
      {children}
    </button>
  );
}
