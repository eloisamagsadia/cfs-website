import Navbar from "@/components/shared/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { Metadata } from "next";
export const metadata: Metadata = { title:{ default:"Admin", template:"%s | CFS Admin" } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"#0A120A" }}>
      <Navbar/>
      <div style={{ flex:1, maxWidth:"1280px", margin:"0 auto", width:"100%", padding:"32px 24px", display:"flex", gap:"28px" }}>
        <AdminSidebar/>
        <main style={{ flex:1, minWidth:0 }}>{children}</main>
      </div>
    </div>
  );
}
