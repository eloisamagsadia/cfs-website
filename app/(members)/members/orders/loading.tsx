// Matches /members/orders: header + list of order rows (order#, date, total, status).
import { SkHeader, SkLine } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="160px" subW="120px" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: 1 }}>
              <SkLine h="13px" w="130px" />
              <SkLine h="11px" w="90px" />
            </div>
            <SkLine w="60px" h="14px" />
            <SkLine w="70px" h="22px" r="20px" />
          </div>
        ))}
      </div>
    </div>
  );
}
