// Fires once when the browser first enters any /members/* route. The
// (members)/layout.tsx already renders the sidebar + navbar around the
// {children} slot, so this file must render ONLY the main-content
// skeleton — including a sidebar here would draw a second one.
import { SkHeader, SkStatGrid, SkRow } from "@/components/shared/Skeleton";

export default function MembersRootLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="200px" subW="140px" />
      <SkStatGrid count={4} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => <SkRow key={i} withTrailing />)}
      </div>
    </div>
  );
}
