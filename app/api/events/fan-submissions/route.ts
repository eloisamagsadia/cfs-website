import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

const admin = createAdminClient;

function detectPlatform(url: string): string {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("facebook.com")) return "facebook";
  return "other";
}

async function fetchThumbnail(url: string, platform: string): Promise<string | null> {
  try {
    if (platform === "youtube") {
      const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
      if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const eventId = req.nextUrl.searchParams.get("event_id");
  const status = req.nextUrl.searchParams.get("status") ?? "approved";
  const supabase = admin();
  const query = (supabase.from("event_fan_submissions") as any)
    .select("*")
    .order("created_at", { ascending: false });
  if (eventId) query.eq("event_id", eventId);
  if (status !== "all") query.eq("status", status);
  const { data } = await query;
  return NextResponse.json({ submissions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { event_id, url, caption } = await req.json();
  if (!event_id || !url) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const platform = detectPlatform(url);
  const thumbnail_url = await fetchThumbnail(url, platform);
  const supabase = admin();
  const { data, error } = await (supabase.from("event_fan_submissions") as any).insert({
    event_id,
    user_id: userId,
    url,
    caption,
    platform,
    thumbnail_url,
    status: "pending",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submission: data });
}

export async function PATCH(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status } = await req.json();
  const supabase = admin();
  await (supabase.from("event_fan_submissions") as any).update({ status }).eq("id", id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  const supabase = admin();
  await (supabase.from("event_fan_submissions") as any).delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
