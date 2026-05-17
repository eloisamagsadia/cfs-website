# CFS Bini Colet Fan Club Website - Dev Handoff
Stack: Next.js 14, Supabase, Clerk, Resend, PayMongo, Cloudflare R2
Developer: eloisamagsadia | Target Launch: May 31, 2026
Working Directory: /Users/eloisamagsadia/Desktop/cfs-website-v1
Session: Week 11 - Mobile Responsive + Notifications + Chat Improvements + Nicknames

## HOW TO WORK WITH THIS CODEBASE

### Edit a file
python3 << EOF2
content = open("./path/to/file.tsx").read()
content = content.replace("old text", "new text")
open("./path/to/file.tsx", "w").write(content)
print("Done!")
EOF2

### Common Fixes
- Supabase join fails (text/uuid mismatch): fetch profiles separately using .in("id", ids)
- API 401: check requireAdmin() includes super_admin
- Next.js cache stale: add force-dynamic + revalidate = 0
- Upload 400: check folder is in ALLOWED_FOLDERS in /lib/r2.ts and /app/api/upload/route.ts
- Realtime not working: use polling instead (Clerk + Supabase anon key = RLS blocks realtime)
- Supabase singleton: never call createClient() inside component render
- String replace fails: file has wrapped lines, use line number method
- Chat room height: use calc(100vh - 130px) with overflow hidden. Do NOT use position:fixed (covers sidebar). Do NOT use negative margins.
- Notifications realtime blocked by RLS: use polling every 10s via /api/notifications/count
- Skeleton loaders: use SkeletonPage from @/components/shared/SkeletonPage

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

## Messaging System
- DB tables: chat_rooms, chat_members, chat_messages, chat_reactions, chat_nicknames
- chat_messages: id, room_id, sender_id, content, reply_to_id, image_url, is_pinned, created_at
- chat_rooms: id, name, is_group, created_by, avatar_url, pinned_message_id, created_at
- chat_nicknames: id, room_id, set_by (text), target_user_id (text), nickname, UNIQUE(room+set_by+target)
- Typing: broadcast channel, singleton getSupabase(), mountedRef guard, 3000ms timeout
- Seen receipts: last_read_at in chat_members
- Reactions: hover, emoji picker, toggle, grouped count
- Reply: hover, reply preview bar, send
- Pin: hover, star SVG, shown in drawer and banner
- Photo upload: R2 messages/ folder
- Emoji picker: emoji-mart dark theme, click outside closes
- Mentions: type @, dropdown, arrow keys, Enter
- Drawer: full screen on mobile, shows room info, members, search, pinned, nicknames, leave
- Nicknames: per-room per-user, each member sets for others only they see
- Nickname API: GET/PATCH /api/chat/[roomId]/nickname
- Chat layout: height calc(100vh-130px), overflow hidden, messages scroll with padding-bottom 80px
- Messages: own 92% width, others 75%
- New message sends notification to all other room members

### Inbox
- Search by name, filter ALL/DIRECT/GROUPS
- Hover to LEAVE with confirm
- Unread badge, bold unread

### API Routes
- GET/POST /api/chat
- GET/POST /api/chat/[roomId]
- GET /api/chat/[roomId]/seen
- GET/POST /api/chat/[roomId]/reactions
- POST /api/chat/[roomId]/pin
- POST /api/chat/[roomId]/leave
- GET/PATCH /api/chat/[roomId]/nickname
- GET /api/community/members

## Notification System
- Bell in navbar opens dropdown (not page)
- Polls every 10s via /api/notifications/count
- Dropdown uses /api/notifications (admin client bypasses RLS)
- Full page at /members/notifications (removed from sidebar)
- Sound toggle in localStorage
- SVG icons for all types

### Triggers
- Chat message: new_message to all other members
- Community comment: community_reply to post author
- Community mention: community_mention to mentioned user
- Community reaction: community_reply to post author
- Community repost: community_reply to post author
- New follower: new_follower to followed user
- Event registration: event_reminder to registrant
- Ticket confirmed: event_reminder to member
- Order status: order_update to member
- Support reply: support_reply to member
- Role change: to member
- Admin broadcast: to all members

### API Routes
- GET /api/notifications
- PATCH /api/notifications (id or all:true)
- DELETE /api/notifications (id or clearRead:true)
- GET /api/notifications/count

## Mobile Responsive
- Support tickets: card layout on mobile
- Media library: hides SIZE/UPLOADED/ACTIONS on mobile, grid minmax 140px
- Promo codes: card layout, form 4col to 2col
- Email page: 2-col to 1-col
- Admin More: all sidebar sections present
- Chat drawer: full screen on mobile
- Skeleton: SkeletonPage component, 2-col mobile 4-col desktop
- Admin community: SVG icons, expandable preview, pinned on top
- Mobile nav: Dashboard / Events / Members / Orders / More

