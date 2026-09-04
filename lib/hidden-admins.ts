// Hidden super-admin registry.
//
// A hidden admin is an account with role='super_admin' that is deliberately
// invisible to other super_admins. Used to preserve owner-level control on
// a project handed over to a partner org, without the partner seeing the
// owner account in role management, member lists, impersonation pickers,
// or audit log actor columns.
//
// Only the hidden admin themselves sees their own actions in the audit log.
// Everyone else sees anonymized rows.
//
// Add entries as { userId, displayLabel } where userId is the Clerk user_id
// (e.g. "user_3F9MggwM10zw1qaY5j3cxbHA6pU"). The displayLabel is what shows
// in the audit log for non-owners when viewing this account's actions —
// use something generic like "System" or "Owner".

export interface HiddenAdmin {
  userId: string;
  displayLabel: string;
}

export const HIDDEN_ADMINS: HiddenAdmin[] = [
  { userId: "user_3F9MggwM10zw1qaY5j3cxbHA6pU", displayLabel: "System" },
];

const HIDDEN_IDS = new Set(HIDDEN_ADMINS.map(a => a.userId));

/** True if the given user id is a hidden super admin. */
export function isHiddenAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return HIDDEN_IDS.has(userId);
}

/**
 * Owner check — currently identical to isHiddenAdmin.
 * Extracted so endpoints have a semantically clear name to gate on
 * (impersonation, full DB backup, etc.) without confusing "owner" with
 * "any super admin".
 */
export function isOwner(userId: string | null | undefined): boolean {
  return isHiddenAdmin(userId);
}

/**
 * Anonymize an actor for display when the viewer is not themselves a
 * hidden admin. Returns null (no change) if the actor is not hidden, or
 * a generic placeholder if they are.
 */
export function labelForActor(actorId: string | null | undefined): string | null {
  if (!actorId) return null;
  const hit = HIDDEN_ADMINS.find(a => a.userId === actorId);
  return hit ? hit.displayLabel : null;
}

/**
 * Filter a list of profile-like rows, removing any hidden admins UNLESS
 * the viewer is themselves a hidden admin.
 */
export function filterHiddenFromList<T extends { id: string }>(
  rows: T[],
  viewerId: string | null | undefined,
): T[] {
  if (isHiddenAdmin(viewerId)) return rows; // owners see everyone
  return rows.filter(r => !HIDDEN_IDS.has(r.id));
}
