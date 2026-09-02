import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Trivial in-memory rate cap per IP: 5 messages per hour.
// Good enough to slow drive-by spam; not a substitute for a real WAF.
const bucket: Map<string, { count: number; reset: number }> = (globalThis as any).__contactBucket ??= new Map();

function rateLimit(ip: string) {
  const now = Date.now();
  const cur = bucket.get(ip);
  if (!cur || cur.reset < now) {
    bucket.set(ip, { count: 1, reset: now + 60 * 60 * 1000 });
    return false;
  }
  cur.count++;
  return cur.count > 5;
}

const TOPICS = ["general", "events", "shop", "donation", "partnership", "press", "bug"];

export async function POST(req: NextRequest) {
  const { userId } = auth();
  const body = await req.json().catch(() => ({}));

  const name    = String(body?.name    ?? "").trim().slice(0, 120);
  const email   = String(body?.email   ?? "").trim().toLowerCase().slice(0, 200);
  const topic   = TOPICS.includes(body?.topic) ? body.topic : "general";
  const message = String(body?.message ?? "").trim().slice(0, 4000);
  const hp      = String(body?.company ?? "").trim(); // honeypot — real users leave it blank

  if (hp) return NextResponse.json({ ok: true }); // silently accept + drop bots
  if (!name)    return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (message.length < 10) return NextResponse.json({ error: "Message is too short." }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  if (rateLimit(ip)) return NextResponse.json({ error: "Too many messages from this address. Please try again in an hour." }, { status: 429 });

  const admin = createAdminClient();
  const { error } = await (admin as any).from("contact_messages").insert({ name, email, topic, message, ip, user_id: userId ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
