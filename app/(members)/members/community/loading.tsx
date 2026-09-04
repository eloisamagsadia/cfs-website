// Matches /members/community: header + composer + feed of post cards.
import { SkHeader, SkLine, SkCircle } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="180px" subW="140px" />
      {/* Composer */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 14, padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <SkCircle size="42px" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <SkLine h="42px" w="100%" r="10px" />
          <SkLine h="12px" w="40%" />
        </div>
      </div>
      {/* Post cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <SkCircle size="36px" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <SkLine h="12px" w="40%" />
                <SkLine h="10px" w="25%" />
              </div>
            </div>
            <SkLine h="12px" w="100%" />
            <SkLine h="12px" w="88%" />
            <SkLine h="12px" w="60%" />
          </div>
        ))}
      </div>
    </div>
  );
}
