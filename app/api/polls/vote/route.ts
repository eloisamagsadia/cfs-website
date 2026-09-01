import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/polls/vote  { poll_id, option_id }
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { poll_id, option_id } = await req.json();
  if (!poll_id || !option_id) return NextResponse.json({ error: "poll_id and option_id required" }, { status: 400 });

  const admin = createAdminClient();

  // Poll must exist, be published, and (if bounded) still open
  const { data: poll } = await (admin as any).from("polls").select("id, is_published, ends_at").eq("id", poll_id).maybeSingle();
  if (!poll || !poll.is_published) return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  if (poll.ends_at && new Date(poll.ends_at) < new Date()) return NextResponse.json({ error: "Poll has ended" }, { status: 400 });

  // Option must belong to this poll (defensive against a stale client)
  const { data: opt } = await (admin as any).from("poll_options").select("id, poll_id").eq("id", option_id).maybeSingle();
  if (!opt || opt.poll_id !== poll_id) return NextResponse.json({ error: "Option does not belong to this poll" }, { status: 400 });

  const { error } = await (admin as any)
    .from("poll_votes")
    .upsert({ poll_id, option_id, user_id: userId }, { onConflict: "poll_id,user_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/polls/vote?poll_id=...  → change your mind, remove vote
export async function DELETE(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pollId = new URL(req.url).searchParams.get("poll_id");
  if (!pollId) return NextResponse.json({ error: "poll_id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: poll } = await (admin as any).from("polls").select("ends_at").eq("id", pollId).maybeSingle();
  if (poll?.ends_at && new Date(poll.ends_at) < new Date()) return NextResponse.json({ error: "Poll has ended — can't unvote" }, { status: 400 });

  const { error } = await (admin as any).from("poll_votes").delete().eq("poll_id", pollId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
