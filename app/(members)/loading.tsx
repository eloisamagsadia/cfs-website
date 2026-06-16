const R = "var(--font-righteous,'Righteous',sans-serif)";

function Skeleton({ w = "100%", h = "16px", radius = "6px" }: { w?: string; h?: string; radius?: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: "linear-gradient(90deg, #E4EDE4 25%, #DDE8DD 50%, #E4EDE4 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }}/>
  );
}

export default function MembersLoading() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ display: "flex", gap: "28px", padding: "32px 24px", maxWidth: "1280px", margin: "0 auto" }}>
        {/* Sidebar skeleton */}
        <div style={{ width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
          <Skeleton h="14px" w="80px" />
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px" }}>
              <Skeleton w="18px" h="18px" radius="4px" />
              <Skeleton w="80px" h="12px" />
            </div>
          ))}
        </div>

        {/* Main content skeleton */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Page title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Skeleton h="28px" w="200px" radius="6px" />
            <Skeleton h="14px" w="140px" radius="4px" />
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "10px", padding: "18px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <Skeleton h="32px" w="50px" />
                <Skeleton h="12px" w="90px" />
              </div>
            ))}
          </div>

          {/* Content rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: "#FFFFFF", border: "2px solid #DDE8DD", borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "center" }}>
                <Skeleton w="48px" h="48px" radius="50%" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Skeleton h="14px" w="60%" />
                  <Skeleton h="12px" w="40%" />
                </div>
                <Skeleton w="80px" h="28px" radius="6px" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
