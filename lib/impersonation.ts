import { createHmac, timingSafeEqual } from "crypto";

export const IMPERSONATE_COOKIE = "cfs_as";
export const IMPERSONATE_MAX_AGE = 4 * 60 * 60; // 4-hour safety cap

/**
 * Signed impersonation cookie payload.
 * `sa` = the real super-admin's Clerk userId (must match auth() to be honored)
 * `u`  = the target's Clerk userId (matches profiles.id)
 * `iat` = issued-at unix seconds
 */
export type ImpersonationPayload = { sa: string; u: string; iat: number };

function hmacKey(): string {
  const key = process.env.CLERK_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Neither CLERK_SECRET_KEY nor SUPABASE_SERVICE_ROLE_KEY is set — cannot sign impersonation token");
  return key;
}

export function signImpersonation(payload: ImpersonationPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig  = createHmac("sha256", hmacKey()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyImpersonation(token: string): ImpersonationPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig  = token.slice(dot + 1);
  const expected = createHmac("sha256", hmacKey()).update(body).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  let payload: ImpersonationPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
  if (typeof payload?.sa !== "string" || typeof payload?.u !== "string" || typeof payload?.iat !== "number") return null;
  if (Date.now() / 1000 - payload.iat > IMPERSONATE_MAX_AGE) return null;
  return payload;
}
