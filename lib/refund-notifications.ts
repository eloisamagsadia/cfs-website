import type { SupabaseClient } from "@supabase/supabase-js";
import { clerkClient } from "@clerk/nextjs/server";
import { sendRefundSucceededEmail } from "@/lib/emails/refund-succeeded";
import { sendRefundFailedEmail }    from "@/lib/emails/refund-failed";

/**
 * Refund-lifecycle member notifications.
 *
 * All entry points funnel through here so we don't double-notify when
 * both the admin PATCH handler AND the PayMongo webhook end up firing
 * completion side-effects for the same row.
 *
 * Idempotency: we tag audit_log with a
 * "refund_member_notified:<outcome>" action for the refund id. Before
 * doing anything we check that tag; if it's already there we bail.
 * No new schema column required.
 */

type Outcome = "queued" | "succeeded" | "failed";

const NOTIF_META: Record<Outcome, { type: string; title: string; buildMessage: (amount: number) => string }> = {
  queued:    {
    type: "refund_queued",
    title: "Refund request received",
    buildMessage: (amount) => `Your ₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} refund is queued and being processed.`,
  },
  succeeded: {
    type: "refund_completed",
    title: "Refund sent",
    buildMessage: (amount) => `Your ₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} refund has been sent to your original payment method. Expect it in 3–5 business days.`,
  },
  failed:    {
    type: "refund_failed",
    title: "Refund needs attention",
    buildMessage: (amount) => `We couldn't process your ₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} refund automatically. Our team will follow up.`,
  },
};

function entityLabelFor(entityType?: string | null): string | null {
  switch (entityType) {
    case "order":              return "your order";
    case "donation":           return "your donation";
    case "event_ticket":       return "your ticket";
    case "event_registration": return "your event registration";
    default:                   return null;
  }
}

async function alreadyNotified(admin: SupabaseClient, refundId: string, outcome: Outcome): Promise<boolean> {
  try {
    const { data } = await (admin as any)
      .from("audit_log")
      .select("id")
      .eq("action", `refund_member_notified:${outcome}`)
      .eq("target_id", refundId)
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

async function markNotified(admin: SupabaseClient, refundId: string, outcome: Outcome, details: any) {
  try {
    await (admin as any).from("audit_log").insert({
      action: `refund_member_notified:${outcome}`,
      target_type: "refund",
      target_id: refundId,
      details,
    });
  } catch {}
}

async function resolveEmailAndName(admin: SupabaseClient, userId: string): Promise<{ email: string | null; name: string }> {
  const { data: profile } = await (admin as any).from("profiles").select("email, display_name").eq("id", userId).maybeSingle();
  let email = (profile as any)?.email as string | null;
  let name  = ((profile as any)?.display_name as string | null) ?? "";
  if (!email) {
    try {
      const u = await clerkClient.users.getUser(userId);
      email = u.emailAddresses?.[0]?.emailAddress ?? null;
      if (!name) name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "";
    } catch {}
  }
  return { email, name: name || "there" };
}

/**
 * Called from any code path that transitions a refund into a
 * user-visible state. Safe to call more than once — the idempotency
 * tag stops duplicates.
 *
 * `queued`  fires when a refund row is first created (silent email —
 *           in-app notif only, since the download of "refund
 *           requested" is a design decision — see plan doc).
 * `succeeded` fires when refund status transitions to completed.
 *           Drops in-app notif AND email.
 * `failed`  fires when refund status transitions to failed.
 *           Drops in-app notif AND email.
 */
export async function notifyRefundOutcome(
  admin: SupabaseClient,
  refundRow: {
    id: string;
    user_id: string | null;
    amount: number | string;
    entity_type?: string | null;
    reason?: string | null;
    paymongo_ref?: string | null;
    note?: string | null;
  },
  outcome: Outcome,
): Promise<void> {
  if (!refundRow?.user_id) return;
  if (await alreadyNotified(admin, refundRow.id, outcome)) return;

  const amountPesos = Number(refundRow.amount ?? 0);
  const meta        = NOTIF_META[outcome];
  const entityLabel = entityLabelFor(refundRow.entity_type);

  // In-app notification (always)
  try {
    await (admin as any).from("notifications").insert({
      user_id: refundRow.user_id,
      type:    meta.type,
      title:   meta.title,
      message: meta.buildMessage(amountPesos),
      link:    "/members/orders",   // best default — most refunds are for orders/tickets and this is where members check status
      is_read: false,
    });
  } catch {}

  // Email — only for succeeded + failed (queued is intentionally silent per plan)
  if (outcome === "succeeded" || outcome === "failed") {
    const { email, name } = await resolveEmailAndName(admin, refundRow.user_id);
    if (email) {
      try {
        if (outcome === "succeeded") {
          await sendRefundSucceededEmail({
            email, name, amount: amountPesos,
            entityLabel:  entityLabel,
            refundRef:    refundRow.paymongo_ref ?? null,
            reason:       refundRow.reason ?? null,
          });
        } else {
          // Failure reason string extracted from note (webhook writes
          // [paymongo_failed:ts] <reason> when PayMongo rejects).
          const match = String(refundRow.note ?? "").match(/\[paymongo_(?:failed|error):[^\]]*\]\s*(.+)/i);
          const reason = match?.[1]?.slice(0, 240) ?? null;
          await sendRefundFailedEmail({
            email, name, amount: amountPesos,
            entityLabel, reason,
          });
        }
      } catch {}
    }
  }

  await markNotified(admin, refundRow.id, outcome, { amount: amountPesos, entity_type: refundRow.entity_type });
}
