import { NextResponse } from "next/server";

const MEDIUM_RSS = "https://medium.com/feed/@lettersfromcolet";

function extractImage(content: string): string | null {
  const match = content.match(/<img[^>]+src="([^"]+)"/);
  return match?.[1] ?? null;
}

function extractExcerpt(content: string): string {
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text.slice(0, 200) + (text.length > 200 ? "..." : "");
}

function makeSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function cleanContent(content: string): string {
  // Remove Medium tracking pixel
  return content.replace(/<img[^>]+medium\.com\/_\/stat[^>]+>/g, "").trim();
}

function parseRSS(xml: string) {
  const items: any[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const item = match[1];

    const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ?? "";
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";
    const content = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1] ?? "";
    const categories: string[] = [];
    const catMatches = item.matchAll(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/g);
    for (const cat of catMatches) categories.push(cat[1]);

    items.push({
      title,
      link,
      pubDate,
      slug: makeSlug(title),
      thumbnail: extractImage(content),
      excerpt: extractExcerpt(content),
      content: cleanContent(content),
      tags: categories,
    });
  }

  return items;
}

export async function GET() {
  try {
    const res = await fetch(MEDIUM_RSS, {
      next: { revalidate: 3600 },
    });
    const xml = await res.text();
    const letters = parseRSS(xml);
    return NextResponse.json({ letters });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch letters" }, { status: 500 });
  }
}
