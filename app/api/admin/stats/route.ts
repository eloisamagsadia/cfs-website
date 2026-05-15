import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    { count: total_members },
    { count: sponsors },
    { count: admins },
    { count: moderators },
    { count: total_posts },
    { count: total_tickets },
    { count: total_events },
    { count: exclusive_content },
  ] = await Promise.all([
    db().from("profiles").select("*", { count: "exact", head: true }),
    db().from("profiles").select("*", { count: "exact", head: true }).eq("role", "sponsor"),
    db().from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
    db().from("profiles").select("*", { count: "exact", head: true }).eq("role", "moderator"),
    db().from("community_posts").select("*", { count: "exact", head: true }).eq("is_hidden", false),
    (db() as any).from("event_tickets").select("*", { count: "exact", head: true }),
    (db() as any).from("events").select("*", { count: "exact", head: true }),
    (db() as any).from("exclusive_content").select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    stats: { total_members, sponsors, admins, moderators, total_posts, total_tickets, total_events, exclusive_content }
  });
}
