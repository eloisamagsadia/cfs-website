# Cloudflare Email Worker — inbound reply sync for /admin/contact

When a guest replies to an admin's outgoing contact email, this Worker
catches the reply and POSTs it to `/api/webhooks/resend-inbound`, which
appends it to the `contact_messages.replies` thread. Admin sees guest
replies show up in `/admin/contact` automatically.

## Prerequisites

- `coletfs.com` DNS is at Cloudflare (it is).
- The site is deployed at `https://coletfs.com`.
- `contact_message_thread.sql` migration is applied (already done).

## Setup (one-time, ~5 min)

### 1. Enable Email Routing on the domain

Cloudflare dashboard → `coletfs.com` → **Email** → **Email Routing** →
click **Get started**. Cloudflare adds the MX + TXT records automatically.

### 2. Add a destination address

Under **Destination addresses**, add any email you own (e.g., your Gmail)
and confirm the verification link Cloudflare emails you. This is only
used as a fallback destination for unmatched addresses.

### 3. Create the Email Worker

Dashboard → **Workers & Pages** → **Create** → **Create Worker** →
name it `cfs-inbound` → click **Deploy** (empty template is fine, we
replace the code next).

Open the Worker → **Edit code** → replace everything with the script
below → **Deploy**.

### 4. Set the Worker's environment variables

Worker → **Settings** → **Variables** → **Add variable** (Encrypt each):

| Name                  | Value                                          |
|-----------------------|------------------------------------------------|
| `CFS_URL`             | `https://coletfs.com`                          |
| `CFS_INBOUND_SECRET`  | any long random string (generate one, save it) |

Copy the same secret string — you'll paste it into Vercel next.

### 5. Route inbound mail to the Worker

Cloudflare → **Email** → **Email Routing** → **Routing rules** →
**Create address** → pick **Catch-all address** (or a custom rule for
`replies+*@coletfs.com`) → **Action: Send to a Worker** → pick
`cfs-inbound`.

### 6. Set the matching env vars on Vercel

Vercel → project → **Settings** → **Environment Variables** → add:

| Name                         | Value                                  |
|------------------------------|----------------------------------------|
| `RESEND_INBOUND_DOMAIN`      | `coletfs.com`                          |
| `CFS_INBOUND_WEBHOOK_SECRET` | *same value* as `CFS_INBOUND_SECRET`   |

Redeploy so they take effect.

## The Worker script

```js
// Cloudflare Email Worker — forwards inbound email to CFS webhook.
// Deploy in Cloudflare dashboard → Workers → cfs-inbound → Edit code.

export default {
  /**
   * @param {import("@cloudflare/workers-types").ForwardableEmailMessage} message
   * @param {{ CFS_URL: string, CFS_INBOUND_SECRET: string }} env
   */
  async email(message, env, ctx) {
    // Read the raw MIME email
    const chunks = [];
    const reader = message.raw.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const raw = new TextDecoder().decode(concat(chunks));

    // Extract text/plain body from the MIME (best-effort, no deps)
    const text = extractPlain(raw);
    const subject = message.headers.get("subject") ?? "";
    const messageId = message.headers.get("message-id") ?? null;

    // POST to CFS webhook
    try {
      const res = await fetch(`${env.CFS_URL}/api/webhooks/resend-inbound`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cfs-inbound-secret": env.CFS_INBOUND_SECRET,
        },
        body: JSON.stringify({
          data: {
            to: message.to,
            from: message.from,
            subject,
            text,
            html: "",
            message_id: messageId,
          },
        }),
      });
      if (!res.ok) {
        // Fall back: forward to a human so nothing gets lost
        console.error("CFS webhook rejected:", res.status, await res.text());
        // await message.forward("your-fallback@gmail.com");
      }
    } catch (e) {
      console.error("CFS webhook error:", e);
      // await message.forward("your-fallback@gmail.com");
    }
  },
};

function concat(chunks) {
  let len = 0;
  for (const c of chunks) len += c.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

// Pull out the text/plain part of a multipart MIME message.
// Falls back to everything after the first blank line if not multipart.
function extractPlain(raw) {
  const boundaryMatch = raw.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
  if (boundaryMatch) {
    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const parts = raw.split(`--${boundary}`);
    for (const part of parts) {
      if (/Content-Type:\s*text\/plain/i.test(part)) {
        const idx = firstBlankLine(part);
        if (idx >= 0) {
          const enc = /Content-Transfer-Encoding:\s*quoted-printable/i.test(part);
          const body = part.slice(idx).trim();
          return enc ? decodeQP(body) : body;
        }
      }
    }
  }
  const idx = firstBlankLine(raw);
  return idx >= 0 ? raw.slice(idx).trim() : raw;
}
function firstBlankLine(s) {
  const a = s.indexOf("\r\n\r\n");
  if (a >= 0) return a + 4;
  const b = s.indexOf("\n\n");
  if (b >= 0) return b + 2;
  return -1;
}
function decodeQP(s) {
  return s
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
```

## Test it

1. From `/admin/contact`, send a test reply to yourself (an email you can access).
2. Reply to that email from your inbox.
3. Refresh `/admin/contact` — your reply should appear as a **FROM GUEST**
   blue card in the thread within a few seconds. Status flips back to NEW.

If it doesn't work, check Worker logs (Cloudflare → Workers → cfs-inbound
→ Logs) and Vercel function logs for `/api/webhooks/resend-inbound`.
