import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await (supabase.from("donation_drives") as any)
    .select("id, slug, name, category, description, target_amount, cover_url, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message, drives: [] }, { status: 500 });
  return NextResponse.json({ drives: data ?? [] });
}
