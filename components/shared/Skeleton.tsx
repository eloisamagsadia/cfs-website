// Shared skeleton primitives. All skeletons use the .sk class defined in
// globals.css, which handles the shimmer animation, reduced-motion, and
// dark-mode fallback in one place.
//
// Responsive layouts: compose SkMobileOnly / SkDesktopOnly so the same
// loading.tsx can render one shape on phones and a different shape on
// desktop. See app/(members)/members/events/loading.tsx for an example.
import type { CSSProperties, ReactNode } from "react";

type Base = { w?: string; h?: string; r?: string; className?: string; style?: CSSProperties };

export function SkLine({ w = "100%", h = "14px", r = "6px", className = "", style }: Base) {
  return <div className={`sk ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function SkCircle({ size = "40px", className = "", style }: { size?: string; className?: string; style?: CSSProperties }) {
  return <div className={`sk ${className}`} style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, ...style }} />;
}

export function SkCard({ h = "120px", r = "12px", className = "", style }: Base) {
  return <div className={`sk ${className}`} style={{ width: "100%", height: h, borderRadius: r, ...style }} />;
}

// A simple row: circle + two stacked lines + trailing pill. Very common
// list-item shape (member, order, notification, event row).
export function SkRow({ withTrailing = false, avatarSize = "44px" }: { withTrailing?: boolean; avatarSize?: string }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
      <SkCircle size={avatarSize} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <SkLine h="13px" w="55%" />
        <SkLine h="11px" w="35%" />
      </div>
      {withTrailing && <SkLine w="72px" h="24px" r="20px" />}
    </div>
  );
}

// Header block used by every page: big title + short subtitle.
export function SkHeader({ titleW = "180px", subW = "120px" }: { titleW?: string; subW?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <SkLine h="26px" w={titleW} />
      <SkLine h="12px" w={subW} />
    </div>
  );
}

// Stat card row (small dashboard tiles). Grid is responsive via .sk-stat-grid.
export function SkStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="sk-stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: 10, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <SkLine h="26px" w="50px" />
          <SkLine h="11px" w="90px" />
        </div>
      ))}
    </div>
  );
}

// Show `mobile` under 769px, `desktop` at 769px+. Toggled by CSS in globals.css
// so no JS window sniffing (which would cause hydration mismatches).
export function SkResponsive({ mobile, desktop }: { mobile: ReactNode; desktop: ReactNode }) {
  return (
    <>
      <div className="sk-mobile-only">{mobile}</div>
      <div className="sk-desktop-only">{desktop}</div>
    </>
  );
}
