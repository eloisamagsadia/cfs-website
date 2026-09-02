import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { isFeatureEnabled } from "@/lib/feature-flags";

// Client-side page-view tracker. Called from PageViewTracker on route changes.
// Fire-and-forget: never blocks the client, never surfaces errors.
//
// De-dupes the same path from the same actor within a 30-second window so
// refreshes and quick back/forward navigation don't spam the log.
const DEDUP_WINDOW_SECONDS = 30;

export async function POST(req: NextRequest) {
  // Master kill-switch — flip the "page_tracking_enabled" flag off from
  // /super/feature-flags if the volume becomes a problem.
  const enabled = await isFeatureEnabled("page_tracking_enabled", true);
  if (!enabled) return NextResponse.json({ ok: true, skipped: "disabled" });

  const { userId } = auth();
  const body = await req.json().catch(() => ({}));
  const path = typeof body?.path === "string" ? body.path.slice(0, 200) : null;
  const referer = typeof body?.referer === "string" ? body.referer.slice(0, 200) : null;
  const title = typeof body?.title === "string" ? body.title.slice(0, 200) : null;
  if (!path) return NextResponse.json({ ok: true, skipped: "no path" });

  // Skip obvious noise even if the client sends it (defense in depth)
  if (/^\/(api|_next|favicon|robots|sitemap)/.test(path)) {
    return NextResponse.json({ ok: true, skipped: "noise" });
  }

  // Dedup check: has this actor logged this path within the window?
  try {
    const admin = createAdminClient();
    const cutoff = new Date(Date.now() - DEDUP_WINDOW_SECONDS * 1000).toISOString();
    const identity = userId ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    let q = (admin.from("audit_log") as any)
      .select("id", { count: "exact", head: true })
      .eq("action", "visit_page")
      .gte("created_at", cutoff)
      .contains("details", { path });
    if (identity && userId) q = q.eq("user_id", identity);
    else if (identity) q = q.eq("ip_address", identity);

    const { count } = await q;
    if ((count ?? 0) > 0) return NextResponse.json({ ok: true, deduped: true });
  } catch {}

  logAudit({
    userId: userId ?? null,
    action: "visit_page",
    target_type: "page",
    target_id: path,
    details: { path, title, referer },
    req,
  });

  return NextResponse.json({ ok: true });
}
