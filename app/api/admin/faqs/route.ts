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

export async function GET() {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("faqs")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ faqs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category, question, answer, sort_order, is_published } = body ?? {};
  if (!question?.trim() || !answer?.trim())
    return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("faqs")
    .insert({
      category: (category ?? "general").trim() || "general",
      question: question.trim(),
      answer:   answer.trim(),
      sort_order:   Number.isFinite(+sort_order) ? +sort_order : 0,
      is_published: is_published !== false,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "create_faq", target_type: "faq", target_id: (data as any).id, details: { question: question.trim().slice(0, 120), category }, req });
  return NextResponse.json({ faq: data });
}

export async function PATCH(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...rest } = body ?? {};
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_by: userId };
  for (const k of ["category", "question", "answer", "sort_order", "is_published"] as const) {
    if (rest[k] !== undefined) patch[k] = rest[k];
  }

  const admin = createAdminClient();
  const { data, error } = await (admin as any).from("faqs").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "update_faq", target_type: "faq", target_id: id, details: patch, req });
  return NextResponse.json({ faq: data });
}

export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await (admin as any).from("faqs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({ userId, action: "delete_faq", target_type: "faq", target_id: id, req });
  return NextResponse.json({ ok: true });
}
