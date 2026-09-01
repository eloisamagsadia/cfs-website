// Central audit-logging helper. Every admin write action should call
// `logAudit()` so the /super/audit page reflects the true history.
//
// Design goals:
// - Never throw. A logging failure must never block the real write.
// - Standard action names (verb_target) so filters and colors stay stable.
// - Optional details JSON for context (e.g. "role: sponsor -> admin").
// - Captures client IP from request headers when available.

import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditEntry {
  userId: string;                             // Clerk user id performing the action
  action: string;                             // e.g. "change_role", "delete_event"
  target_type?: string | null;                // e.g. "profile", "event", "order"
  target_id?: string | null;                  // stringified id of the target
  details?: Record<string, unknown> | null;   // free-form context blob
  req?: NextRequest;                          // for IP header extraction
}

function clientIp(req?: NextRequest): string | null {
  if (!req) return null;
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip") ?? req.ip ?? null;
}

/**
 * Insert an audit event. Fire-and-forget: swallows all errors so a
 * logging failure never surfaces to the user or blocks the caller.
 * Callers can `await` this (returns quickly) or drop it with .catch(() => {}).
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await (admin.from("audit_log") as any).insert({
      user_id:     entry.userId,
      action:      entry.action,
      target_type: entry.target_type ?? null,
      target_id:   entry.target_id != null ? String(entry.target_id) : null,
      details:     entry.details ?? null,
      ip_address:  clientIp(entry.req),
    });
  } catch {
    // Never throw from an audit helper.
  }
}
