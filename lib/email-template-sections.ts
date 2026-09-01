// Section-based email template editor config.
// Each template defines a small set of editable sections that get
// slotted into a fixed HTML shell (defined per-template in
// lib/email/shells/*). Admins edit these focused fields instead of a
// giant HTML blob — the shell's structure is protected.

export type SectionType = "text" | "rich";

export interface SectionDef {
  key: string;
  label: string;
  type: SectionType;
  help?: string;
  default: string;
}

export interface TemplateSectionsConfig {
  /** Templates without an entry here fall back to raw HTML editing only. */
  sections: SectionDef[];
}

export const TEMPLATE_SECTIONS: Partial<Record<string, TemplateSectionsConfig>> = {
  event_ticket: {
    sections: [
      {
        key: "chip_text",
        label: "Confirmation chip",
        type: "text",
        help: "Small badge above the event title.",
        default: "TICKET CONFIRMED ✦",
      },
      {
        key: "intro_html",
        label: "Optional intro",
        type: "rich",
        help: "Short paragraph shown under the event date/time. Leave blank to hide.",
        default: "",
      },
      {
        key: "reminder_html",
        label: "Before-the-event reminder",
        type: "rich",
        help: "Green reminder box shown below the buttons.",
        default: "Bring a valid ID. Doors typically open 30 minutes before start. Save this email — you&rsquo;ll need the QR or ticket ID to enter.",
      },
      {
        key: "footer_html",
        label: "Footer signoff",
        type: "rich",
        help: "Signoff at the very bottom.",
        default: "See you there, kaFAM! ♥",
      },
    ],
  },
  order_confirmation: {
    sections: [
      {
        key: "headline_text",
        label: "Order headline",
        type: "text",
        default: "ORDER CONFIRMED ✦",
      },
      {
        key: "intro_html",
        label: "Optional intro",
        type: "rich",
        help: "Shown above the item table.",
        default: "",
      },
      {
        key: "footer_html",
        label: "Footer signoff",
        type: "rich",
        default: "Thank you for supporting Colet Fan Suporta! ♥<br/>For questions, contact us on our social media channels.",
      },
    ],
  },
  donation_receipt: {
    sections: [
      {
        key: "intro_line",
        label: "Intro line",
        type: "text",
        help: "One-line thank-you at the top. Leave blank to omit.",
        default: "",
      },
      {
        key: "footer_html",
        label: "Footer signoff",
        type: "rich",
        default: "Thank you for supporting Colet! ♥<br/>Fund usage published in quarterly reports.",
      },
    ],
  },
  welcome: {
    sections: [
      {
        key: "headline_text",
        label: "Headline",
        type: "text",
        default: "WELCOME, {{member_name}} ♥",
      },
      {
        key: "intro_html",
        label: "Welcome message",
        type: "rich",
        default: "You&rsquo;re now part of the CFS fan community. Here&rsquo;s what you can do next:",
      },
      {
        key: "next_steps_html",
        label: "What to do next",
        type: "rich",
        default: "<ul><li>Browse upcoming events at <a href=\"{{site_url}}/events\">coletfs.com/events</a></li><li>Introduce yourself in the community feed</li><li>Grab your fan card from your profile</li></ul>",
      },
      {
        key: "footer_html",
        label: "Footer signoff",
        type: "rich",
        default: "Salamat sa pagsuporta kay Colet! ✦",
      },
    ],
  },
};

/** Merge user-saved values with defaults so a partial `sections` object still renders. */
export function resolveSections(templateKey: string, saved: Record<string, unknown> | null | undefined): Record<string, string> {
  const cfg = TEMPLATE_SECTIONS[templateKey];
  if (!cfg) return {};
  const out: Record<string, string> = {};
  for (const s of cfg.sections) {
    const v = saved?.[s.key];
    out[s.key] = typeof v === "string" && v.length > 0 ? v : s.default;
  }
  return out;
}
