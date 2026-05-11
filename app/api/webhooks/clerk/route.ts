import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

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
    });

    if (error) {
      console.error("Failed to create profile:", error);
      return new Response("DB error", { status: 500 });
    }

    console.log("✓ Profile created for", id, email);
  }

  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    await supabaseAdmin.from("profiles").delete().eq("id", id);
    console.log("✓ Profile deleted for", id);
  }

  return new Response("OK", { status: 200 });
}