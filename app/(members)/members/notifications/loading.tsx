// Matches /members/notifications: header + list of notification rows.
import { SkHeader, SkRow } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SkHeader titleW="200px" subW="120px" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array.from({ length: 6 }).map((_, i) => <SkRow key={i} avatarSize="36px" />)}
      </div>
    </div>
  );
}
