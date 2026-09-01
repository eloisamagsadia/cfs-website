import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET  /api/events/[id]/waitlist  → { on_waitlist, position, capacity, registered, is_full }
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth();
  const admin = createAdminClient();
  const eventId = params.id;

  const [ev, regsRes, mineRes, allWait] = await Promise.all([
    (admin as any).from("events").select("id, capacity").eq("id", eventId).maybeSingle(),
    (admin as any).from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", eventId).neq("payment_status", "cancelled"),
    userId
      ? (admin as any).from("event_waitlist").select("*").eq("event_id", eventId).eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
    (admin as any).from("event_waitlist").select("id, user_id, created_at").eq("event_id", eventId).eq("status", "waiting").order("created_at", { ascending: true }),
  ]);

  const capacity   = (ev.data as any)?.capacity ?? null;
  const registered = regsRes.count ?? 0;
  const isFull     = capacity != null && registered >= capacity;

  let position = 0;
  const mine = (mineRes as any)?.data ?? null;
  if (mine?.status === "waiting") {
    const list = (allWait.data as any[] | null) ?? [];
    position = list.findIndex((row: any) => row.id === mine.id) + 1;
  }

  return NextResponse.json({
    capacity,
    registered,
    is_full: isFull,
    waiting_count: (allWait.data ?? []).length,
    on_waitlist: !!mine,
    my_status: mine?.status ?? null,
    position,
  });
}

// POST /api/events/[id]/waitlist  → join waitlist
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Don't put people on the waitlist if they already have an active registration
  const { data: existingReg } = await (admin as any)
    .from("event_registrations")
    .select("id")
    .eq("event_id", params.id)
    .eq("user_id", userId)
    .neq("payment_status", "cancelled")
    .maybeSingle();
  if (existingReg) return NextResponse.json({ error: "You're already registered for this event." }, { status: 400 });

  const { data, error } = await (admin as any)
    .from("event_waitlist")
    .upsert({ event_id: params.id, user_id: userId, status: "waiting" }, { onConflict: "event_id,user_id" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}

// DELETE /api/events/[id]/waitlist  → leave waitlist
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await (admin as any).from("event_waitlist").delete().eq("event_id", params.id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
