import Navbar from "@/components/shared/Navbar";
import MembersSidebar from "@/components/members/Sidebar";
import ToastNotifications from "@/components/shared/ToastNotifications";
import MobileNav from "@/components/members/MobileNav";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sendWelcomeEmail } from "@/lib/emails/welcome";
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role ?? "member";
  const isAdmin = ["admin", "super_admin"].includes(role);

  // Auto-create profile if it doesn't exist
  if (userId) {
    const { data: existing } = await admin().from("profiles").select("id").eq("id", userId).single();
    if (!existing) {
      const user = await currentUser();
      const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
      const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || email.split("@")[0] || "Member";
      await admin().from("profiles").insert({
        id: userId,
        display_name: displayName,
        avatar_url: user?.imageUrl ?? null,
        role: "member",
      });
      if (email) await sendWelcomeEmail({ email, name: displayName });
    }
  }

  // Fetch active announcement
  const { data: siteSettings } = await (admin() as any)
    .from("site_settings")
    .select("announcement_text, announcement_active, announcement_color")
    .single();
  const announcement = siteSettings?.announcement_active ? siteSettings : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"#0F1A0B" }}>
      <Navbar/>
      {announcement && (
        <div style={{ background: announcement.announcement_color + "20", borderBottom: `2px solid ${announcement.announcement_color}`, padding: "10px 24px", textAlign: "center" }}>
          <span style={{ fontFamily: "var(--font-barlow,'Barlow',sans-serif)", fontSize: "13px", color: "#F0EAD6" }}>{announcement.announcement_text}</span>
        </div>
      )}
      <div style={{ flex:1, maxWidth:"1280px", margin:"0 auto", width:"100%", padding:"24px 16px 90px", display:"flex", gap:"28px" }}>
        <div className="desktop-sidebar">
          <MembersSidebar isAdmin={isAdmin} role={role}/>
        </div>
        <main style={{ flex:1, minWidth:0 }}>{children}</main>
      </div>
      <div className="mobile-only">
        <MobileNav/>
      </div>
      <ToastNotifications/>
    </div>
  );
}
