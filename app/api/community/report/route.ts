import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

const VALID_REASONS = ["spam", "harassment", "hate", "nsfw", "misinformation", "off_topic", "other"] as const;

/**
 * Any signed-in member can file a report on a post or comment.
 * Rate-limited by DB unique-ish check: same reporter + target within
 * an hour is treated as a duplicate and silently OK.
 */
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { post_id, comment_id, reason, note } = body;

  if (!post_id && !comment_id) return NextResponse.json({ error: "post_id or comment_id required" }, { status: 400 });
  if (!VALID_REASONS.includes(reason)) return NextResponse.json({ error: "Invalid reason" }, { status: 400 });

  const admin = createAdminClient();

  // Silent dedupe: if this reporter reported this target in the last hour, ignore
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: dupe } = await (admin as any)
    .from("community_reports")
    .select("id")
    .eq("reporter_id", userId)
    .gte("created_at", hourAgo)
    .or(post_id ? `post_id.eq.${post_id}` : `comment_id.eq.${comment_id}`)
    .maybeSingle();
  if (dupe) return NextResponse.json({ ok: true, dedup: true });

  const row: Record<string, any> = {
    reporter_id: userId,
    reason: note ? `${reason}: ${String(note).slice(0, 500)}` : reason,
    status: "pending",
  };
  if (post_id) row.post_id = post_id;
  if (comment_id) row.comment_id = comment_id;

  const { data, error } = await (admin as any).from("community_reports").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId,
    action: "report_content",
    target_type: post_id ? "community_post" : "community_comment",
    target_id: post_id ?? comment_id,
    details: { reason, report_id: (data as any)?.id },
    req,
  });

  return NextResponse.json({ report: data }, { status: 201 });
}
