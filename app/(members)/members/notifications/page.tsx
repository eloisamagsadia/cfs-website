import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import NotificationsClient from "@/components/members/NotificationsClient";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title:"Notifications" };

export default async function NotificationsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const supabase = createAdminClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return <NotificationsClient initialNotifications={notifications ?? []} userId={userId}/>;
}