## Admin Community
- Expandable post cards with full content + images
- SVG action icons (pin, hide, delete)
- Pinned posts on top (order by is_pinned DESC, created_at DESC)

## Account Pages
- /members/account: hub
- /members/account/posts: My Posts
- /members/account/activity: comments + reactions
- /members/account/profile: Edit profile
- /members/account/settings: Notification settings
- /members/account/media: Media library
- MESSAGE button on member profiles starts DM

## Support Ticket System
- DB: support_tickets + attachments[], member_reply, member_replied_at
- Member: submit with photos, expandable thread, reply to admin
- Admin: table + filters, inline thread, lightbox
- Admin reply triggers support_reply notification
- Upload folder: support in R2

## Email System
- Resend: 3000/month, 100/day
- Admin composer: templates, [NAME] placeholder
- Order confirmation on manual order + PayMongo webhook

## Shipping
- DB: shipping_rates (region, weight_from, weight_to, rate)
- Admin: inline edit at /admin/shipping
- Checkout: dynamic shipping + processing fee

## Navigation
- Topbar: My Account, Settings, Help, Admin Panel, Super Admin
- Member sidebar: Messages added, Notifications removed
- Mobile nav: Dashboard / Events / Members / Orders / More
- Admin mobile More: all items present

## Event System
- Early access: sponsor to member to everyone
- Tiers: Free / Paid (PayMongo pending)
- Ticket: CFS-{USERNAME}-{RANDOM8}
- PHT dates: lib/date.ts

## DB Tables
- chat_rooms, chat_members, chat_messages, chat_reactions
- chat_nicknames (room_id, set_by text, target_user_id text, nickname)
- notifications (user_id, type, title, message, link, is_read)
- support_tickets (attachments[], member_reply, member_replied_at)
- profiles.image_post_count, image_post_reset_at

## Role Hierarchy
super_admin > admin > moderator > sponsor > member

### Fonts
R = var(--font-righteous,'Righteous',sans-serif)
B = var(--font-barlow,'Barlow',sans-serif)
S = var(--font-dm-serif,'DM Serif Display',serif)

### Colors
BG: #0F1A0B / #1A2614  Border: #2C4820  Text: #F0EAD6
Green: #3CCE2A  Orange: #F07228  Yellow: #F5C82A  Red: #F04060
Purple/Sponsor: #B47FE3  Cyan/Mod: #69C9D0

## Pending
- Screenshot thumbnail fix (EventFanWall.tsx line 27-33)
- Projects public gallery
- PayMongo integration
- ~~Unread badge on Messages nav item~~ DONE — shows unread room count, polls every 15s via /api/chat/unread
- Mobile testing: community, events, shop, cart, orders, profiles, badges, codes
- Nickname display in chat bubbles (getDisplayName uses nicknames map from API on mount)

## Pre-Launch Checklist
- Delete app/api/debug/route.ts
- Switch Clerk to live keys
- Set up Clerk webhook
- RLS policy on profiles: Members can read public profiles
- Disable maintenance mode
- Add Vercel DNS to Cloudflare
- Test signup + welcome email
- Test PayMongo
- Full mobile testing
- Migrate R2 files to per-user folder structure

## Session Updates (Week 11 continued)

### Notifications
- Bell dropdown: grouped by type, collapsible per group, deduped per link
- Notifications disappear when clicked or marked read
- Swipe left to dismiss on mobile
- Sender avatar shown for message notifications (stored in notifications.image_url)
- Community notification links fixed: /members/community/[postId]
- Bell only shows unread notifications (fetch with ?unread=true)
- Duplicate notifications silently marked read on load

### Chat Nicknames
- Collapsible NICKNAMES section in drawer
- Each member can set nicknames for all members including themselves
- Nickname shown in chat bubbles, header, and drawer members list
- SVG edit icon (pen/paper style)
- API: GET/PATCH /api/chat/[roomId]/nickname
- DB: chat_nicknames (room_id, set_by text, target_user_id text, nickname)

### Messages Unread Badge
- Red badge on Messages sidebar item showing unread room count
- Red dot on More in mobile nav when there are unread messages
- Polls every 15s via /api/chat/unread
- Shows room count not message count

### Other Fixes
- Chat realtime working — messages appear without refresh
- Community notification links fixed (were 404ing)
- Bell dropdown now filters unread only
- Notification type grouping with collapse/expand
