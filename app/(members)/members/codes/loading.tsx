// Matches /members/codes: header + 4 promo-code cards.
import { SkHeader, SkLine } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="180px" subW="140px" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: "#FFFFFF", border: "1.5px dashed #DDE8DD", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <SkLine h="18px" w="60%" />
            <SkLine h="11px" w="90%" />
            <SkLine h="11px" w="50%" />
          </div>
        ))}
      </div>
    </div>
  );
}
