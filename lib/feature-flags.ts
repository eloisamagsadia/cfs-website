import { createAdminClient } from "@/lib/supabase/admin";

export type FeatureFlagKey =
  | "bundles_enabled"
  | "shop_enabled"
  | "community_read_only"
  | "maintenance_banner";

/**
 * Server-side check for a feature flag. Returns fallback if the row is missing
 * or the DB call fails — never throws so callers can guard freely.
 */
export async function isFeatureEnabled(key: FeatureFlagKey, fallback = false): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await (admin.from("feature_flags") as any)
      .select("enabled")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return fallback;
    return !!data.enabled;
  } catch {
    return fallback;
  }
}
