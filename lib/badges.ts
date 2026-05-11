import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Check if a user qualifies for any badges based on a trigger type
 * and award them automatically. Idempotent — safe to call multiple times.
 */
export async function checkAndAwardBadges(userId: string, triggerType: string) {
  const supabase = createAdminClient();

  // Get all badges for this trigger type
  const { data: badges } = await supabase
    .from("badges")
    .select("*")
    .eq("trigger_type", triggerType);

  if (!badges?.length) return;

  // Get current value for this trigger type
  const currentValue = await getTriggerValue(supabase, userId, triggerType);

  for (const badge of badges) {
    if (currentValue < (badge.threshold_value ?? 0)) continue;

    // Check if already earned
    const { data: existing } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badge.id)
      .single();

    if (existing) continue;

    // Award the badge!
    await supabase.from("user_badges").insert({ user_id: userId, badge_id: badge.id });

    // Send notification
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "badge_earned",
      title: `🏆 Badge Earned: ${badge.name}!`,
      message: badge.description ?? `You earned the ${badge.name} badge!`,
      link: "/members/badges",
    });

    console.log(`Awarded badge "${badge.name}" to user ${userId}`);
  }
}

async function getTriggerValue(supabase: any, userId: string, triggerType: string): Promise<number> {
  switch (triggerType) {
    case "event_count": {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("payment_status", "paid");
      return count ?? 0;
    }
    case "donation_count": {
      const { count } = await supabase
        .from("donations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed");
      return count ?? 0;
    }
    case "donation_total": {
      const { data } = await supabase
        .from("donations")
        .select("amount")
        .eq("user_id", userId)
        .eq("status", "completed");
      return (data ?? []).reduce((sum: number, d: any) => sum + Number(d.amount), 0);
    }
    case "post_count": {
      const { count } = await supabase
        .from("community_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return count ?? 0;
    }
    case "order_count": {
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("payment_status", "paid");
      return count ?? 0;
    }
    case "reactions_received": {
      const { data: posts } = await supabase
        .from("community_posts")
        .select("id")
        .eq("user_id", userId);
      if (!posts?.length) return 0;
      const postIds = posts.map((p: any) => p.id);
      const { count } = await supabase
        .from("community_reactions")
        .select("*", { count: "exact", head: true })
        .in("post_id", postIds);
      return count ?? 0;
    }
    case "tr_views": {
      return 0; // tracked separately via view events
    }
    case "member_count": {
      // Check if user was among first N members
      const { data: user } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", userId)
        .single();
      if (!user) return 0;
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .lte("created_at", user.created_at);
      return count ?? 0;
    }
    default:
      return 0;
  }
}

export const BADGE_ICONS: Record<string, string> = {
  "Early Member":      "⭐",
  "Event Goer":        "🎫",
  "Super Fan":         "🔥",
  "Donor":             "💚",
  "Generous Heart":    "💎",
  "Community Starter": "💬",
  "Active Voice":      "📢",
  "Top Supporter":     "🏆",
  "Shopper":           "🛍",
  "Report Reader":     "📋",
};

export const BADGE_COLORS: Record<string, string> = {
  "Early Member":      "#F5C82A",
  "Event Goer":        "#3CCE2A",
  "Super Fan":         "#F07228",
  "Donor":             "#3CCE2A",
  "Generous Heart":    "#8EE440",
  "Community Starter": "#F5C82A",
  "Active Voice":      "#F07228",
  "Top Supporter":     "#F5C82A",
  "Shopper":           "#F07228",
  "Report Reader":     "#3CCE2A",
};
