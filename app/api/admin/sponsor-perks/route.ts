import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const { data } = await (db() as any)
    .from("sponsor_perks")
    .update(body)
    .eq("active", true)
    .select()
    .single();

  return NextResponse.json({ perks: data });
}
