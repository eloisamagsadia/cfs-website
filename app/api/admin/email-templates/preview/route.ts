import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { applyVars } from "@/lib/email";
import { renderEventTicket, type EventTicketSections } from "@/lib/email/shells/event-ticket";
import { resolveSections } from "@/lib/email-template-sections";
import { SAMPLE_VARS, type TemplateKey } from "@/lib/email-template-vars";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!["admin", "super_admin"].includes(role ?? "")) return null;
  return userId;
}

const VALID_KEYS: TemplateKey[] = ["event_ticket", "donation_receipt", "order_confirmation", "welcome"];

export async function POST(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, sections, html } = await req.json();
  if (!key || !VALID_KEYS.includes(key)) return NextResponse.json({ error: "Unknown template key" }, { status: 400 });

  const sample = SAMPLE_VARS[key as TemplateKey] ?? {};

  // Section-based path — render through the fixed shell for the given key.
  if (sections && typeof sections === "object") {
    const resolved = resolveSections(key, sections);
    let rendered = "";
    if (key === "event_ticket") {
      rendered = renderEventTicket(sample as any, resolved as unknown as EventTicketSections);
    } else {
      // Other templates use section-based editing but still slot into a
      // simpler shell. For now they render only the sections joined; the
      // shell for these lives inside lib/email.ts hardcoded fallback.
      rendered = Object.entries(resolved).map(([k, v]) => `<div data-section="${k}">${applyVars(v, sample as Record<string, string>)}</div>`).join("\n");
    }
    return NextResponse.json({ html: rendered });
  }

  // Raw HTML path — just apply vars.
  if (typeof html === "string") {
    return NextResponse.json({ html: applyVars(html, sample as Record<string, string>) });
  }

  return NextResponse.json({ error: "Provide sections or html" }, { status: 400 });
}
