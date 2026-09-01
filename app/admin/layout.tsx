import { auth } from "@clerk/nextjs/server";
import Navbar from "@/components/shared/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import MobileAdminNav from "@/components/admin/MobileAdminNav";
import type { Metadata } from "next";
export const metadata: Metadata = { title:{ default:"Admin", template:"%s | CFS Admin" } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role ?? "";
  const isSuper = role === "super_admin";
  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"#F7FAF5" }}>
      <Navbar/>
      <div style={{ flex:1, maxWidth:"1280px", margin:"0 auto", width:"100%", padding:"32px 24px 90px", display:"flex", gap:"28px" }}>
        <div className="desktop-sidebar"><AdminSidebar isSuper={isSuper}/></div>
        <main style={{ flex:1, minWidth:0 }}>{children}</main>
      </div>
      <div className="mobile-only"><MobileAdminNav/></div>
    </div>
  );
}
