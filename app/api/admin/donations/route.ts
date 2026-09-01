import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return { error: "Unauthorized" as const };
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return { error: "Unauthorized" as const };
  return { userId };
}

export async function GET() {
  const gate = requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: 401 });

  const supabase = createAdminClient();
  const { data: donations, error } = await supabase
    .from("donations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!donations?.length) return NextResponse.json({ donations: [] });

  const userIds = [...new Set(donations.map((d: any) => d.user_id).filter(Boolean))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, email")
    .in("id", userIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
  const merged = donations.map((d: any) => ({ ...d, profiles: profileMap[d.user_id] ?? null }));

  return NextResponse.json({ donations: merged });
}

// PATCH — admins confirm/decline a manual donation. Body: { id, action: "complete" | "cancel", manual_reference? }
export async function PATCH(req: NextRequest) {
  const gate = requireAdmin();
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: 401 });

  const { id, action, manual_reference } = await req.json();
  if (!id || !["complete", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Missing id or invalid action" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: donation, error: fetchErr } = await (supabase.from("donations") as any)
    .select("id, user_id, amount, donation_amount, is_manual, status")
    .eq("id", id)
    .single();
  if (fetchErr || !donation) return NextResponse.json({ error: "Donation not found" }, { status: 404 });
  if (!donation.is_manual) return NextResponse.json({ error: "This endpoint is for manual donations only" }, { status: 400 });

  const payload: Record<string, any> = { status: action === "complete" ? "completed" : "cancelled" };
  if (manual_reference) payload.manual_reference = manual_reference;

  const { data: updated, error: updErr } = await (supabase.from("donations") as any)
    .update(payload).eq("id", id).select().single();
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Notify the donor
  if (donation.user_id) {
    const title = action === "complete" ? "Donation confirmed" : "Donation cancelled";
    const message = action === "complete"
      ? `Thank you! Your ₱${Number(donation.donation_amount ?? donation.amount).toLocaleString()} donation is confirmed.`
      : "We couldn't verify your manual donation. Reach out to support if this is unexpected.";
    await (supabase.from("notifications") as any).insert({
      user_id: donation.user_id,
      type: "donation_ack",
      title,
      message,
      link: "/members/donations",
      is_read: false,
    });
  }

  await logAudit({
    userId: gate.userId!,
    action: action === "complete" ? "complete_manual_donation" : "cancel_manual_donation",
    target_type: "donation",
    target_id: id,
    details: { amount: donation.donation_amount ?? donation.amount, manual_reference: manual_reference ?? null },
    req,
  });

  return NextResponse.json({ donation: updated });
}
