import { auth } from "@clerk/nextjs/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import NotificationsClient from "@/components/members/NotificationsClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title:"Notifications" };

export default async function NotificationsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return <NotificationsClient initialNotifications={notifications ?? []} userId={userId}/>;
}