import Navbar from "@/components/shared/Navbar";
import MembersSidebar from "@/components/members/Sidebar";
import ToastNotifications from "@/components/shared/ToastNotifications";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sendWelcomeEmail } from "@/lib/emails/welcome";
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = auth();
  const isAdmin = (sessionClaims?.metadata as { role?: string })?.role === "admin";

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

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"#0F1A0B" }}>
      <Navbar/>
      <div style={{ flex:1, maxWidth:"1280px", margin:"0 auto", width:"100%", padding:"32px 24px", display:"flex", gap:"28px" }}>
        <MembersSidebar isAdmin={isAdmin}/>
        <main style={{ flex:1, minWidth:0 }}>{children}</main>
      </div>
      <ToastNotifications/>
    </div>
  );
}
