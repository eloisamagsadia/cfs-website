import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = new URL(req.url).searchParams.get("type");

  if (type === "comments") {
    const { data, error } = await (db() as any)
      .from("community_comments")
      .select("id, content, created_at, post_id")
      .eq("user_id", userId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ comments: data ?? [] });
  }

  if (type === "reactions") {
    const { data, error } = await (db() as any)
      .from("community_reactions")
      .select("id, reaction_type, created_at, post_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reactions: data ?? [] });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
