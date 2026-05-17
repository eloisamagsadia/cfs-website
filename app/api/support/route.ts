import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as any)?.role;
  const isAdmin = ["admin", "super_admin"].includes(role ?? "");
  const { searchParams } = new URL(req.url);
  const my = searchParams.get("my");

  let query = (db() as any).from("support_tickets").select("*").order("created_at", { ascending: false });
  if (my === "true" || !isAdmin) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { subject, message, category, attachments } = await req.json();
  if (!subject?.trim() || !message?.trim()) return NextResponse.json({ error: "Subject and message required" }, { status: 400 });

  const { data, error } = await (db() as any).from("support_tickets").insert({
    user_id: userId,
    subject: subject.trim(),
    message: message.trim(),
    category: category ?? "general",
    status: "open",
    attachments: attachments ?? [],
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ticket: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as any)?.role;
  const isAdmin = ["admin", "super_admin"].includes(role ?? "");
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, priority, admin_notes } = await req.json();
  if (!id) return NextResponse.json({ error: "Ticket ID required" }, { status: 400 });

  const payload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (status) payload.status = status;
  if (priority) payload.priority = priority;
  if (admin_notes !== undefined) payload.admin_notes = admin_notes;

  const { data, error } = await (db() as any).from("support_tickets").update(payload).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify member if admin replied
  if (admin_notes && data?.user_id) {
    await (db() as any).from("notifications").insert({
      user_id: data.user_id,
      type: "support_reply",
      title: "Support Reply",
      message: `Your ticket "${data.subject}" has been updated by the team.`,
      link: "/members/support/tickets",
      is_read: false,
    });
  }

  return NextResponse.json({ ticket: data });
}
