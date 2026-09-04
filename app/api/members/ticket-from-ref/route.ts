import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Resolves a payment reference (bundle_id or ticket_id, as stored in
// payment_transactions.reference_id) to the caller's own ticket id, so
// /payment/success can jump the buyer straight to their receipt on
// /members/tickets/[id] instead of a generic ticket list.
//
// GET /api/members/ticket-from-ref?ref=xxx
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "ref required" }, { status: 400 });

  const admin = createAdminClient();

  // Try bundle_id first (new bundle purchases store bundle_id as reference).
  const { data: byBundle } = await (admin.from("event_tickets") as any)
    .select("id, ticket_number, status, created_at")
    .eq("bundle_id", ref)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (byBundle) return NextResponse.json({ ticket_id: (byBundle as any).id });

  // Fall back to ticket.id (legacy solo purchases).
  const { data: byId } = await (admin.from("event_tickets") as any)
    .select("id, ticket_number, status")
    .eq("id", ref)
    .eq("user_id", userId)
    .maybeSingle();
  if (byId) return NextResponse.json({ ticket_id: (byId as any).id });

  return NextResponse.json({ error: "No ticket found for this reference" }, { status: 404 });
}
