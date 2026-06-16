import type { Metadata } from "next";
import MaintenancePage from "@/components/MaintenancePage";

export const metadata: Metadata = { title: "Coming Soon | CFS" };
export const viewport = { themeColor: "#FAFDF9" };

// TODO: Remove maintenance page after launch
export default function HomePage() {
  return <MaintenancePage />;
}
