# CFS Bini Colet Fan Club Website — Dev Handoff
**Stack:** Next.js 14, Supabase, Clerk, Resend, PayMongo, Cloudflare R2
**Developer:** eloisamagsadia | **Target Launch:** May 31, 2026
**Working Directory:** /Users/eloisamagsadia/Desktop/cfs-website-v1
**Session:** Week 10 — Bug Fixes + Messaging + Support Threading + Account Pages + Chat Improvements

---

## HOW TO WORK WITH THIS CODEBASE (Terminal Patterns)

### Edit a file (safest method)
python3 << 'EOF'
content = open("./path/to/file.tsx").read()
content = content.replace("old text", "new text")
open("./path/to/file.tsx", "w").write(content)
print("Done!")
EOF

### Edit by line number
python3 << 'EOF'
lines = open("./path/to/file.tsx").readlines()
lines[59] = lines[59].replace("old", "new")
open("./path/to/file.tsx", "w").writelines(lines)
print("Done!")
EOF

### Rewrite entire file
cat > ./path/to/file.tsx << 'EOF'
file contents here
EOF

### Common Fixes
- Supabase join fails (text/uuid mismatch): fetch profiles separately using .in("id", ids)
- API 401: check requireAdmin() includes super_admin
- Next.js cache stale: add force-dynamic + revalidate = 0
- Upload 400: check folder is in ALLOWED_FOLDERS in /lib/r2.ts and /app/api/upload/route.ts
- Realtime not working: check RLS policies on profiles table
- Supabase broadcast typing: use module-level singleton getSupabase(), mountedRef guard, 3000ms timeout
- Multiple GoTrueClient instances: never call createClient() inside component render, use singleton
- String replace fails: file has wrapped lines, use line number method
- Chat room height off: uses calc(100dvh - 140px) with negative margin to escape layout padding

---

## Current Status
- Site deployed to Vercel (ignoreBuildErrors: true)
- coletfs.com live with maintenance page (Cloudflare worker)
- Resend verified (noreply@coletfs.com)
- R2 custom domain (media.coletfs.com)
- Full role system: super_admin, admin, moderator, sponsor, member
- All server component pages: force-dynamic + revalidate 0
- PayMongo pending: checkout + donate show "PAYMENT COMING SOON"
- profiles.is_public defaults to true
- profiles.email saved on signup via Clerk webhook
- RLS policy: "Members can read public profiles" on profiles (needed for realtime)

---

## Messaging System
- DB tables: chat_rooms, chat_members, chat_messages, chat_reactions
- chat_messages columns: id, room_id, sender_id, content, reply_to_id, image_url, is_pinned, created_at, edited_at
- chat_rooms columns: id, name, is_group, created_by, avatar_url, pinned_message_id, created_at
- Supabase Realtime: chat_messages INSERT, chat_members UPDATE
- Typing: broadcast channel, singleton pattern, mountedRef guard, 3000ms timeout
- Seen receipts: last_read_at in chat_members
- Reactions: hover → emoji picker → toggle, grouped count display
- Reply: hover → ↩ → reply preview bar → send
- Pin message: hover → star SVG → toggles, shown in drawer and pinned banner
- Photo upload: 📷 button → R2 messages/ folder, image renders in bubble
- Search: in drawer, filters messages inline
- Emoji picker: emoji-mart with dark theme, click outside to close
- Mentions: type @ → dropdown → arrow keys → Enter to select
- Side drawer: room info, members list with profile links, search, pinned, leave button

### Inbox (/members/messages)
- Search conversations by name
- Filter: ALL / DIRECT / GROUPS
- Hover → LEAVE button with confirm modal
- Unread count badge, bold unread conversations
- Borderless list layout

### API Routes
- GET/POST /api/chat
- GET/POST /api/chat/[roomId]
- GET /api/chat/[roomId]/seen
- GET/POST /api/chat/[roomId]/reactions
- POST /api/chat/[roomId]/pin
- POST /api/chat/[roomId]/leave
- GET /api/community/members

### Supabase Singleton (CRITICAL)
let _supabase: any = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient(URL, ANON_KEY);
  return _supabase;
}
Never call createClient() inside a component.

### R2 Folders
avatars, products, events, reports, projects, badges, gallery, community, support, messages

---

## Account Pages
- /members/account — hub
- /members/account/posts — My Posts (MemberProfile, isOwnProfile=true)
- /members/account/activity — My Activity (comments + reactions)
- /members/account/profile — Edit profile
- /members/account/settings — Notifications (Clerk link removed)
- /members/account/media — Media library
- Back nav on all sub-pages
- My Account removed from More (in topbar only)
- MESSAGE button on member profiles (starts DM)

---

## Support Ticket System
- DB: support_tickets + attachments[], member_reply, member_replied_at
- Member: submit with photos, expandable thread, reply to admin
- Admin: table + filters, inline thread, lightbox, attachment counts
- Upload folder "support" in R2

---

## Community
- Fan Art, Fan Cam, Events, Projects allow photo/video uploads
- TikTok/Instagram: fallback card
- Name click → member profile
- Post media shows in detail page

---

## Email System
- Resend: 3,000/month, 100/day
- Admin composer: /admin/email — templates, [NAME] placeholder
- Order confirmation on manual order + PayMongo webhook

---

## Shipping
- DB: shipping_rates (region, weight_from, weight_to, rate)
- Admin: /admin/shipping — inline edit
- Checkout: dynamic shipping + processing fee always included

---

## Navigation
- Topbar: My Account, Settings, Help & Support, Admin Panel, Super Admin
- Member sidebar: Messages added
- Mobile nav: Messages replaces Orders (Orders in More)
- More page: My Account removed

---

## Checkout / Donate
- Processing fee always on buyer/donor
- PayMongo pending banner + disabled button

---

## Event System
- Early access: sponsor → member → everyone
- Tiers: Free / Paid (PayMongo pending)
- Ticket: CFS-{USERNAME}-{RANDOM8}
- PHT dates: lib/date.ts

---

## DB Tables Added This Session
- chat_rooms, chat_members, chat_messages, chat_reactions
- chat_messages.reply_to_id, image_url, is_pinned
- chat_rooms.pinned_message_id
- support_tickets.attachments, member_reply, member_replied_at

---

## Role Hierarchy
super_admin > admin > moderator > sponsor > member
requireAdmin(): if (!["admin", "super_admin"].includes(role ?? "")) return 401;

### Fonts
const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

### Colors
BG: #0F1A0B / #1A2614  Border: #2C4820  Text: #F0EAD6
Green: #3CCE2A  Orange: #F07228  Yellow: #F5C82A  Red: #F04060
Purple/Sponsor: #B47FE3  Cyan/Mod: #69C9D0

---

## Pending
- Screenshot thumbnail fix (EventFanWall.tsx ~line 27-33)
- Projects public gallery
- PayMongo integration
- Unread badge on Messages nav item
- Chat room scroll behavior fine-tuning on mobile

## Pre-Launch Checklist
- Delete app/api/debug/route.ts
- Switch Clerk to live keys
- Set up Clerk webhook in Clerk dashboard
- RLS policy on profiles: "Members can read public profiles"
- Disable maintenance mode on coletfs.com
- Add Vercel DNS to Cloudflare
- Test signup → welcome email
- Test PayMongo when ready
- Full mobile testing
- Migrate old R2 files to per-user folder structure