import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as any)?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? ""))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data: report, error } = await supabase
    .from("transparency_reports")
    .select("id, title, year, quarter, fund_breakdown")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ report });
}
