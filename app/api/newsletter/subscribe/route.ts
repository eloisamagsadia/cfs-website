import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/newsletter/subscribe  { email, source? }  — public
export async function POST(req: NextRequest) {
  const { userId } = auth();

  const body = await req.json().catch(() => ({}));
  const email  = String(body?.email ?? "").trim().toLowerCase();
  const source = String(body?.source ?? "footer").trim().slice(0, 60) || "footer";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
          ?? req.headers.get("x-real-ip")
          ?? null;

  const admin = createAdminClient();

  // If it exists but was unsubscribed, revive it. Otherwise upsert.
  const { data: existing } = await (admin as any)
    .from("newsletter_subscribers")
    .select("id, unsubscribed_at")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (!existing.unsubscribed_at) return NextResponse.json({ ok: true, already: true });
    await (admin as any).from("newsletter_subscribers")
      .update({ unsubscribed_at: null, subscribed_at: new Date().toISOString(), source, user_id: userId ?? null, opt_in_ip: ip })
      .eq("id", existing.id);
    return NextResponse.json({ ok: true, resubscribed: true });
  }

  const { error } = await (admin as any).from("newsletter_subscribers").insert({
    email, source, user_id: userId ?? null, opt_in_ip: ip,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, created: true });
}
