import { clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Make sure a profile row exists for the given Clerk userId.
 * If the row is already there, returns it unchanged.
 * If missing, pulls the user from Clerk and upserts a minimal profile.
 * Returns null only if the userId doesn't exist in Clerk either.
 */
export async function ensureProfile(userId: string): Promise<any | null> {
  if (!userId) return null;
  const admin = createAdminClient();

  const { data: existing } = await (admin as any)
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (existing) return existing;

  // Backfill: fetch from Clerk. If Clerk doesn't know them, give up.
  try {
    const u = await clerkClient.users.getUser(userId);
    if (!u) return null;

    const email       = u.emailAddresses?.[0]?.emailAddress ?? "";
    const displayName = [u.firstName, u.lastName].filter(Boolean).join(" ")
                     || u.username
                     || email.split("@")[0]
                     || "Member";

    const { data, error } = await (admin as any)
      .from("profiles")
      .upsert({
        id: userId,
        email,
        display_name: displayName,
        avatar_url: u.imageUrl ?? null,
        role: "member",
        is_public: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[ensureProfile] upsert failed for", userId, error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("[ensureProfile] Clerk lookup failed for", userId, err);
    return null;
  }
}
