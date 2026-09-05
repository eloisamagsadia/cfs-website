import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enrichTiersWithRemaining, getTierRemaining } from "@/lib/event-tier-slots";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const event_id = new URL(req.url).searchParams.get("event_id");
  if (!event_id) return NextResponse.json({ error: "Missing event_id" }, { status: 400 });

  const client = db();
  const { data: tiers, error } = await client
    .from("event_tiers")
    .select("*")
    .eq("event_id", event_id)
    .order("price", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const enriched = await enrichTiersWithRemaining(client, event_id, (tiers ?? []) as any[]);
  return NextResponse.json({ tiers: enriched });
}

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { event_id, name, price, capacity, perks, color, bundle_size } = body;

  if (!event_id || !name) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const { data: tier, error } = await db()
    .from("event_tiers")
    .insert({
      event_id,
      name,
      price: price ?? 0,
      capacity: capacity ?? null,
      slots_remaining: capacity ?? null,
      perks: perks ?? [],
      color: color ?? "#3CCE2A",
      bundle_size: Math.max(1, Math.min(20, Number(bundle_size ?? 1) || 1)),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Overlay live remaining so the client doesn't paint the stale
  // stored slots_remaining column (fresh insert usually matches
  // capacity but do it anyway for parity with PATCH).
  const remaining = await getTierRemaining(db(), event_id, (tier as any).id);
  return NextResponse.json({ tier: { ...(tier as any), slots_remaining: remaining } });
}

export async function PATCH(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (updates.bundle_size !== undefined) {
    updates.bundle_size = Math.max(1, Math.min(20, Number(updates.bundle_size ?? 1) || 1));
  }

  const client = db();
  const { data: tier, error } = await client
    .from("event_tiers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // The stored slots_remaining column doesn't get touched by capacity
  // edits (it isn't decremented on register either — that's why we
  // moved to live compute). Overlay the live value so the tier editor
  // stops showing "10/5" after capacity changes from 10 to 5.
  const remaining = await getTierRemaining(client, (tier as any).event_id, (tier as any).id);
  return NextResponse.json({ tier: { ...(tier as any), slots_remaining: remaining } });
}

export async function DELETE(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await db().from("event_tiers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
