import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return userId;
}

// GET /api/admin/polls  → all polls with options + vote counts
export async function GET() {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const [pollsRes, optsRes, votesRes] = await Promise.all([
    (admin as any).from("polls").select("*").order("created_at", { ascending: false }),
    (admin as any).from("poll_options").select("*").order("sort_order"),
    (admin as any).from("poll_votes").select("poll_id, option_id"),
  ]);
  if (pollsRes.error) return NextResponse.json({ error: pollsRes.error.message }, { status: 500 });

  const optionsByPoll: Record<string, any[]> = {};
  for (const o of (optsRes.data as any[]) ?? []) (optionsByPoll[o.poll_id] ??= []).push({ ...o, vote_count: 0 });

  const optionMap: Record<string, any> = {};
  for (const list of Object.values(optionsByPoll)) for (const o of list) optionMap[o.id] = o;
  for (const v of (votesRes.data as any[]) ?? []) if (optionMap[v.option_id]) optionMap[v.option_id].vote_count++;

  const polls = (pollsRes.data as any[]).map(p => ({
    ...p,
    options: optionsByPoll[p.id] ?? [],
    total_votes: (optionsByPoll[p.id] ?? []).reduce((n, o) => n + o.vote_count, 0),
  }));
  return NextResponse.json({ polls });
}

// POST /api/admin/polls  { question, description?, category?, is_published?, ends_at?, results_visible?, options: string[] }
export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { question, description, category, is_published, ends_at, results_visible, options } = body ?? {};
  if (!question?.trim()) return NextResponse.json({ error: "Question required" }, { status: 400 });
  const opts = ((options as string[]) ?? []).map(s => (s ?? "").trim()).filter(Boolean);
  if (opts.length < 2) return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: poll, error: pErr } = await (admin as any)
    .from("polls")
    .insert({
      question: question.trim(),
      description: (description ?? "").trim() || null,
      category: (category ?? "general").trim() || "general",
      is_published: !!is_published,
      ends_at: ends_at || null,
      results_visible: results_visible ?? "always",
      created_by: userId,
    })
    .select().single();
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const rows = opts.map((label, i) => ({ poll_id: (poll as any).id, label, sort_order: i }));
  const { error: oErr } = await (admin as any).from("poll_options").insert(rows);
  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

  await logAudit({ userId, action: "create_poll", target_type: "poll", target_id: (poll as any).id, details: { question: question.trim().slice(0, 120), option_count: opts.length }, req });
  return NextResponse.json({ poll });
}

// PATCH /api/admin/polls  { id, is_published?, question?, description?, ends_at?, results_visible? }
export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...rest } = body ?? {};
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  for (const k of ["question", "description", "category", "is_published", "ends_at", "results_visible"] as const) {
    if (rest[k] !== undefined) patch[k] = rest[k];
  }

  const admin = createAdminClient();
  const { data, error } = await (admin as any).from("polls").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "update_poll", target_type: "poll", target_id: id, details: patch, req });
  return NextResponse.json({ poll: data });
}

// DELETE /api/admin/polls?id=...  (cascades to options + votes)
export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await (admin as any).from("polls").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "delete_poll", target_type: "poll", target_id: id, req });
  return NextResponse.json({ ok: true });
}
