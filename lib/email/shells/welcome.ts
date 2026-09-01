// Fixed HTML shell for the welcome email (member onboarding).
// The brand wrapper is locked; admins edit headline, welcome message,
// what-to-do-next list, and footer signoff.

import { applyVars } from "@/lib/email";

export interface WelcomeVars {
  member_name: string;
  site_url:    string;
}

export interface WelcomeSections {
  headline_text:    string;
  intro_html:       string;
  next_steps_html:  string;
  footer_html:      string;
}

export function renderWelcome(vars: WelcomeVars, sections: WelcomeSections): string {
  const asVars = vars as unknown as Record<string, string>;
  const s = {
    headline_text:   applyVars(sections.headline_text   ?? "", asVars),
    intro_html:      applyVars(sections.intro_html      ?? "", asVars),
    next_steps_html: applyVars(sections.next_steps_html ?? "", asVars),
    footer_html:     applyVars(sections.footer_html     ?? "", asVars),
  };

  return `<div style="background:#0F1A0B;padding:32px;font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#3CCE2A;font-size:28px;letter-spacing:4px;margin:0;">CFS</h1>
    <p style="color:#8AAA78;margin:4px 0;">Colet Fan Suporta</p>
  </div>

  <div style="background:#1A2614;border:2px solid #2C4820;border-radius:12px;padding:24px;">
    <h2 style="color:#F0EAD6;font-size:20px;letter-spacing:2px;margin:0 0 12px;">${s.headline_text}</h2>
    <div style="color:#8AAA78;font-size:14px;line-height:1.6;margin:0 0 12px;">${s.intro_html}</div>
    <div style="color:#F0EAD6;font-size:14px;line-height:1.8;margin:0;">${s.next_steps_html}</div>
  </div>

  <p style="color:#5A7A50;font-size:12px;text-align:center;margin-top:20px;line-height:1.6;">${s.footer_html}</p>
</div>`;
}
