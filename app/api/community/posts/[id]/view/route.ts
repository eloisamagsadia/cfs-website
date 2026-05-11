import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Only count views from non-authors
  const { data: post } = await admin
    .from("community_posts")
    .select("user_id, view_count")
    .eq("id", params.id)
    .single();

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Don't count own views
  if (post.user_id === userId) {
    return NextResponse.json({ view_count: post.view_count ?? 0 });
  }

  const { data } = await admin
    .from("community_posts")
    .update({ view_count: (post.view_count ?? 0) + 1 })
    .eq("id", params.id)
    .select("view_count")
    .single();

  return NextResponse.json({ view_count: data?.view_count ?? 0 });
}
