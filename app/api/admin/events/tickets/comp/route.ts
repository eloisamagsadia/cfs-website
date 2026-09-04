import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { randomUUID } from "crypto";

// Manual/comp ticket issuance by admin+ roles.
//
// POST: create tickets for a specific member without going through
// PayMongo. Tickets are marked active + payment_status=free (or the
// payment_status the admin chose), and count against event capacity
// like any other active ticket. Bundle tiers create N rows in one call
// sharing a bundle_id.
//
// DELETE: force-cancel an existing ticket (or all rows in a bundle if
// the caller passes bundle_id). Used to pull back a comp'd ticket or
// clean up mistakes.

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return userId;
}

export async function POST(req: NextRequest) {
  const actorId = await requireAdmin();
  if (!actorId) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { event_id, tier_id, target_user_id, note } = body ?? {};
  if (!event_id || !target_user_id) {
    return NextResponse.json({ error: "event_id and target_user_id are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Look up event + tier + target profile
  const { data: event } = await (admin.from("events") as any).select("id, title, date, location, banner_url, price, capacity").eq("id", event_id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  let tier: any = null;
  if (tier_id) {
    const { data } = await (admin.from("event_tiers") as any).select("*").eq("id", tier_id).eq("event_id", event_id).maybeSingle();
    if (!data) return NextResponse.json({ error: "Tier not found for this event" }, { status: 404 });
    if (data.is_active === false) return NextResponse.json({ error: "This tier is inactive" }, { status: 400 });
    tier = data;
  }

  const { data: profile } = await (admin.from("profiles") as any).select("id, display_name, email, avatar_url").eq("id", target_user_id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Target member not found" }, { status: 404 });

  const bundleSize = Math.max(1, Math.min(20, Number(tier?.bundle_size ?? 1) || 1));
  const tierName  = tier?.name  ?? "General Admission";
  const tierPrice = Number(tier?.price ?? event.price ?? 0);

  // Capacity gate — comp tickets count like real ones. If the event has
  // capacity, make sure the whole bundle fits.
  if (event.capacity) {
    const { count } = await (admin.from("event_tickets") as any)
      .select("id", { count: "exact", head: true })
      .eq("event_id", event_id)
      .in("status", ["active", "used"]);
    if ((count ?? 0) + bundleSize > event.capacity) {
      return NextResponse.json({ error: "Not enough seats left in this event" }, { status: 400 });
    }
  }

  // Tier slot gate — respects the tier's own capacity via slots_remaining
  if (tier && tier.slots_remaining !== null && tier.slots_remaining < bundleSize) {
    return NextResponse.json({
      error: tier.slots_remaining <= 0
        ? "This tier is sold out"
        : `Only ${tier.slots_remaining} slot${tier.slots_remaining === 1 ? "" : "s"} left in this tier — not enough for ${bundleSize}.`,
    }, { status: 400 });
  }

  const bundle_id = randomUUID();
  const rows = Array.from({ length: bundleSize }, (_, i) => ({
    event_id,
    user_id: target_user_id,
    tier_id: tier_id ?? null,
    status: "active",
    payment_status: "free",
    bundle_id,
    qr_data: {
      member_id: target_user_id,
      member_name: (profile as any)?.display_name ?? "Member",
      member_email: (profile as any)?.email ?? "",
      avatar_url: (profile as any)?.avatar_url ?? null,
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
      comp_source: "admin_manual",
      comp_admin_id: actorId,
    },
  }));

  const { data: tickets, error } = await (admin.from("event_tickets") as any).insert(rows).select();
  if (error || !tickets?.length) {
    return NextResponse.json({ error: error?.message ?? "Failed to create ticket(s)" }, { status: 500 });
  }
  if (tickets.length !== bundleSize) {
    // Partial insert — roll back so we don't leave a half-issued bundle
    const insertedIds = tickets.map((t: any) => t.id);
    await (admin.from("event_tickets") as any).delete().in("id", insertedIds);
    return NextResponse.json({ error: `Partial insert (${tickets.length}/${bundleSize}) — rolled back.` }, { status: 500 });
  }

  logAudit({
    userId: actorId,
    action: "comp_ticket",
    target_type: "event",
    target_id: event_id,
    details: {
      event_title: event.title,
      tier_name: tierName,
      bundle_size: bundleSize,
      target_user_id,
      target_display_name: (profile as any)?.display_name ?? null,
      bundle_id,
      note: note ?? null,
    },
    req,
  });

  return NextResponse.json({ tickets, bundle_id, bundle_size: bundleSize });
}

export async function DELETE(req: NextRequest) {
  const actorId = await requireAdmin();
  if (!actorId) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get("id");
  const bundleId = searchParams.get("bundle_id");
  if (!ticketId && !bundleId) return NextResponse.json({ error: "id or bundle_id required" }, { status: 400 });

  const admin = createAdminClient();
  const upd = bundleId
    ? (admin.from("event_tickets") as any).update({ status: "cancelled", payment_status: "failed" }).eq("bundle_id", bundleId).select("id, event_id")
    : (admin.from("event_tickets") as any).update({ status: "cancelled", payment_status: "failed" }).eq("id", ticketId).select("id, event_id");
  const { data, error } = await upd;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: actorId,
    action: "cancel_ticket",
    target_type: "event_tickets",
    target_id: bundleId ?? ticketId,
    details: { cancelled_count: data?.length ?? 0, by: "admin_manual" },
    req,
  });

  return NextResponse.json({ cancelled: data?.length ?? 0 });
}
