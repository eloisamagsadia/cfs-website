import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public: returns only published FAQs, ordered by category then sort_order
export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await (admin as any)
    .from("faqs")
    .select("id, category, question, answer, sort_order")
    .eq("is_published", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ faqs: data ?? [] });
}
