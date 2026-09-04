// Matches /members/badges: header + badge grid. 2 cols mobile, 4 desktop.
import { SkHeader, SkCircle, SkLine } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="140px" subW="180px" />
      <div className="sk-stat-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <SkCircle size="56px" />
            <SkLine h="12px" w="70%" />
            <SkLine h="10px" w="50%" />
          </div>
        ))}
      </div>
    </div>
  );
}
