"use client";
import { ReactNode } from "react";
import Link from "next/link";

type Variant = "green" | "yellow" | "orange" | "cream" | "dark" | "red";

interface CFSButtonProps {
  children: ReactNode;
  variant?: Variant;
  href?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}

const variantStyles: Record<Variant, { bg: string; text: string }> = {
  green:  { bg: "#1A8040", text: "#F5F0E0" },
  yellow: { bg: "#F0C020", text: "#1A1E14" },
  orange: { bg: "#E86818", text: "#F5F0E0" },
  cream:  { bg: "#F5F0E0", text: "#1A1E14" },
  dark:   { bg: "#1A1E14", text: "#F5F0E0" },
  red:    { bg: "#E83858", text: "#F5F0E0" },
};

const sizeStyles = {
  sm: { padding: "5px 14px", fontSize: "12px" },
  md: { padding: "8px 22px", fontSize: "14px" },
  lg: { padding: "11px 28px", fontSize: "16px" },
};

export default function CFSButton({
  children, variant = "green", href, onClick, size = "md", className = "", type = "button", disabled = false,
}: CFSButtonProps) {
  const { bg, text } = variantStyles[variant];
  const { padding, fontSize } = sizeStyles[size];

  const baseStyle: React.CSSProperties = {
    fontFamily: "var(--font-bangers, 'Bangers', cursive)",
    letterSpacing: "0.1em",
    border: "2.5px solid #1A1E14",
    borderRadius: "6px",
    padding,
    fontSize,
    cursor: disabled ? "not-allowed" : "pointer",
    position: "relative",
    display: "inline-block",
    backgroundColor: bg,
    color: text,
    opacity: disabled ? 0.6 : 1,
    zIndex: 1,
    transition: "transform 0.08s ease",
    textDecoration: "none",
  };

  const shadowStyle: React.CSSProperties = {
    position: "absolute",
    top: "4px",
    left: "4px",
    width: "100%",
    height: "100%",
    backgroundColor: "#1A1E14",
    borderRadius: "6px",
    zIndex: -1,
  };

  const content = (
    <span style={{ position: "relative", zIndex: 1, display: "inline-block" }}>
      <span style={shadowStyle} />
      {children}
    </span>
  );

  if (href && !disabled) {
    return (
      <Link href={href} style={baseStyle} className={className}>
        <span style={shadowStyle} />
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={baseStyle}
      className={className}
      onMouseDown={(e) => (e.currentTarget.style.transform = "translate(2px,2px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translate(0,0)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translate(0,0)")}
    >
      <span style={shadowStyle} />
      {children}
    </button>
  );
}
