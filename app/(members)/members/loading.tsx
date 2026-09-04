// Matches /members dashboard: header + 4 stat cards + short activity list.
import { SkHeader, SkStatGrid, SkRow } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="180px" subW="120px" />
      <SkStatGrid count={4} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => <SkRow key={i} />)}
      </div>
    </div>
  );
}
