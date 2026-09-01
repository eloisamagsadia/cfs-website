import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/emails/resend";
import { applyVars } from "@/lib/email";
import { logAudit } from "@/lib/audit";

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

const VALID_ROLES = ["super_admin", "admin", "moderator", "sponsor", "member"];
const MAX_BATCH = 500;

export async function POST(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized — super admin only" }, { status: 403 });

  const body = await req.json();
  const { action, member_ids } = body;

  if (!Array.isArray(member_ids) || member_ids.length === 0)
    return NextResponse.json({ error: "member_ids array required" }, { status: 400 });
  if (member_ids.length > MAX_BATCH)
    return NextResponse.json({ error: `Batch too large. Max ${MAX_BATCH} per request.` }, { status: 400 });

  const ids: string[] = member_ids.filter(Boolean).map(String);
  const admin = createAdminClient();

  switch (action) {
    case "assign_role": {
      const newRole = String(body.role ?? "");
      if (!VALID_ROLES.includes(newRole)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      // Super admin can assign any role including admin/super_admin — but never demote/promote themselves via bulk
      const safeIds = ids.filter(id => id !== userId);
      let clerkOk = 0, clerkErr = 0;
      for (const id of safeIds) {
        try {
          await clerkClient.users.updateUserMetadata(id, { publicMetadata: { role: newRole } });
          clerkOk++;
        } catch { clerkErr++; }
      }
      const { error: dbErr } = await (admin as any).from("profiles").update({ role: newRole }).in("id", safeIds);
      if (dbErr) return NextResponse.json({ error: dbErr.message, clerk_ok: clerkOk, clerk_err: clerkErr }, { status: 500 });
      await logAudit({ userId, action: "bulk_assign_role", target_type: "profiles", details: { new_role: newRole, count: safeIds.length, clerk_ok: clerkOk, clerk_err: clerkErr, skipped_self: ids.length - safeIds.length }, req });
      return NextResponse.json({ ok: true, updated: safeIds.length, clerk_ok: clerkOk, clerk_err: clerkErr, skipped_self: ids.length - safeIds.length });
    }

    case "ban":
    case "unban": {
      const banned = action === "ban";
      const safeIds = ids.filter(id => id !== userId);
      const { error } = await (admin as any).from("profiles").update({ is_banned: banned }).in("id", safeIds);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logAudit({ userId, action: banned ? "bulk_ban" : "bulk_unban", target_type: "profiles", details: { count: safeIds.length, skipped_self: ids.length - safeIds.length }, req });
      return NextResponse.json({ ok: true, updated: safeIds.length, skipped_self: ids.length - safeIds.length });
    }

    case "email": {
      const subject = String(body.subject ?? "").trim();
      const html    = String(body.html ?? body.message ?? "").trim();
      if (!subject || !html) return NextResponse.json({ error: "subject and html required" }, { status: 400 });

      const { data: profiles } = await (admin as any).from("profiles").select("id, display_name, email").in("id", ids);
      const targets = (profiles ?? []).filter((p: any) => p.email);

      const FROM      = process.env.RESEND_FROM_EMAIL ?? "noreply@coletfs.com";
      const FROM_NAME = process.env.RESEND_FROM_NAME ?? "Colet Fan Suporta";

      let sent = 0, failed = 0;
      const errors: string[] = [];
      for (const p of targets) {
        try {
          const name = p.display_name ?? "there";
          const vars = { name, email: p.email };
          const subj = applyVars(String(subject).replace(/\[NAME\]/g, name), vars, { plaintext: true });
          const body = applyVars(String(html).replace(/\[NAME\]/g, name), vars);
          await resend.emails.send({ from: `${FROM_NAME} <${FROM}>`, to: p.email, subject: subj, html: body });
          sent++;
        } catch (e: any) { failed++; if (errors.length < 5) errors.push(`${p.email}: ${e?.message ?? "unknown"}`); }
      }
      await logAudit({ userId, action: "bulk_email", target_type: "profiles", details: { subject: subject.slice(0, 200), target_count: targets.length, sent, failed }, req });
      return NextResponse.json({ ok: true, sent, failed, missing_email: ids.length - targets.length, sample_errors: errors });
    }

    case "export": {
      const { data: profiles } = await (admin as any)
        .from("profiles")
        .select("id, display_name, email, role, is_banned, created_at")
        .in("id", ids);
      const rows = (profiles ?? []) as any[];

      const csvEscape = (v: any) => {
        if (v == null) return "";
        const s = String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const header = ["id", "display_name", "email", "role", "is_banned", "created_at"];
      const csv = [header.join(","), ...rows.map(r => header.map(h => csvEscape(r[h])).join(","))].join("\n");

      await logAudit({ userId, action: "bulk_export", target_type: "profiles", details: { count: rows.length }, req });
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="members-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    default:
      return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
  }
}
