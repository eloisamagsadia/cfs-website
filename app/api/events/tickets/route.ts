import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveUserId } from "@/lib/effective-user";
import { evaluateRegistrationGate } from "@/lib/event-registration";
import { checkAndAwardBadges } from "@/lib/badges";
import { sendEventTicket, sendEventTicketBundle } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { randomUUID } from "crypto";

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
    // Honor impersonation: show the target's tickets, not the admin's
    const effective = getEffectiveUserId() ?? userId;
    query = query.eq("user_id", effective);
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

  if (!event_id) return NextResponse.json({ error: "Missing event_id" }, { status: 400 });

  const supabase = db();

  // Get event
  const { data: event } = await (supabase as any).from("events").select("*").eq("id", event_id).single();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Hard gate: registration closed (manual toggle or auto cutoff, cancelled, ended)
  const gate = evaluateRegistrationGate(event);
  if (!gate.open) {
    const msg =
      gate.reason === "manual"    ? "Registration for this event is closed." :
      gate.reason === "auto"      ? "The registration window has ended." :
      gate.reason === "cancelled" ? "This event has been cancelled." :
      gate.reason === "ended"     ? "This event has already ended." :
      "Registration is not open.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

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

  // Resolve tier (nullable — events without tiers use the event's own price)
  let tier: any = null;
  if (tier_id) {
    const { data } = await supabase.from("event_tiers").select("*").eq("id", tier_id).single();
    if (!data) return NextResponse.json({ error: "Tier not found" }, { status: 404 });
    if (!data.is_active) return NextResponse.json({ error: "This tier is no longer available" }, { status: 400 });
    const need = Math.max(1, Math.min(20, Number((data as any).bundle_size ?? 1) || 1));
    if (data.slots_remaining !== null && data.slots_remaining < need) {
      return NextResponse.json({
        error: data.slots_remaining <= 0
          ? "This tier is sold out"
          : `Only ${data.slots_remaining} slot${data.slots_remaining === 1 ? "" : "s"} left in this tier — not enough for a bundle of ${need}.`,
      }, { status: 400 });
    }
    tier = data;
  }

  const tierName  = tier?.name  ?? "General Admission";
  const tierPrice = tier?.price ?? Number(event.price ?? 0);

  // Get member profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

  // Check already has ticket(s) for this event — one purchase per user, even for bundles
  const { count: existingCount } = await (supabase as any)
    .from("event_tickets")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event_id)
    .eq("user_id", userId);
  if ((existingCount ?? 0) > 0) return NextResponse.json({ error: "You already have a ticket for this event" }, { status: 409 });

  // Bundle size lives on the tier now (each tier decides its own quantity).
  // tier.price is the FLAT total for the bundle — not per ticket.
  // Fallback to 1 for events without tiers.
  const bundleSize = Math.max(1, Math.min(20, Number(tier?.bundle_size ?? 1) || 1));

  // Capacity gate — counts only paid/checked-in tickets so stale pending_payment holds don't block paying users.
  // For bundles, the whole bundle must fit.
  if (event.capacity) {
    const { count } = await (supabase as any)
      .from("event_tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event_id)
      .in("status", ["active", "used"]);
    if ((count ?? 0) + bundleSize > event.capacity) {
      return NextResponse.json({ error: "This event is fully booked" }, { status: 400 });
    }
  }

  // Determine payment status
  const payment_status = tierPrice > 0 ? "pending" : "free";
  const bundle_id = randomUUID();

  // Build N ticket rows with a shared bundle_id
  const rows = Array.from({ length: bundleSize }, (_, i) => ({
    event_id,
    user_id: userId,
    tier_id: tier_id ?? null,
    status: tierPrice > 0 ? "pending_payment" : "active",
    payment_status,
    bundle_id,
    qr_data: {
      member_id: userId,
      member_name: profile?.display_name ?? "Member",
      member_email: profile?.email ?? "",
      avatar_url: profile?.avatar_url ?? null,
      event_id,
      event_name: event.title,
      event_date: event.date,
      event_location: event.location,
      tier_id: tier_id ?? null,
      tier_name: tierName,
      tier_price: tierPrice,
      bundle_index: i + 1,
      bundle_size: bundleSize,
      registered_at: new Date().toISOString(),
    },
  }));

  const { data: tickets, error } = await supabase
    .from("event_tickets")
    .insert(rows)
    .select(`
      *,
      profiles:user_id(id, display_name, avatar_url),
      event_tiers:tier_id(id, name, price, color),
      events:event_id(id, title, date, location)
    `);

  if (error || !tickets?.length) return NextResponse.json({ error: error?.message ?? "Failed to create tickets" }, { status: 500 });

  // Sanity check: for bundles we asked for bundleSize rows. If we got fewer,
  // roll back everything we inserted so the buyer isn't left with a partial
  // bundle they still get charged for.
  if (tickets.length !== bundleSize) {
    const insertedIds = tickets.map((t: any) => t.id);
    await (supabase as any).from("event_tickets").delete().in("id", insertedIds);
    return NextResponse.json({ error: `Partial bundle insert (${tickets.length}/${bundleSize}) — rolled back. Please try again.` }, { status: 500 });
  }

  const firstTicket = tickets[0] as any;

  // Notify member (single notification per purchase, even for bundles)
  await (supabase.from("notifications") as any).insert({
    user_id: userId,
    type: "event_reminder",
    title: bundleSize > 1
      ? `${bundleSize} tickets confirmed for ${event.title}! 🎫`
      : `Ticket confirmed for ${event.title}! 🎫`,
    message: bundleSize > 1
      ? `Your ${bundleSize} × ${tierName} tickets are ready.`
      : `Your ${tierName} ticket is ready. Ticket #${firstTicket.ticket_number}`,
    link: `/members/tickets/${firstTicket.id}`,
  });

  // Email the ticket(s) — only for free events; paid events are emailed
  // from the PayMongo webhook after payment succeeds. Non-blocking.
  if (payment_status === "free") {
    let email = (profile as any)?.email as string | null;
    if (!email) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
      } catch {}
    }
    if (email) {
      if (bundleSize > 1) {
        sendEventTicketBundle({
          to: email,
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location ?? "TBA",
          eventBanner: event.banner_url ?? undefined,
          tickets: tickets.map((t: any) => ({ ticketNumber: t.ticket_number, ticketId: t.id })),
          tierName,
        }).catch(() => {});
      } else {
        sendEventTicket({
          to: email,
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location ?? "TBA",
          registrationId: firstTicket.ticket_number ?? firstTicket.id,
        }).catch(() => {});
      }
    }
  }

  // Award badges
  await checkAndAwardBadges(userId, "event_count");

  // Audit — buyer initiated a ticket purchase (or free registration).
  logAudit({
    userId,
    action: tierPrice > 0 ? "purchase_ticket" : "register_event",
    target_type: "event",
    target_id: event_id,
    details: {
      event_title: event.title,
      tier_name: tierName,
      tier_price: tierPrice,
      bundle_size: bundleSize,
      bundle_id,
      payment_status,
      ticket_count: tickets.length,
    },
    req,
  });

  // Return: first ticket for legacy callers, plus bundle_id (used as payment reference) and full list
  return NextResponse.json({ ticket: firstTicket, tickets, bundle_id, bundle_size: bundleSize });
}
