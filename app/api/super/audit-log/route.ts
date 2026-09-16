import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwner } from "@/lib/hidden-admins";

const db = () => createAdminClient();

// Audit log is owner-only. The shared super_admin account cannot see
// site-wide activity — that stays with the site owner alone.
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId || !isOwner(userId)) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  // audit_log holds ~32k rows. The old hard .limit(200) meant 99% of the trail
  // was unreachable — you could never look past the newest 200 entries, with
  // nothing in the UI saying so.
  //
  // The page filters client-side (its category chips are derived from `action`
  // via a JS mapping, not a column), so true server-side paging would silently
  // narrow those filters to whatever page you happened to be on. Instead: pull
  // a much larger recent window, return the REAL total so the UI can admit what
  // it is not showing, and let the client page within it.
  //
  // `limit` is caller-adjustable up to 2000. Beyond that the joined payload
  // gets heavy enough that proper server-side filtering is the right fix, not
  // a bigger number.
  const { searchParams } = new URL(req.url);
  const limit = Math.min(2000, Math.max(50, Number(searchParams.get("limit") ?? 1000) || 1000));

  const { data: logs, count, error } = await (db() as any)
    .from("audit_log")
    // count:"exact" is what makes "newest 1,000 of 31,844" honest.
    .select("*, profiles:user_id(id, display_name, avatar_url)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(0, limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    logs: logs ?? [],
    total: count ?? 0,
    returned: (logs ?? []).length,
    limit,
  });
}
