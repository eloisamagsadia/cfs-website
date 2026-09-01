import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/newsletter/unsubscribe?token=UUID  → HTML confirmation page
// Idempotent: safe to hit multiple times.
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return htmlResponse(400, "Missing unsubscribe token.");

  const admin = createAdminClient();
  const { data: sub, error } = await (admin as any)
    .from("newsletter_subscribers")
    .select("id, email, unsubscribed_at")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (error) return htmlResponse(500, "Something went wrong. Please try again.");
  if (!sub)  return htmlResponse(404, "This unsubscribe link is invalid or expired.");

  if (!sub.unsubscribed_at) {
    await (admin as any).from("newsletter_subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("id", sub.id);
  }

  return htmlResponse(200, `You have been unsubscribed.<br/><br/><small>${sub.email}</small><br/><br/>Changed your mind? <a href="/">Head back to coletfansuporta.com</a>.`);
}

function htmlResponse(status: number, message: string) {
  return new NextResponse(
    `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Unsubscribe · Colet Fan Suporta</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { background: #FAF6EE; color: #1B3A2D; font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 60px 20px; display: flex; align-items: flex-start; justify-content: center; }
    .card { max-width: 460px; background: #ffffff; border: 1px solid #DDE8DD; border-radius: 14px; padding: 32px; text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,0.04); }
    h1 { font-size: 20px; letter-spacing: 3px; margin: 0 0 6px; color: #156530; }
    p { font-size: 14px; line-height: 1.6; margin: 12px 0; }
    a { color: #1A8040; }
    small { color: #5A7A60; font-size: 12px; }
    .stripe { height: 4px; background: linear-gradient(90deg,#156530 0%,#1A8040 50%,#4ACB6E 100%); border-radius: 2px; margin: 0 auto 20px; max-width: 80px; }
  </style></head>
  <body><div class="card"><div class="stripe"></div><h1>COLET FAN SUPORTA</h1><p>${message}</p></div></body>
</html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
