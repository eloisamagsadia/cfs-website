import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/polls  → published polls + my vote per poll
export async function GET() {
  const { userId } = auth();
  const admin = createAdminClient();

  const [pollsRes, optsRes, votesRes, myVotesRes] = await Promise.all([
    (admin as any).from("polls").select("*").eq("is_published", true).order("created_at", { ascending: false }),
    (admin as any).from("poll_options").select("*").order("sort_order"),
    (admin as any).from("poll_votes").select("poll_id, option_id"),
    userId ? (admin as any).from("poll_votes").select("poll_id, option_id").eq("user_id", userId) : Promise.resolve({ data: [] }),
  ]);
  if (pollsRes.error) return NextResponse.json({ error: pollsRes.error.message }, { status: 500 });

  const optionsByPoll: Record<string, any[]> = {};
  const optionMap: Record<string, any> = {};
  for (const o of (optsRes.data as any[]) ?? []) {
    const enriched = { ...o, vote_count: 0 };
    (optionsByPoll[o.poll_id] ??= []).push(enriched);
    optionMap[o.id] = enriched;
  }
  for (const v of (votesRes.data as any[]) ?? []) if (optionMap[v.option_id]) optionMap[v.option_id].vote_count++;

  const myVoteByPoll: Record<string, string> = {};
  for (const v of (myVotesRes.data as any[]) ?? []) myVoteByPoll[v.poll_id] = v.option_id;

  const polls = (pollsRes.data as any[]).map(p => {
    const opts = optionsByPoll[p.id] ?? [];
    const total = opts.reduce((n, o) => n + o.vote_count, 0);
    const mine  = myVoteByPoll[p.id] ?? null;
    const ended = p.ends_at ? new Date(p.ends_at) < new Date() : false;
    const canSeeResults =
      p.results_visible === "always" ||
      (p.results_visible === "after_vote" && !!mine) ||
      (p.results_visible === "after_end" && ended);
    return { ...p, options: opts, total_votes: total, my_vote: mine, ended, can_see_results: canSeeResults };
  });
  return NextResponse.json({ polls });
}
