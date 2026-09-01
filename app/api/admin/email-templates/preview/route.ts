import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { applyVars } from "@/lib/email";
import { renderEventTicket, type EventTicketSections } from "@/lib/email/shells/event-ticket";
import { renderDonationReceipt, type DonationReceiptSections } from "@/lib/email/shells/donation-receipt";
import { renderOrderConfirmation, type OrderConfirmationSections } from "@/lib/email/shells/order-confirmation";
import { renderWelcome, type WelcomeSections } from "@/lib/email/shells/welcome";
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
    switch (key) {
      case "event_ticket":
        rendered = renderEventTicket(sample as any, resolved as unknown as EventTicketSections);
        break;
      case "donation_receipt":
        rendered = renderDonationReceipt(sample as any, resolved as unknown as DonationReceiptSections);
        break;
      case "order_confirmation":
        rendered = renderOrderConfirmation(sample as any, resolved as unknown as OrderConfirmationSections);
        break;
      case "welcome":
        rendered = renderWelcome(sample as any, resolved as unknown as WelcomeSections);
        break;
      default:
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
