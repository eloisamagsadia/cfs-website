// Shared "Letters from Colet" fetcher — pulls the Medium RSS feed and
// parses it. Used by both /api/letters and by any server component
// that needs to embed the latest letter (homepage hero, letters page).

export const LETTERS_MEDIUM_RSS = "https://medium.com/feed/@lettersfromcolet";
export const LETTERS_MEDIUM_URL = "https://medium.com/@lettersfromcolet";

export interface Letter {
  title: string;
  link: string;
  pubDate: string;
  slug: string;
  thumbnail: string | null;
  excerpt: string;
  content: string;
  tags: string[];
}

function extractImage(content: string): string | null {
  const match = content.match(/<img[^>]+src="([^"]+)"/);
  return match?.[1] ?? null;
}

function extractExcerpt(content: string, len = 200): string {
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text.slice(0, len) + (text.length > len ? "…" : "");
}

function makeSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function cleanContent(content: string): string {
  // Strip Medium tracking pixel
  return content.replace(/<img[^>]+medium\.com\/_\/stat[^>]+>/g, "").trim();
}

function parseRSS(xml: string): Letter[] {
  const items: Letter[] = [];
  const itemMatches = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g));

  for (const match of itemMatches) {
    const item = match[1];
    const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ?? "";
    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";
    const content = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1] ?? "";
    const categories: string[] = [];
    for (const cat of Array.from(item.matchAll(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/g))) categories.push(cat[1]);

    items.push({
      title, link, pubDate,
      slug: makeSlug(title),
      thumbnail: extractImage(content),
      excerpt: extractExcerpt(content),
      content: cleanContent(content),
      tags: categories,
    });
  }
  return items;
}

/**
 * Fetch + parse the letters feed. Cached for 1 hour via Next.js.
 * Returns an empty array on any failure — callers shouldn't need to
 * handle errors, they just get nothing to render.
 */
export async function getColetLetters(): Promise<Letter[]> {
  try {
    const res = await fetch(LETTERS_MEDIUM_RSS, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml);
  } catch {
    return [];
  }
}

export async function getLatestColetLetter(): Promise<Letter | null> {
  const letters = await getColetLetters();
  return letters[0] ?? null;
}
