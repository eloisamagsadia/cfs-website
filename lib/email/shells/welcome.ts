// Fixed HTML shell for the welcome email (member onboarding).
// Matches the event_ticket palette: cream background, white brand card,
// forest green accents, Georgia serif headings. Locked layout — admins
// edit only headline_text, intro_html, next_steps_html, footer_html.

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

  return `<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">

    <!-- Brand mark (locked) -->
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:4px;color:#1B3A2D;">CFS</div>
      <div style="font-size:11px;letter-spacing:3px;color:#5A7A60;margin-top:2px;">COLET FAN SUPORTA</div>
    </div>

    <!-- Card (locked shell) -->
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">
      <!-- Accent stripe -->
      <div style="height:8px;background:linear-gradient(90deg,#1A8040 0%,#F5C82A 55%,#E88C4A 100%);"></div>

      <div style="padding:30px 28px 24px;text-align:center;">
        <div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">JOIN THE FAM ✦</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#1B3A2D;margin:14px 0 10px;">${s.headline_text}</h1>
      </div>

      <div style="padding:0 28px 28px;">
        <div style="font-size:14px;color:#3A5A30;line-height:1.7;margin:0 0 18px;">
          ${s.intro_html}
        </div>

        <div style="background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:12px;padding:18px 20px;color:#1B3A2D;font-size:14px;line-height:1.8;">
          ${s.next_steps_html}
        </div>
      </div>
    </div>

    <!-- Footer (locked) -->
    <div style="text-align:center;padding:22px 8px 4px;font-size:11px;color:#7A8E7A;line-height:1.7;">
      ${s.footer_html}<br/>
      <a href="${vars.site_url}" style="color:#1A8040;text-decoration:none;">coletfs.com</a> &nbsp;·&nbsp; @coletfansuporta
    </div>

  </div>
</div>`;
}
