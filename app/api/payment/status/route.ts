import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const ref  = searchParams.get("ref");
  if (!type || !ref) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const supabase = createAdminClient();

  if (type === "donation") {
    const { data } = await (supabase.from("donations") as any)
      .select("status, amount").eq("id", ref).eq("user_id", userId).maybeSingle();
    return NextResponse.json({ status: data?.status ?? "pending", amount: data?.amount });
  }

  if (type === "ticket") {
    // For bundle purchases, `ref` is the bundle_id (shared across N tickets).
    // For legacy solo purchases, `ref` is the ticket.id. Try bundle_id first,
    // fall back to id. All tickets in a bundle share status/payment_status
    // so reading the first row is enough.
    let row: any = null;
    const byBundle = await (supabase.from("event_tickets") as any)
      .select("status, payment_status").eq("bundle_id", ref).eq("user_id", userId).limit(1);
    if (byBundle.data?.length) row = byBundle.data[0];
    else {
      const byId = await (supabase.from("event_tickets") as any)
        .select("status, payment_status").eq("id", ref).eq("user_id", userId).maybeSingle();
      row = byId.data ?? null;
    }
    return NextResponse.json({ status: row?.payment_status === "paid" ? "completed" : (row?.payment_status ?? "pending") });
  }

  if (type === "order") {
    const { data } = await (supabase.from("orders") as any)
      .select("payment_status").eq("id", ref).eq("user_id", userId).maybeSingle();
    return NextResponse.json({ status: data?.payment_status === "paid" ? "completed" : (data?.payment_status ?? "pending") });
  }

  return NextResponse.json({ status: "pending" });
}
