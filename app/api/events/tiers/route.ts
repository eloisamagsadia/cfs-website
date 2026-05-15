import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const event_id = new URL(req.url).searchParams.get("event_id");
  if (!event_id) return NextResponse.json({ error: "Missing event_id" }, { status: 400 });

  const { data: tiers, error } = await db()
    .from("event_tiers")
    .select("*")
    .eq("event_id", event_id)
    .order("price", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tiers: tiers ?? [] });
}

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { event_id, name, price, capacity, perks, color } = body;

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
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tier });
}

export async function PATCH(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data: tier, error } = await db()
    .from("event_tiers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tier });
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
