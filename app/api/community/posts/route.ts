import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const admin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const IMAGE_POST_LIMIT = 10;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();

  let query = admin()
    .from("community_posts")
    .select(`
      *,
      profiles:user_id(id, display_name, avatar_url, role),
      community_reactions(id, user_id, reaction_type),
      community_comments(id),
      community_reposts(user_id),
      reposted_by:community_reposts(profiles:user_id(id, display_name))
    `)
    .eq("is_hidden", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (category) query = query.eq("category_id", category);
  if (q) query = query.ilike("content", `%${q}%`);

  const { data: posts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: posts ?? [] });
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { content, category_id, images, video_url, video_embed_url, video_platform } = body;

  if (!content?.trim() && (!images || images.length === 0) && !video_url) {
    return NextResponse.json({ error: "Post cannot be empty" }, { status: 400 });
  }

  const db = admin();
  const hasImages = images && images.length > 0;

  // ── IMAGE POST LIMIT CHECK ─────────────────────────────────────────────────
  if (hasImages) {
    const { data: profile } = await db
      .from("profiles")
      .select("image_post_count, image_post_reset_at")
      .eq("id", userId)
      .single();

    if (profile) {
      const now = new Date();
      const resetAt = new Date(profile.image_post_reset_at);
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Reset count if new month
      if (resetAt < currentMonth) {
        await db.from("profiles").update({
          image_post_count: 0,
          image_post_reset_at: currentMonth.toISOString(),
        }).eq("id", userId);
        profile.image_post_count = 0;
      }

      if (profile.image_post_count >= IMAGE_POST_LIMIT) {
        return NextResponse.json({
          error: "You've reached your 10 image posts limit for this month. Resets on the 1st!",
          image_post_count: profile.image_post_count,
          limit: IMAGE_POST_LIMIT,
        }, { status: 429 });
      }
    }
  }

  // ── INSERT POST ────────────────────────────────────────────────────────────
  const { data: post, error } = await db
    .from("community_posts")
    .insert({
      user_id: userId,
      content: content?.trim() ?? "",
      category_id: category_id ?? null,
      images: images ?? [],
      video_url: video_url ?? null,
      video_embed_url: video_embed_url ?? null,
      video_platform: video_platform ?? null,
      is_hidden: false,
      is_pinned: false,
    })
    .select(`
      *,
      profiles:user_id(id, display_name, avatar_url, role),
      community_reactions(id, user_id, reaction_type),
      community_comments(id),
      community_reposts(user_id)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── INCREMENT IMAGE POST COUNT ─────────────────────────────────────────────
  if (hasImages) {
    await db.rpc("increment_image_post_count", { uid: userId });
  }

  const { data: updatedProfile } = await db
    .from("profiles")
    .select("image_post_count")
    .eq("id", userId)
    .single();

  return NextResponse.json({
    post,
    image_post_count: updatedProfile?.image_post_count ?? null,
    image_posts_remaining: hasImages
      ? IMAGE_POST_LIMIT - (updatedProfile?.image_post_count ?? 0)
      : null,
  });
}
