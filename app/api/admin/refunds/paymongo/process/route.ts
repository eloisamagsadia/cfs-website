import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRefund, type RefundReason } from "@/lib/paymongo";
import { logAudit } from "@/lib/audit";

/**
 * Auto-refund via PayMongo API.
 *
 * POST { refund_id, reason? }
 *
 * Flow:
 *   1. Load refund row (must be pending) + resolve the original PayMongo payment_id
 *      from the linked entity (event_ticket / order / donation).
 *   2. Call PayMongo POST /v1/refunds with the amount and payment_id.
 *   3. Store the returned refund_id in refunds.paymongo_ref, move status to processing.
 *   4. Webhook eventually fires refund.succeeded / refund.failed and completes the row.
 *
 * Guards: super-admin only (money movement is nuclear), refund must be pending,
 * entity must have a stored payment_id, PayMongo call must succeed.
 */

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

async function resolvePaymentId(admin: any, entityType: string, entityId: string): Promise<string | null> {
  if (entityType === "event_ticket") {
    const { data } = await admin.from("event_tickets").select("payment_id").eq("id", entityId).maybeSingle();
    return data?.payment_id ?? null;
  }
  if (entityType === "event_registration") {
    // Legacy path — entityId may be a bundle_id or a single ticket id.
    // Try bundle_id first (any ticket in the bundle carries the same payment_id).
    const byBundle = await admin.from("event_tickets").select("payment_id").eq("bundle_id", entityId).limit(1).maybeSingle();
    if (byBundle.data?.payment_id) return byBundle.data.payment_id;
    const byId = await admin.from("event_tickets").select("payment_id").eq("id", entityId).maybeSingle();
    return byId.data?.payment_id ?? null;
  }
  if (entityType === "order") {
    const { data } = await admin.from("orders").select("paymongo_ref").eq("id", entityId).maybeSingle();
    return data?.paymongo_ref ?? null;
  }
  if (entityType === "donation") {
    const { data } = await admin.from("donations").select("paymongo_ref").eq("id", entityId).maybeSingle();
    return data?.paymongo_ref ?? null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Super admin only — refunds move real money." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const refund_id = String(body?.refund_id ?? "").trim();
  const reason    = ((body?.reason ?? "requested_by_customer") as RefundReason);
  if (!refund_id) return NextResponse.json({ error: "refund_id required" }, { status: 400 });
  if (!["duplicate","fraudulent","requested_by_customer","others"].includes(reason)) {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: refund, error: rErr } = await (admin as any)
    .from("refunds")
    .select("*")
    .eq("id", refund_id)
    .maybeSingle();
  if (rErr)    return NextResponse.json({ error: rErr.message }, { status: 500 });
  if (!refund) return NextResponse.json({ error: "Refund not found" }, { status: 404 });
  if (refund.status !== "pending") {
    return NextResponse.json({ error: `Refund is ${refund.status} — only pending refunds can be processed.` }, { status: 400 });
  }
  if (refund.paymongo_ref) {
    return NextResponse.json({ error: "This refund has already been submitted to PayMongo (idempotency check)." }, { status: 400 });
  }
  const amount = Number(refund.amount ?? 0);
  if (!(amount > 0)) return NextResponse.json({ error: "Refund amount must be positive" }, { status: 400 });

  const paymentId = await resolvePaymentId(admin, refund.entity_type, refund.entity_id);
  if (!paymentId) {
    return NextResponse.json({
      error: `No original PayMongo payment_id on record for this ${refund.entity_type}. This charge was likely manual/free/legacy — refund it in the PayMongo dashboard and mark completed here.`,
    }, { status: 400 });
  }

  // Fire the API call
  let pmRefund;
  try {
    pmRefund = await createRefund({
      amount, payment_id: paymentId, reason,
      notes: `Refund #${refund.id.slice(0, 8)} — ${refund.reason?.slice(0, 200) ?? "no reason recorded"}`,
    });
  } catch (e: any) {
    // Mark the row failed so ops can retry / manual-process
    await (admin as any).from("refunds")
      .update({ status: "failed", note: `${refund.note ?? ""}\n[paymongo_error:${new Date().toISOString()}] ${e?.message ?? "unknown"}` })
      .eq("id", refund.id);
    await logAudit({ userId, action: "refund_paymongo_failed", target_type: "refund", target_id: refund.id, details: { message: e?.message ?? "unknown", payment_id: paymentId }, req });
    return NextResponse.json({ error: `PayMongo error: ${e?.message ?? "unknown"}` }, { status: 502 });
  }

  // Persist the PayMongo refund id and move to processing (webhook completes it).
  // If PayMongo returned status "succeeded" synchronously (rare, but happens for
  // certain rails), skip processing and jump straight to completed here so ops
  // sees the truth even if the webhook lags.
  const nextStatus = pmRefund.status === "succeeded" ? "completed" : "processing";
  const patch: any = {
    status:       nextStatus,
    paymongo_ref: pmRefund.id,
  };
  if (nextStatus === "completed") {
    patch.processed_by = userId;
    patch.processed_at = new Date().toISOString();
  }

  const { error: uErr } = await (admin as any).from("refunds").update(patch).eq("id", refund.id);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  await logAudit({
    userId,
    action: nextStatus === "completed" ? "refund_paymongo_completed" : "refund_paymongo_processing",
    target_type: "refund",
    target_id: refund.id,
    details: { paymongo_ref: pmRefund.id, payment_id: paymentId, amount, reason },
    req,
  });

  return NextResponse.json({
    ok: true,
    status: nextStatus,
    paymongo_ref: pmRefund.id,
  });
}
