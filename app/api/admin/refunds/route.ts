import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { notifyRefundOutcome } from "@/lib/refund-notifications";

// Refunds are financial actions — restricted to super_admin only.
// Regular admins never see the Refunds nav entry (gated in the sidebar
// + more page + command palette) and this API refuses their calls.
async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

// GET /api/admin/refunds?status=pending
export async function GET(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Super admin only" }, { status: 403 });

  const status = new URL(req.url).searchParams.get("status");
  const admin  = createAdminClient();

  let q = (admin as any)
    .from("refunds")
    .select("*, profiles:user_id(display_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && status !== "all") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ refunds: data ?? [] });
}

// POST /api/admin/refunds  { entity_type, entity_id, amount, reason, note?, user_id? }
export async function POST(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Super admin only" }, { status: 403 });

  const body = await req.json();
  const { entity_type, entity_id, amount, reason, note, user_id } = body ?? {};
  if (!entity_type || !entity_id || !reason || amount == null)
    return NextResponse.json({ error: "entity_type, entity_id, amount, reason are required" }, { status: 400 });
  if (!["order", "donation", "event_registration", "event_ticket"].includes(entity_type))
    return NextResponse.json({ error: "Invalid entity_type" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("refunds")
    .insert({ entity_type, entity_id, amount, reason, note, user_id, requested_by: userId, status: "pending" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Silent "we got your refund request" in-app notif for the member.
  try { await notifyRefundOutcome(admin as any, data as any, "queued"); } catch {}

  await logAudit({ userId, action: "create_refund", target_type: "refund", target_id: (data as any).id, details: { entity_type, entity_id, amount, reason }, req });
  return NextResponse.json({ refund: data });
}

// PATCH /api/admin/refunds  { id, status?, paymongo_ref?, note? }
export async function PATCH(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Super admin only" }, { status: 403 });

  const body = await req.json();
  const { id, status, paymongo_ref, note } = body ?? {};
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (status !== undefined)       patch.status = status;
  if (paymongo_ref !== undefined) patch.paymongo_ref = paymongo_ref;
  if (note !== undefined)         patch.note = note;
  if (status === "completed") { patch.processed_by = userId; patch.processed_at = new Date().toISOString(); }

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("refunds")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If we just marked an order refund complete, sync the order payment_status.
  if (status === "completed" && (data as any)?.entity_type === "order") {
    await (admin as any).from("orders").update({ payment_status: "refunded" }).eq("id", (data as any).entity_id);
  }
  if (status === "completed" && (data as any)?.entity_type === "donation") {
    await (admin as any).from("donations").update({ status: "refunded" }).eq("id", (data as any).entity_id);
  }
  // Event ticket refunds — cancel every ticket in the bundle (or the single
  // ticket for solo purchases). entity_id may be a bundle_id OR a ticket.id
  // depending on when the ticket was created; try bundle_id first.
  if (status === "completed" && ((data as any)?.entity_type === "event_registration" || (data as any)?.entity_type === "ticket")) {
    const ref = (data as any).entity_id;
    const byBundle = await (admin as any).from("event_tickets")
      .update({ status: "cancelled", payment_status: "refunded" })
      .eq("bundle_id", ref)
      .select("id");
    if (!byBundle.data?.length) {
      await (admin as any).from("event_tickets")
        .update({ status: "cancelled", payment_status: "refunded" })
        .eq("id", ref);
    }
  }
  // event_ticket = single-ticket refund. If the note carries the
  // [tier_change_target:UUID] marker, this is a tier downgrade →
  // swap the tier_id instead of cancelling. Otherwise treat as a
  // cancel-and-refund like the legacy handler above.
  if (status === "completed" && (data as any)?.entity_type === "event_ticket") {
    const ref  = (data as any).entity_id;
    const note = String((data as any)?.note ?? "");
    const match = note.match(/\[tier_change_target:([0-9a-f-]{36})\]/i);
    if (match) {
      await (admin as any).from("event_tickets")
        .update({ tier_id: match[1] })
        .eq("id", ref);
    } else {
      await (admin as any).from("event_tickets")
        .update({ status: "cancelled", payment_status: "refunded" })
        .eq("id", ref);
    }
  }

  // Member-facing lifecycle notif on terminal transitions.
  // Idempotent via audit_log tag inside notifyRefundOutcome, so it's
  // safe if the webhook already fired for the same row.
  if (status === "completed") {
    try { await notifyRefundOutcome(admin as any, data as any, "succeeded"); } catch {}
  } else if (status === "failed") {
    try { await notifyRefundOutcome(admin as any, data as any, "failed"); } catch {}
  }

  await logAudit({ userId, action: "update_refund", target_type: "refund", target_id: id, details: patch, req });
  return NextResponse.json({ refund: data });
}

// DELETE /api/admin/refunds?id=...
export async function DELETE(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Super admin only" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await (admin as any).from("refunds").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "delete_refund", target_type: "refund", target_id: id, req });
  return NextResponse.json({ ok: true });
}
