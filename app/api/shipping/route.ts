import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const db = () => createAdminClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const weight = searchParams.get("weight");

  // Calculate shipping for a specific region + weight.
  //
  // This used to match with .lt(weight_from, w).gte(weight_to, w) and treat
  // *any* miss as "over the heaviest band". A weight of 0 matches no band
  // (weight_from 0 < 0 is false), so a zero-weight cart was billed the
  // heaviest rate — ₱425 instead of ₱125 in Metro Manila. An unknown region
  // fell through the same path and silently returned 0, i.e. free shipping.
  // Both cases are now distinguished explicitly.
  if (region && weight) {
    const w = Number.parseFloat(weight);
    const { data: bandsRaw, error } = await (db() as any)
      .from("shipping_rates")
      .select("rate, weight_from, weight_to")
      .eq("region", region)
      .eq("is_active", true)
      .order("weight_from", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const bands = (bandsRaw ?? []) as { rate: number; weight_from: number; weight_to: number }[];
    if (!bands.length) {
      return NextResponse.json({ error: `No shipping rates configured for "${region}".` }, { status: 400 });
    }

    // Weightless or unparseable: bill the lightest band, never the heaviest.
    if (!Number.isFinite(w) || w <= 0) {
      return NextResponse.json({ rate: bands[0].rate });
    }

    const match = bands.find(b => w > b.weight_from && w <= b.weight_to);
    if (match) return NextResponse.json({ rate: match.rate });

    // Genuinely above the heaviest band — the original intent of the fallback.
    return NextResponse.json({ rate: bands[bands.length - 1].rate });
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
