// Matches /members/account: header + tab strip + form-like content panels.
import { SkHeader, SkLine, SkCircle } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="150px" subW="180px" />
      {/* Tab strip */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Array.from({ length: 5 }).map((_, i) => <SkLine key={i} w="90px" h="30px" r="20px" />)}
      </div>
      {/* Profile card */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 14, padding: 20, display: "flex", gap: 16, alignItems: "center" }}>
        <SkCircle size="72px" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <SkLine h="16px" w="180px" />
          <SkLine h="12px" w="220px" />
        </div>
      </div>
      {/* Form sections */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <SkLine h="11px" w="100px" />
            <SkLine h="38px" w="100%" r="8px" />
          </div>
        ))}
      </div>
    </div>
  );
}
