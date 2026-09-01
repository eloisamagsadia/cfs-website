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

// GET /api/admin/newsletter?format=csv|json&scope=active|unsubscribed|all
export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url    = new URL(req.url);
  const scope  = url.searchParams.get("scope")  ?? "active";
  const format = url.searchParams.get("format") ?? "json";

  const admin = createAdminClient();
  let q = (admin as any).from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false });
  if (scope === "active")       q = q.is("unsubscribed_at", null);
  else if (scope === "unsubscribed") q = q.not("unsubscribed_at", "is", null);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data as any[]) ?? [];

  if (format === "csv") {
    const header = "email,source,subscribed_at,unsubscribed_at,user_id\n";
    const body = rows.map(r => [
      r.email,
      r.source ?? "",
      r.subscribed_at ?? "",
      r.unsubscribed_at ?? "",
      r.user_id ?? "",
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    return new NextResponse(header + body, {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="newsletter-${scope}-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ subscribers: rows });
}

// DELETE /api/admin/newsletter?id=...  → soft unsubscribe (set unsubscribed_at)
// DELETE /api/admin/newsletter?id=...&hard=1  → hard delete
export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url  = new URL(req.url);
  const id   = url.searchParams.get("id");
  const hard = url.searchParams.get("hard") === "1";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();

  if (hard) {
    const { error } = await (admin as any).from("newsletter_subscribers").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit({ userId, action: "delete_newsletter_subscriber", target_type: "newsletter_subscriber", target_id: id, req });
    return NextResponse.json({ ok: true, hard: true });
  }

  const { error } = await (admin as any)
    .from("newsletter_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAudit({ userId, action: "unsubscribe_newsletter", target_type: "newsletter_subscriber", target_id: id, req });
  return NextResponse.json({ ok: true, hard: false });
}
