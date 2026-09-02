import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Only count views from non-authors
  const { data: post } = await (admin as any)
    .from("community_posts")
    .select("user_id, view_count")
    .eq("id", params.id)
    .single();

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Don't count own views
  if (post.user_id === userId) {
    return NextResponse.json({ view_count: post.view_count ?? 0 });
  }

  // Atomic increment via DB function — prevents the read/modify/write race
  // where concurrent viewers would each overwrite the other's +1.
  const { data: newCount } = await (admin as any).rpc("increment_post_view_count", { pid: params.id });

  return NextResponse.json({ view_count: newCount ?? (post.view_count ?? 0) + 1 });
}
