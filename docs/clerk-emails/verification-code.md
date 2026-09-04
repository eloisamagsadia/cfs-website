# Clerk Verification Code (OTP) — Branded Template

Paste this into **Clerk Dashboard → Customization → Emails → Security → Verification code → Edit**.
Clerk injects `{{otp_code}}` (the 6-digit code) and `{{app.name}}` at send time.

## Subject line

```
Your Colet Fan Suporta verification code
```

## HTML body

```html
<div style="background:#FAF6EE;padding:32px 16px;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;">

    <!-- Wordmark -->
    <div style="text-align:center;padding:4px 0 20px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:0.5px;color:#1B3A2D;">Colet Fan Suporta</div>
    </div>

    <!-- Card -->
    <div style="background:#FFFFFF;border:1px solid #DDE8DD;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(27,58,45,0.08);">

      <!-- Green stripe -->
      <div style="height:8px;background:linear-gradient(90deg,#156530 0%,#1A8040 50%,#4ACB6E 100%);"></div>

      <div style="padding:32px 32px 8px;text-align:center;">
        <div style="display:inline-block;background:#E8F0E4;color:#1A8040;font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 12px;border-radius:999px;">VERIFICATION CODE</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;color:#1B3A2D;margin:14px 0 6px;">Confirm it's you</h1>
        <p style="font-size:14px;color:#4A7C59;line-height:1.6;margin:0;">
          Use the code below to finish signing in to Colet Fan Suporta.
        </p>
      </div>

      <!-- The code -->
      <div style="padding:20px 32px 8px;text-align:center;">
        <div style="display:inline-block;background:#FAF6EE;border:1px dashed #C7D6BE;border-radius:14px;padding:18px 32px;">
          <div style="font-family:'SF Mono','Menlo','Consolas',monospace;font-size:34px;font-weight:700;letter-spacing:12px;color:#156530;line-height:1;">
            {{otp_code}}
          </div>
        </div>
        <div style="font-size:11px;color:#7A8E7A;letter-spacing:1.5px;text-transform:uppercase;margin-top:10px;">
          Expires in 10 minutes
        </div>
      </div>

      <div style="padding:18px 32px 32px;">
        <div style="font-size:13px;color:#5A7A60;line-height:1.65;text-align:center;">
          Never share this code with anyone. Our team will never ask you for it — not by DM, chat, or phone.
          <br/><br/>
          If you didn't try to sign in, you can safely ignore this email.
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:22px 8px 4px;font-size:11px;color:#7A8E7A;line-height:1.7;">
      Colet Fan Suporta · <a href="https://coletfs.com" style="color:#7A8E7A;">coletfs.com</a><br/>
      This message was sent by our authentication provider.
    </div>
  </div>
</div>
```

## Where to click in the Clerk dashboard

1. `dashboard.clerk.com` → your project
2. Left nav → **Customization → Emails**
3. Tab: **Security** (top of the page)
4. Find **Verification code** → click **Edit**
5. Replace the Subject and HTML with the blocks above
6. Click **Save**

## Test it

- Sign out, then sign back in from an incognito window
- The 6-digit code should arrive in the branded shell
- If you don't want to keep triggering real signins, use Clerk's "Send test email" button on the same edit screen

## Variables Clerk supports on this template

| Variable | What it renders |
|---|---|
| `{{otp_code}}` | The 6-digit code (required — don't remove) |
| `{{app.name}}` | Your Clerk app name |
| `{{app.logo_image_url}}` | Uploaded logo URL |

Only `{{otp_code}}` is used in the template above. The wordmark is hardcoded so it matches our other emails exactly instead of relying on whatever's in Clerk's app-name field.
