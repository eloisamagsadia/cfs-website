import { createAdminClient } from "@/lib/supabase/admin";

export type SiteSettings = {
  maintenance_mode: boolean | null;
  announcement_active: boolean | null;
  announcement_text: string | null;
  announcement_color: string | null;
  announcement_cta_label: string | null;
  announcement_cta_url: string | null;
  announcement_starts_at: string | null;
  announcement_ends_at: string | null;
} | null;

/**
 * Fetch the singleton site_settings row. Returns null on any failure so
 * callers can render safe fallbacks — this lookup runs on every page,
 * a DB hiccup should never brick the site.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const admin = createAdminClient();
    const { data, error } = await (admin.from("site_settings") as any)
      .select("maintenance_mode, announcement_active, announcement_text, announcement_color, announcement_cta_label, announcement_cta_url, announcement_starts_at, announcement_ends_at")
      .maybeSingle();
    if (error || !data) return null;
    return data as SiteSettings;
  } catch {
    return null;
  }
}

/**
 * Compute whether the announcement should actually render right now.
 * Respects the optional start/end window.
 */
export function isAnnouncementLive(s: SiteSettings): boolean {
  if (!s?.announcement_active) return false;
  if (!s?.announcement_text?.trim()) return false;
  const now = Date.now();
  if (s.announcement_starts_at && new Date(s.announcement_starts_at).getTime() > now) return false;
  if (s.announcement_ends_at && new Date(s.announcement_ends_at).getTime() < now) return false;
  return true;
}
