import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndAwardBadges } from "@/lib/badges";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");
  const my = searchParams.get("my");

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = db()
    .from("event_tickets")
    .select(`
      *,
      profiles:user_id(id, display_name, avatar_url),
      event_tiers:tier_id(id, name, price, color),
      events:event_id(id, title, date, location)
    `)
    .order("created_at", { ascending: false });

  if (my === "true") {
    query = query.eq("user_id", userId);
  } else if (event_id) {
    if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    query = query.eq("event_id", event_id);
  } else {
    if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tickets, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: tickets ?? [] });
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { event_id, tier_id } = body;

  if (!event_id || !tier_id) return NextResponse.json({ error: "Missing event_id or tier_id" }, { status: 400 });

  const supabase = db();

  // Get event
  const { data: event } = await (supabase as any).from("events").select("*").eq("id", event_id).single();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Check early access
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role ?? "member";
  const isSponsorOrAbove = ["sponsor", "admin", "super_admin"].includes(role);
  const now = new Date();

  if (event.sponsor_access_at && event.member_access_at) {
    const sponsorDate = new Date(event.sponsor_access_at);
    const memberDate = new Date(event.member_access_at);

    if (now < sponsorDate) {
      return NextResponse.json({ error: "Registration is not open yet." }, { status: 400 });
    }

    if (now >= sponsorDate && now < memberDate && !isSponsorOrAbove) {
      const diff = Math.ceil((memberDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return NextResponse.json({
        error: `This event is in early access for sponsors only. General registration opens in ${diff} day${diff !== 1 ? "s" : ""}.`,
        early_access: true,
        member_access_at: event.member_access_at,
      }, { status: 403 });
    }
  }

  // Get tier
  const { data: tier } = await supabase.from("event_tiers").select("*").eq("id", tier_id).single();
  if (!tier) return NextResponse.json({ error: "Tier not found" }, { status: 404 });
  if (!tier.is_active) return NextResponse.json({ error: "This tier is no longer available" }, { status: 400 });
  if (tier.slots_remaining !== null && tier.slots_remaining <= 0) {
    return NextResponse.json({ error: "This tier is sold out" }, { status: 400 });
  }

  // Get member profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

  // Check already has ticket for this event
  const { data: existing } = await supabase
    .from("event_tickets")
    .select("id")
    .eq("event_id", event_id)
    .eq("user_id", userId)
    .single();
  if (existing) return NextResponse.json({ error: "You already have a ticket for this event" }, { status: 409 });

  // Build QR data
  const qr_data = {
    member_id: userId,
    member_name: profile?.display_name ?? "Member",
    member_email: profile?.email ?? "",
    avatar_url: profile?.avatar_url ?? null,
    event_id,
    event_name: event.title,
    event_date: event.date,
    event_location: event.location,
    tier_id,
    tier_name: tier.name,
    tier_price: tier.price,
    registered_at: new Date().toISOString(),
  };

  // Determine payment status
  const payment_status = tier.price > 0 ? "pending" : "free";

  // Create ticket
  const { data: ticket, error } = await supabase
    .from("event_tickets")
    .insert({
      event_id,
      user_id: userId,
      tier_id,
      status: tier.price > 0 ? "pending_payment" : "active",
      payment_status,
      qr_data,
    })
    .select(`
      *,
      profiles:user_id(id, display_name, avatar_url),
      event_tiers:tier_id(id, name, price, color),
      events:event_id(id, title, date, location)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify member
  await (supabase.from("notifications") as any).insert({
    user_id: userId,
    type: "event_reminder",
    title: `Ticket confirmed for ${event.title}! 🎫`,
    message: `Your ${tier.name} ticket is ready. Ticket #${ticket.ticket_number}`,
    link: `/members/tickets/${ticket.id}`,
  });

  // Award badges
  await checkAndAwardBadges(userId, "event_count");

  return NextResponse.json({ ticket });
}
