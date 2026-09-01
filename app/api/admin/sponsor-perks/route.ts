import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data } = await (db() as any).from("sponsor_perks").select("*").single();
  return NextResponse.json({ perks: data });
}

export async function PATCH(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !["admin", "super_admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Match the row by ID if provided, otherwise fall back to the newest
  // row. Prevents the previous bug where toggling active=false made the
  // row unreachable by the old `.eq("active", true)` filter.
  const admin = db() as any;
  let target: any = null;
  if (body.id) {
    const { data } = await admin.from("sponsor_perks").select("id").eq("id", body.id).maybeSingle();
    target = data;
  }
  if (!target) {
    const { data } = await admin.from("sponsor_perks").select("id").order("created_at", { ascending: false }).limit(1).maybeSingle();
    target = data;
  }
  if (!target) return NextResponse.json({ error: "sponsor_perks row not found" }, { status: 404 });

  const { id: _id, ...updates } = body;
  const { data } = await admin
    .from("sponsor_perks")
    .update(updates)
    .eq("id", target.id)
    .select()
    .single();

  await logAudit({ userId, action: "update_sponsor_perks", target_type: "sponsor_perks", target_id: target.id, details: { fields: Object.keys(updates) }, req });

  return NextResponse.json({ perks: data });
}
