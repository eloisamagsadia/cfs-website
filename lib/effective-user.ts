import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { IMPERSONATE_COOKIE, verifyImpersonation } from "@/lib/impersonation";

/**
 * The Clerk userId whose data should be shown/mutated by this request.
 *
 * - If the caller is signed in AND has a valid impersonation cookie whose
 *   `sa` field matches their real Clerk userId, returns the target's id.
 * - Otherwise returns the real Clerk userId, or null if not signed in.
 *
 * Callers that display "my orders / my tickets / my profile" style data
 * should use this instead of `auth().userId` so impersonation actually
 * shows the target's data. Callers that gate on role (admin/super) should
 * KEEP using auth() so the super admin retains their privileges while
 * impersonating.
 */
export function getEffectiveUserId(): string | null {
  const { userId: realId } = auth();
  if (!realId) return null;

  try {
    const token = cookies().get(IMPERSONATE_COOKIE)?.value;
    if (!token) return realId;
    const payload = verifyImpersonation(token);
    if (payload && payload.sa === realId) return payload.u;
  } catch { /* fall through */ }

  return realId;
}

/**
 * Convenience: returns { realUserId, effectiveUserId, isImpersonating, targetUserId }
 * for callers that need to render "you are viewing as X" chrome or record
 * audit trail with both identities.
 */
export function getEffectiveContext(): {
  realUserId: string | null;
  effectiveUserId: string | null;
  isImpersonating: boolean;
  targetUserId: string | null;
} {
  const { userId: realId } = auth();
  if (!realId) return { realUserId: null, effectiveUserId: null, isImpersonating: false, targetUserId: null };

  try {
    const token = cookies().get(IMPERSONATE_COOKIE)?.value;
    if (token) {
      const payload = verifyImpersonation(token);
      if (payload && payload.sa === realId) {
        return { realUserId: realId, effectiveUserId: payload.u, isImpersonating: true, targetUserId: payload.u };
      }
    }
  } catch {}

  return { realUserId: realId, effectiveUserId: realId, isImpersonating: false, targetUserId: null };
}
