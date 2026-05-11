import { resend } from "./resend";

export async function sendWelcomeEmail({ email, name }: { email: string; name: string }) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: "Welcome to Colet fan Suporta ✦",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#080F06;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#1A3D14;border:2px solid #2C4820;border-radius:10px;padding:8px 20px;">
        <span style="font-size:11px;color:#3CCE2A;letter-spacing:4px;font-weight:700;">✦ CFS · BINI COLET ✦</span>
      </div>
    </div>

    <!-- Main card -->
    <div style="background:#0F1A0B;border:2px solid #2C4820;border-radius:16px;overflow:hidden;">
      
      <!-- Green banner -->
      <div style="background:linear-gradient(135deg,#1A3D14,#243520);padding:40px 32px;text-align:center;border-bottom:2px solid #2C4820;position:relative;">
        <div style="font-size:48px;margin-bottom:12px;">💚</div>
        <h1 style="margin:0 0 8px;font-size:28px;color:#3CCE2A;letter-spacing:2px;font-weight:900;">WELCOME TO THE FAM</h1>
        <p style="margin:0;font-size:16px;color:#8AAA78;font-style:italic;">Colet Fan Suporta · Official Fan Club</p>
      </div>

      <!-- Body -->
      <div style="padding:32px;">
        <p style="margin:0 0 20px;font-size:15px;color:#9DB88A;line-height:1.8;">
          Hi <strong style="color:#F0EAD6;">${name}</strong>,
        </p>
        <p style="margin:0 0 20px;font-size:15px;color:#9DB88A;line-height:1.8;">
          You're officially part of the <strong style="color:#3CCE2A;">CFS Bini Colet Fan Club</strong> — 
          the home of Colet Fan Suporta (Iu-ers) in the Philippines. We're so glad you're here! 🎉
        </p>

        <!-- What you can do -->
        <div style="background:#1A2614;border:1px solid #2C4820;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 14px;font-size:11px;color:#3CCE2A;letter-spacing:2px;font-weight:700;">WHAT YOU CAN DO</p>
          ${[
            ["💬", "Community Feed", "Post, react, comment and connect with fellow Iu-ers"],
            ["🛍️", "Shop Merch", "Exclusive CFS merchandise for true fans"],
            ["📅", "Join Events", "Fan meetings, streaming parties and more"],
            ["⭐", "Earn Badges", "Get recognized for your fan contributions"],
          ].map(([icon, title, desc]) => `
          <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
            <span style="font-size:20px;flex-shrink:0;">${icon}</span>
            <div>
              <div style="font-size:13px;color:#F0EAD6;font-weight:700;margin-bottom:2px;">${title}</div>
              <div style="font-size:12px;color:#5A7A50;line-height:1.5;">${desc}</div>
            </div>
          </div>`).join("")}
        </div>

        <!-- CTA Button -->
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/members/community"
             style="display:inline-block;background:#3CCE2A;color:#080F06;font-size:13px;font-weight:900;
                    letter-spacing:2px;padding:14px 32px;border-radius:8px;text-decoration:none;
                    border:2px solid #080F06;">
            GO TO COMMUNITY →
          </a>
        </div>

        <!-- Quote -->
        <div style="border-left:3px solid #3CCE2A;padding:12px 16px;background:#1A2614;border-radius:0 8px 8px 0;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#8AAA78;line-height:1.7;font-style:italic;">
            "Every fan makes Colet shine brighter. Thank you for being part of CFS." 💚
          </p>
        </div>

        <p style="margin:0;font-size:13px;color:#5A7A50;line-height:1.7;">
          With love,<br/>
          <strong style="color:#3CCE2A;">The CFS Team</strong>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="font-size:11px;color:#2C4820;margin:0 0 4px;letter-spacing:1px;">CFS · BINI COLET FAN CLUB</p>
      <p style="font-size:11px;color:#1A2614;margin:0;">Colet Fan Suporta · Philippines</p>
    </div>

  </div>
</body>
</html>
    `,
  });
}