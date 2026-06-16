import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SuperSidebar from "@/components/super/SuperSidebar";
import MobileSuperNav from "@/components/super/MobileSuperNav";
import Navbar from "@/components/shared/Navbar";

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "super_admin") redirect("/members");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#F7FAF5" }}>
      <Navbar />
      {/* Gold accent bar */}
      <div style={{ height: "3px", background: "linear-gradient(90deg, #F5C82A, #F07228, #F5C82A)" }} />
      <div style={{ flex: 1, maxWidth: "1280px", margin: "0 auto", width: "100%", padding: "32px 24px 90px", display: "flex", gap: "28px" }}>
        <div className="desktop-sidebar"><SuperSidebar /></div>
        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
      <div className="mobile-only"><MobileSuperNav /></div>
    </div>
  );
}
