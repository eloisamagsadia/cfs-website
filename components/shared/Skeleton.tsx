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

/* ------- Composed page-level skeletons -------
   Used as drop-in replacements for the old generic <SkeletonPage />.
   Pick the shape that matches the page: list, form, grid, or detail.
   Each is fully responsive via the .sk-* classes in globals.css. */

// Header + list of rows. Use for admin tables, order lists, notifications,
// support tickets, activity feeds — anything shaped like a vertical stack
// of items with an avatar/icon on the left and metadata on the right.
export function SkListLoading({ rows = 6, withTrailing = true }: { rows?: number; withTrailing?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="200px" subW="140px" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: rows }).map((_, i) => <SkRow key={i} withTrailing={withTrailing} />)}
      </div>
    </div>
  );
}

// Header + form panel with labeled inputs. Use for edit/settings pages.
export function SkFormLoading({ fields = 6 }: { fields?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="200px" subW="140px" />
      <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <SkLine h="11px" w="100px" />
            <SkLine h="38px" w="100%" r="8px" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Header + responsive card grid (1 col mobile, 2 tablet, 3 desktop).
// Use for exclusive content, submissions, media library, product grids.
export function SkGridLoading({ cards = 6 }: { cards?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="180px" subW="120px" />
      <div className="sk-card-grid">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 12, overflow: "hidden" }}>
            <SkCard h="140px" r="0" />
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <SkLine h="14px" w="70%" />
              <SkLine h="11px" w="50%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Header + two content panels. Use for detail pages (order detail, letter
// detail, single-item admin views).
export function SkDetailLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="220px" subW="160px" />
      <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <SkLine h="14px" w="60%" />
        <SkLine h="11px" w="100%" />
        <SkLine h="11px" w="90%" />
        <SkLine h="11px" w="75%" />
      </div>
      <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <SkLine h="14px" w="40%" />
        <SkLine h="11px" w="100%" />
        <SkLine h="11px" w="85%" />
        <SkLine h="11px" w="60%" />
      </div>
    </div>
  );
}

// Chat: header + list of alternating-side message bubbles + composer bar.
// The bubble width varies to look like real messages.
export function SkChatLoading() {
  const bubbles = [
    { side: "left" as const, w: "68%" },
    { side: "right" as const, w: "42%" },
    { side: "left" as const, w: "80%" },
    { side: "right" as const, w: "35%" },
    { side: "left" as const, w: "56%" },
    { side: "right" as const, w: "72%" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {/* Room header */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center" }}>
        <SkCircle size="40px" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <SkLine h="13px" w="180px" />
          <SkLine h="10px" w="90px" />
        </div>
      </div>
      {/* Message bubbles */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, padding: "4px 2px" }}>
        {bubbles.map((b, i) => (
          <div key={i} style={{ display: "flex", justifyContent: b.side === "left" ? "flex-start" : "flex-end" }}>
            <SkLine h="34px" w={b.w} r="14px" />
          </div>
        ))}
      </div>
      {/* Composer */}
      <SkLine h="44px" w="100%" r="22px" />
    </div>
  );
}
