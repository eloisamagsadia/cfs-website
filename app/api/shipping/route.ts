import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const weight = searchParams.get("weight");

  // Calculate shipping for a specific region + weight
  if (region && weight) {
    const w = parseFloat(weight);
    const { data, error } = await (db() as any)
      .from("shipping_rates")
      .select("rate")
      .eq("region", region)
      .eq("is_active", true)
      .lt("weight_from", w)
      .gte("weight_to", w)
      .single();
    if (error || !data) {
      // If over 10kg, get the highest rate
      const { data: max } = await (db() as any)
        .from("shipping_rates")
        .select("rate")
        .eq("region", region)
        .eq("is_active", true)
        .order("weight_to", { ascending: false })
        .limit(1)
        .single();
      return NextResponse.json({ rate: max?.rate ?? 0 });
    }
    return NextResponse.json({ rate: data.rate });
  }

  // Return all rates
  const { data, error } = await (db() as any)
    .from("shipping_rates")
    .select("*")
    .order("region", { ascending: true })
    .order("weight_from", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rates: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as any)?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, rate } = await req.json();
  if (!id || rate === undefined) return NextResponse.json({ error: "Missing id or rate" }, { status: 400 });

  const { data, error } = await (db() as any)
    .from("shipping_rates")
    .update({ rate: Number(rate) })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rate: data });
}
