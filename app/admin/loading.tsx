// Matches /admin dashboard: header + 4 stat cards + two recent-item panels
// (recent orders, recent members). Mobile stacks the panels; desktop shows
// them side by side via .sk-admin-recent-grid.
import { SkHeader, SkStatGrid, SkLine, SkCircle } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="220px" subW="160px" />
      <SkStatGrid count={4} />
      <div className="sk-admin-recent-grid" style={{ display: "grid", gap: 14 }}>
        {Array.from({ length: 2 }).map((_, panel) => (
          <div key={panel} style={{ background: "#FFFFFF", border: "1.5px solid #DDE8DD", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <SkLine h="14px" w="140px" />
            {Array.from({ length: 5 }).map((_, row) => (
              <div key={row} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <SkCircle size="30px" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <SkLine h="11px" w="60%" />
                  <SkLine h="10px" w="35%" />
                </div>
                <SkLine w="50px" h="12px" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .sk-admin-recent-grid { grid-template-columns: 1fr; }
        @media (min-width: 769px) { .sk-admin-recent-grid { grid-template-columns: 1fr 1fr; } }
      ` }} />
    </div>
  );
}
