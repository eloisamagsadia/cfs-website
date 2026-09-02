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
  userId: string | null;                      // Clerk user id, or null for anonymous public actions
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

// Keys we never store raw in audit details. Anything matching one of these
// names (case-insensitive) gets replaced with a masked hint.
const PII_KEYS = new Set([
  "email", "email_address", "phone", "phone_number", "mobile",
  "address", "street", "zip", "postal_code", "zip_code",
  "card_number", "cvv", "cvc", "password", "token", "secret",
  "content", "message", "body", "text", // free-form user text — redact by default
]);

function maskString(s: string): string {
  if (!s) return s;
  if (s.length <= 4) return "***";
  if (s.includes("@")) {
    const [local, domain] = s.split("@");
    return `${local[0]}***@${domain}`;
  }
  return `${s.slice(0, 2)}***${s.slice(-2)}`;
}

/**
 * Recursively walk a details object and replace values under PII keys with
 * a masked hint. Returns a new object — never mutates the input.
 */
export function redactPii(input: unknown): unknown {
  if (input == null) return input;
  if (Array.isArray(input)) return input.map(redactPii);
  if (typeof input !== "object") return input;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (PII_KEYS.has(k.toLowerCase())) {
      out[k] = typeof v === "string" ? maskString(v) : "[redacted]";
    } else {
      out[k] = redactPii(v);
    }
  }
  return out;
}

/**
 * Insert an audit event. Fire-and-forget: swallows all errors so a
 * logging failure never surfaces to the user or blocks the caller.
 * Callers can `await` this (returns quickly) or drop it with .catch(() => {}).
 *
 * `details` is automatically redacted for PII keys (email, phone, address,
 * card_*, message content, etc.). Pass explicit safe values to bypass.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    const safeDetails = entry.details ? (redactPii(entry.details) as Record<string, unknown>) : null;
    await (admin.from("audit_log") as any).insert({
      user_id:     entry.userId,
      action:      entry.action,
      target_type: entry.target_type ?? null,
      target_id:   entry.target_id != null ? String(entry.target_id) : null,
      details:     safeDetails,
      ip_address:  clientIp(entry.req),
    });
  } catch {
    // Never throw from an audit helper.
  }
}
