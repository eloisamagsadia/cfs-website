import { clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Special member_tag name treated as the "event staff" flag driver.
// Assigning this tag to a member grants them check-in access;
// removing it revokes. Kept in one place so the API endpoints stay in sync.
export const EVENT_STAFF_TAG_NAME = "Event Volunteer";

export function isEventStaffTag(tagName: string | null | undefined): boolean {
  return !!tagName && tagName.trim().toLowerCase() === EVENT_STAFF_TAG_NAME.toLowerCase();
}

// Flip publicMetadata.is_event_staff on Clerk AND mirror to
// profiles.is_event_staff. Used by:
//   /api/admin/members/event-staff    (direct toggle from the modal)
//   /api/admin/members/tags           (auto-flip when the tag changes)
export async function syncEventStaffFlag(targetUserId: string, enable: boolean) {
  try {
    const clerkUser = await clerkClient.users.getUser(targetUserId);
    const existingMeta = (clerkUser.publicMetadata ?? {}) as Record<string, unknown>;
    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: { ...existingMeta, is_event_staff: enable },
    });
  } catch (e: any) {
    return { ok: false, error: `Clerk update failed: ${e?.message ?? "unknown"}` };
  }
  const admin = createAdminClient();
  await (admin.from("profiles") as any).update({ is_event_staff: enable }).eq("id", targetUserId);
  return { ok: true };
}
