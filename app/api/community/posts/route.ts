import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const admin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();

  let query = admin()
    .from("community_posts")
    .select(`
      *,
      profiles:user_id(id, display_name, avatar_url),
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
  const { content, category_id, images } = body;

  if (!content?.trim() && (!images || images.length === 0)) {
    return NextResponse.json({ error: "Post cannot be empty" }, { status: 400 });
  }

  const db = admin();

  const { data: post, error } = await db
    .from("community_posts")
    .insert({
      user_id: userId,
      content: content?.trim() ?? "",
      category_id: category_id ?? null,
      images: images ?? [],
      is_hidden: false,
      is_pinned: false,
    })
    .select(`
      *,
      profiles:user_id(id, display_name, avatar_url),
      community_reactions(id, user_id, reaction_type),
      community_comments(id),
      community_reposts(user_id)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post });
}