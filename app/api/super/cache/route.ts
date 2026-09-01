import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { logAudit } from "@/lib/audit";

async function requireSuper() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "super_admin") return null;
  return userId;
}

// Whitelisted paths so admins can't be tricked into invalidating arbitrary
// routes. Each entry can be a fixed path or a "layout"/"page" invalidation.
const ALLOWED = new Set<string>([
  "/", "/events", "/shop", "/donate", "/reports", "/projects", "/terms",
  "/members", "/members/community", "/members/events", "/members/tickets",
  "/members/orders", "/members/donations",
  "/admin", "/admin/events", "/super",
]);

export async function POST(req: NextRequest) {
  const userId = await requireSuper();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { paths, tag } = await req.json();

  const results: { path: string; ok: boolean; error?: string }[] = [];

  if (Array.isArray(paths)) {
    for (const raw of paths) {
      const p = String(raw ?? "").trim();
      if (!p) continue;
      if (!ALLOWED.has(p)) {
        results.push({ path: p, ok: false, error: "not in allowlist" });
        continue;
      }
      try {
        revalidatePath(p, "page");
        results.push({ path: p, ok: true });
      } catch (e: any) {
        results.push({ path: p, ok: false, error: e?.message ?? "revalidate failed" });
      }
    }
  }

  if (typeof tag === "string" && tag.trim()) {
    try {
      revalidateTag(tag.trim());
      results.push({ path: `tag:${tag}`, ok: true });
    } catch (e: any) {
      results.push({ path: `tag:${tag}`, ok: false, error: e?.message ?? "revalidate failed" });
    }
  }

  await logAudit({
    userId,
    action: "cache_invalidate",
    target_type: "cache",
    details: { results },
    req,
  });

  return NextResponse.json({ results });
}
