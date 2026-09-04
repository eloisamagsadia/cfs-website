// Matches /members/events: header + grid of event cards. Grid is 1 col
// on phones, 2 cols on tablet, 3 cols on desktop (via .sk-card-grid).
import { SkHeader, SkLine, SkCard } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="180px" subW="140px" />
      <div className="sk-card-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 14, overflow: "hidden" }}>
            <SkCard h="140px" r="0" />
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <SkLine h="16px" w="80%" />
              <SkLine h="12px" w="55%" />
              <SkLine h="12px" w="40%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
