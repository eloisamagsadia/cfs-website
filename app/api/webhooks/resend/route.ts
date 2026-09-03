import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Resend webhook receiver.
 *
 * Configure in Resend dashboard → Webhooks:
 *   Endpoint URL: https://coletfs.com/api/webhooks/resend
 *   Events: email.sent, email.delivered, email.opened, email.clicked,
 *           email.bounced, email.complained, email.delivery_delayed
 *
 * Copy the signing secret into env var RESEND_WEBHOOK_SECRET. If the
 * env var is missing we accept unsigned requests (dev convenience);
 * in production it should always be set.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const raw    = await req.text();

  let evt: any;
  if (secret) {
    const svixId = req.headers.get("svix-id");
    const svixTs = req.headers.get("svix-timestamp");
    const svixSg = req.headers.get("svix-signature");
    if (!svixId || !svixTs || !svixSg) return new NextResponse("missing signature headers", { status: 400 });
    try {
      evt = new Webhook(secret).verify(raw, { "svix-id": svixId, "svix-timestamp": svixTs, "svix-signature": svixSg });
    } catch {
      return new NextResponse("invalid signature", { status: 400 });
    }
  } else {
    try { evt = JSON.parse(raw); } catch { return new NextResponse("bad json", { status: 400 }); }
  }

  const type      = evt?.type as string | undefined;
  const messageId = evt?.data?.email_id ?? evt?.data?.id;
  const when      = evt?.created_at ? new Date(evt.created_at).toISOString() : new Date().toISOString();
  if (!type || !messageId) return NextResponse.json({ ok: true, skipped: true });

  const admin = createAdminClient();

  const patch: Record<string, unknown> = {};
  switch (type) {
    case "email.delivered":       patch.delivered_at  = when; break;
    case "email.opened":          patch.opened_at     = when; break;
    case "email.clicked":         patch.clicked_at    = when; break;
    case "email.bounced":         patch.bounced_at    = when; patch.bounce_type = evt?.data?.bounce?.type ?? "unknown"; break;
    case "email.complained":      patch.complained_at = when; break;
    case "email.delivery_delayed":                        break; // no state change, ignore
    case "email.sent":                                    break; // we already recorded sent_at in the broadcast route
    default: return NextResponse.json({ ok: true, ignored: type });
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true, noop: type });

  // Update in place; ignore rows we never saw (transactional sends we didn't track)
  const { error } = await (admin as any).from("email_deliveries").update(patch).eq("message_id", messageId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also mark the newsletter subscriber unsubscribed on hard bounce or complaint —
  // per anti-spam best practice, we stop sending to those addresses.
  if (patch.complained_at || (patch.bounced_at && patch.bounce_type === "hard")) {
    const email = evt?.data?.to?.[0] ?? evt?.data?.email;
    if (email) {
      await (admin as any).from("newsletter_subscribers")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("email", email)
        .is("unsubscribed_at", null);
    }
  }

  return NextResponse.json({ ok: true, type });
}
