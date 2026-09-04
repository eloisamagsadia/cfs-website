import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/emails/welcome";
import { sendSessionAlertEmail } from "@/lib/emails/session-alert";
import { logAudit } from "@/lib/audit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address ?? "";
    const displayName = [first_name, last_name].filter(Boolean).join(" ") || email.split("@")[0] || "Member";

    const { error } = await supabaseAdmin.from("profiles").upsert({
      id,
      email,
      display_name: displayName,
      avatar_url: image_url ?? null,
      role: "member",
      is_public: true,
    });

    if (error) {
      console.error("Failed to create profile:", error);
      return new Response("DB error", { status: 500 });
    }

    console.log("✓ Profile created for", id, email);
    logAudit({ userId: id, action: "signup", target_type: "user", target_id: id, details: { display_name: displayName, email } });

    if (email) {
      sendWelcomeEmail({ email, name: displayName }).catch(err => {
        console.error("Welcome email failed for", email, err);
      });
    }
  }

  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    await supabaseAdmin.from("profiles").delete().eq("id", id);
    console.log("✓ Profile deleted for", id);
    if (id) logAudit({ userId: id, action: "delete_account", target_type: "user", target_id: id });
  }

  // Session lifecycle → login / logout audit trail
  if (evt.type === "session.created") {
    const { user_id, id, last_active_at, latest_activity } = evt.data as any;
    if (user_id) logAudit({ userId: user_id, action: "login", target_type: "session", target_id: id ?? null });

    // Branded sign-in alert (replaces Clerk's default "New device signed in" email).
    // Disable Clerk's built-in template in the dashboard to avoid double sends.
    if (user_id && id) {
      try {
        const u = await clerkClient.users.getUser(user_id);
        const email = u.emailAddresses?.[0]?.emailAddress;
        if (email) {
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ")
                    || u.username
                    || email.split("@")[0]
                    || "there";

          // The session.created webhook payload doesn't include latest_activity
          // — Clerk fires the event the instant a session is created, before
          // any authenticated request has been logged. The SDK's typed
          // getSession() also frequently omits the activity field. Hit the
          // raw BAPI endpoint directly and retry with backoff so we give
          // Clerk's activity pipeline enough time to catch up.
          const CLERK_SECRET = process.env.CLERK_SECRET_KEY!;
          const fetchActivity = async (): Promise<any> => {
            const delays = [0, 2000, 4000, 6000]; // total ≤12s, well under Clerk's 15s webhook window
            let latest: any = null;
            for (const wait of delays) {
              if (wait) await new Promise(r => setTimeout(r, wait));
              try {
                const r = await fetch(`https://api.clerk.com/v1/sessions/${id}`, {
                  headers: { Authorization: `Bearer ${CLERK_SECRET}` },
                  cache: "no-store",
                });
                if (!r.ok) continue;
                const data: any = await r.json();
                const la = data?.latest_activity ?? data?.latestActivity ?? null;
                latest = la;
                if (la && (la.ip_address || la.city || la.country || la.browser_name || la.device_type)) {
                  return la;
                }
              } catch {}
            }
            return latest ?? {};
          };

          const laFresh = await fetchActivity();
          const la = { ...(latest_activity ?? {}), ...(laFresh ?? {}) };
          console.log("[session-alert] activity for", user_id, JSON.stringify(la));

          const browser  = la.browserName  ?? la.browser_name  ?? null;
          const device   = la.deviceType   ?? la.device_type   ?? null;
          const ip       = la.ipAddress    ?? la.ip_address    ?? null;
          const city     = la.city ?? null;
          const country  = la.country ?? null;
          const isMobile = la.isMobile ?? la.is_mobile ?? false;

          const dev = [browser, device && `on ${device}`].filter(Boolean).join(" ") || null;
          const loc = [city, country].filter(Boolean).join(", ") || null;

          await sendSessionAlertEmail({
            email,
            name,
            ip,
            device:     dev,
            location:   loc,
            signInType: isMobile ? "Mobile" : "Web",
            when:       last_active_at ? new Date(last_active_at) : new Date(),
          });
        }
      } catch (err) {
        console.error("session-alert email failed for", user_id, err);
      }
    }
  }

  if (evt.type === "session.ended" || evt.type === "session.removed" || evt.type === "session.revoked") {
    const { user_id, id } = evt.data as any;
    const action = evt.type === "session.revoked" ? "session_revoked" : "logout";
    if (user_id) logAudit({ userId: user_id, action, target_type: "session", target_id: id ?? null, details: { clerk_event: evt.type } });
  }

  return new Response("OK", { status: 200 });
}