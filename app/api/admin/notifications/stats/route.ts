import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") return null;
  return userId;
}

export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const [
    { count: total },
    { count: read },
    { data: byTypeRaw },
    { data: recent },
  ] = await Promise.all([
    (admin.from("notifications") as any).select("*", { count: "exact", head: true }),
    (admin.from("notifications") as any).select("*", { count: "exact", head: true }).eq("is_read", true),
    (admin.from("notifications") as any).select("type, is_read"),
    (admin.from("notifications") as any).select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  const totalCount = total ?? 0;
  const readCount = read ?? 0;
  const readRate = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

  // Count by type
  const typeCounts: Record<string, { total: number; read: number }> = {};
  for (const row of byTypeRaw ?? []) {
    if (!typeCounts[row.type]) typeCounts[row.type] = { total: 0, read: 0 };
    typeCounts[row.type].total++;
    if (row.is_read) typeCounts[row.type].read++;
  }

  const byType = Object.entries(typeCounts)
    .map(([type, counts]) => ({
      type,
      total: counts.total,
      read: counts.read,
      readRate: Math.round((counts.read / counts.total) * 100),
    }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({
    total: totalCount,
    read: readCount,
    unread: totalCount - readCount,
    readRate,
    byType,
    recent: recent ?? [],
  });
}
