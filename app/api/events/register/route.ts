import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndAwardBadges } from "@/lib/badges";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { event_id, ticket_type = "general" } = await req.json();
  if (!event_id) return NextResponse.json({ error: "Missing event_id" }, { status: 400 });

  // Check event exists
  const { data: eventRaw } = await (((supabase.from("events") as any) as any) as any).select("*").eq("id", event_id).single();
  const event = eventRaw as any;
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Check members only
  if (event.is_members_only) {
    const { data: profileRaw } = await (((supabase.from("profiles") as any) as any) as any).select("role").eq("id", userId).single();
  const profile = profileRaw as any;
    if (!profile || profile.role === "guest") {
      return NextResponse.json({ error: "Members only event" }, { status: 403 });
    }
  }

  // Check already registered
  const { data: existing } = await supabase
    .from("event_registrations").select("id").eq("event_id", event_id).eq("user_id", userId).single();
  if (existing) return NextResponse.json({ error: "Already registered" }, { status: 409 });

  // Check capacity
  if (event.capacity) {
    const { count } = await supabase
      .from("event_registrations").select("*", { count: "exact", head: true }).eq("event_id", event_id);
    if ((count ?? 0) >= event.capacity) return NextResponse.json({ error: "Event is full" }, { status: 400 });
  }

  // Register (free events only — paid goes through PayMongo)
  const admin = createAdminClient();
  const { data: reg, error } = await admin
    .from("event_registrations")
    .insert({ event_id, user_id: userId, ticket_type, payment_status: "free", amount_paid: 0 })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify user
  await (admin.from("notifications") as any).insert({
    user_id: userId, type: "event_reminder",
    title: `You're registered for ${event.title}! 🎫`,
    message: `Your registration is confirmed. See you on ${new Date(event.date).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}!`,
    link: "/members/events",
  });

  // Check badges
  await checkAndAwardBadges(userId, "event_count");

  return NextResponse.json({ registration: reg });
}
