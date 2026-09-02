import { createAdminClient } from "@/lib/supabase/admin";

interface PromoteResult {
  promoted: Array<{ id: string; user_id: string }>;
  failed:   number;
}

/**
 * Notify the top-N oldest 'waiting' entries for an event.
 *
 * Marks each row as 'notified', stamps notified_at, and drops one
 * in-app notification per member linking back to the event page.
 * Safe to call from any cancellation code-path — best-effort, per-row
 * failures don't abort the batch.
 */
export async function promoteNextWaitlist(eventId: string, n: number = 1): Promise<PromoteResult> {
  const count = Math.max(1, Math.min(200, Math.floor(n) || 1));
  const admin = createAdminClient();

  const { data: waiting } = await (admin as any)
    .from("event_waitlist")
    .select("id, user_id")
    .eq("event_id", eventId)
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .limit(count);

  const list = (waiting as any[]) ?? [];
  if (list.length === 0) return { promoted: [], failed: 0 };

  // Fetch event title once for the notification body.
  const { data: ev } = await (admin as any)
    .from("events").select("title").eq("id", eventId).maybeSingle();
  const eventTitle = ev?.title ?? "an event";

  const nowIso = new Date().toISOString();
  const promoted: Array<{ id: string; user_id: string }> = [];
  let failed = 0;

  for (const row of list) {
    const { error } = await (admin as any)
      .from("event_waitlist")
      .update({ status: "notified", notified_at: nowIso })
      .eq("id", row.id)
      .eq("status", "waiting");    // don't clobber if it raced to another state
    if (error) { failed++; continue; }

    if (row.user_id) {
      await (admin as any).from("notifications").insert({
        user_id: row.user_id,
        type: "event_reminder",
        title: "A spot opened up!",
        message: `A spot is available for ${eventTitle} you were waitlisted for. Register now before it fills again.`,
        link: `/events/${eventId}`,
        is_read: false,
      }).catch(() => { /* notification failure shouldn't fail the promote */ });
    }
    promoted.push({ id: row.id, user_id: row.user_id });
  }

  return { promoted, failed };
}
