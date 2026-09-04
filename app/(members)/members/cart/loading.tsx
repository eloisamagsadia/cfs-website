// Matches /members/cart: cart items on the left, summary panel on the
// right (desktop). On mobile the summary stacks below via CSS grid.
import { SkHeader, SkLine, SkCircle } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="120px" subW="90px" />
      <div className="sk-cart-grid" style={{ display: "grid", gap: 20 }}>
        {/* Items list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 12, padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <SkCircle size="64px" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <SkLine h="13px" w="70%" />
                <SkLine h="11px" w="45%" />
              </div>
              <SkLine w="60px" h="14px" />
            </div>
          ))}
        </div>
        {/* Summary */}
        <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12, height: "fit-content" }}>
          <SkLine h="14px" w="100px" />
          <SkLine h="11px" w="100%" />
          <SkLine h="11px" w="80%" />
          <SkLine h="11px" w="60%" />
          <SkLine h="42px" w="100%" r="8px" />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .sk-cart-grid { grid-template-columns: 1fr; }
        @media (min-width: 769px) { .sk-cart-grid { grid-template-columns: 1fr 320px; } }
      ` }} />
    </div>
  );
}
