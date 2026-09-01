import { createAdminClient } from "@/lib/supabase/admin";

export interface SiteAnnouncement {
  text:      string;
  color:     string | null;
  ctaLabel:  string | null;
  ctaUrl:    string | null;
}

/**
 * Load the current active site-wide announcement, or null if none.
 * Fails soft: returns null on any error so the layout never breaks.
 */
export async function loadActiveAnnouncement(): Promise<SiteAnnouncement | null> {
  try {
    const admin = createAdminClient();
    const { data } = await (admin.from("site_settings") as any)
      .select("announcement_text, announcement_active, announcement_color, announcement_cta_label, announcement_cta_url, announcement_starts_at, announcement_ends_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data?.announcement_active || !data?.announcement_text?.trim()) return null;

    const now = Date.now();
    if (data.announcement_starts_at && new Date(data.announcement_starts_at).getTime() > now) return null;
    if (data.announcement_ends_at   && new Date(data.announcement_ends_at).getTime()   <= now) return null;

    return {
      text:     data.announcement_text as string,
      color:    (data.announcement_color as string) ?? null,
      ctaLabel: (data.announcement_cta_label as string) ?? null,
      ctaUrl:   (data.announcement_cta_url   as string) ?? null,
    };
  } catch {
    return null;
  }
}
