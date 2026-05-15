# CFS Bini Colet Fan Club Website — Dev Handoff
**Stack:** Next.js 14, Supabase, Clerk, Resend, PayMongo, Cloudflare R2
**Developer:** eloisamagsadia | **Target Launch:** May 31, 2026
**Working Directory:** /Users/eloisamagsadia/Desktop/cfs-website-v1
**Session:** Week 10 — Mobile + Promo Codes + Orders + Shop + Support + Shipping + Email + Product Gallery

---

## HOW TO WORK WITH THIS CODEBASE (Terminal Patterns)

### Read a file
cat ./path/to/file.tsx

### Search in a file
grep -n "searchterm" ./path/to/file.tsx

### Search across all files
grep -rn "searchterm" ./app --include="*.tsx"

### Find a file
find . -path ./node_modules -prune -o -name "filename.tsx" -print

### View specific lines
sed -n '50,70p' ./path/to/file.tsx

### Edit a file (safest method)
python3 << 'EOF'
content = open("./path/to/file.tsx").read()
content = content.replace("old text", "new text")
open("./path/to/file.tsx", "w").write(content)
print("Done!")
EOF

### Edit by line number (use when string replace fails due to wrapping)
python3 << 'EOF'
lines = open("./path/to/file.tsx").readlines()
lines[59] = lines[59].replace("old", "new")
open("./path/to/file.tsx", "w").writelines(lines)
print("Done!")
EOF

### Insert at line number
python3 << 'EOF'
lines = open("./path/to/file.tsx").readlines()
lines.insert(79, "new line content\n")
open("./path/to/file.tsx", "w").writelines(lines)
print("Done!")
EOF

### Rewrite entire file (use when file is corrupted from multiple edits)
cat > ./path/to/file.tsx << 'EOF'
file contents here
EOF

### Common Fixes
- Event handlers in server component: remove onMouseEnter/Leave, use CSS in globals.css
- Hydration error: move inline style tags to globals.css
- Table not in types: use (client as any).from("table")
- API 401: check requireAdmin() includes super_admin
- Date showing UTC: add timeZone: Asia/Manila to all date calls
- Mobile overflow: add className + CSS @media (max-width: 768px) in globals.css
- super_admin blocked: check middleware includes super_admin
- String replace fails: file has wrapped lines, use line number method
- Next.js cache stale: add force-dynamic + revalidate = 0
- Checkout page: use cat > rewrite method if editing, avoid python replace on long lines

---

## Current Status
- Site deployed to Vercel (ignoreBuildErrors: true)
- coletfs.com live with maintenance page (Cloudflare worker)
- Resend verified (noreply@coletfs.com)
- R2 custom domain (media.coletfs.com)
- Full role system: super_admin, admin, moderator, sponsor, member
- Exclusive content for sponsors
- Super Admin at /super (separate world, gold theme)
- All server component pages: force-dynamic + revalidate 0
- All admin API routes: super_admin auth bug fixed
- Promo codes with product restriction
- Manual order creation with email confirmation
- Shop with drag and drop image upload
- Support ticket system
- Shipping management: weight-based rates per region
- Checkout: dynamic shipping, processing fee included, PayMongo pending banner
- Email system: admin composer + 3 templates + order receipt
- Product page: image gallery with lightbox + zoom hover, VIEW CART stays visible
- PENDING: PayMongo integration

---

## Three Navigation Worlds
Members /members  — Green  #3CCE2A — MobileNav.tsx
Admin   /admin    — Orange #F07228 — MobileAdminNav.tsx
Super   /super    — Gold   #F5C82A — MobileSuperNav.tsx

---

## Mobile Setup

### CSS Classes (app/globals.css)
@media (max-width: 768px) {
  .desktop-sidebar { display: none !important; }
  .mobile-only { display: block !important; }
  .community-sidebar { display: none !important; }
  .community-layout { flex-direction: column !important; }
  .event-detail-grid { grid-template-columns: 1fr !important; }
  .event-register-card { position: static !important; }
  .nav-links { display: none !important; }
  .members-table-desktop { display: none !important; }
  .members-cards-mobile { display: flex !important; }
  .ticket-template-grid { grid-template-columns: 1fr !important; }
  .edit-event-grid { grid-template-columns: 1fr !important; }
  .cart-layout { grid-template-columns: 1fr !important; }
  .letter-card { flex-direction: column-reverse !important; }
  .letter-thumbnail { width: 100% !important; height: 180px !important; }
}
@media (min-width: 769px) {
  .members-cards-mobile { display: none !important; }
  .event-card-actions { width: auto !important; flex-shrink: 0; }
}

### More Pages
- ./app/(members)/members/more/page.tsx
- ./app/admin/more/page.tsx
- ./app/super/more/page.tsx

---

## Product Image Gallery
- Component: ./components/public/ProductImageGallery.tsx
- Features: thumbnail click to swap main image, zoom on hover, lightbox on click
- Lightbox: prev/next arrows, dot navigation, click outside to close
- VIEW CART button stays visible until user navigates away

---

## Email System
- Resend free plan: 3,000/month, 100/day
- Admin composer: /admin/email — search by name/email/role, templates, [NAME] placeholder
- Templates: Thank You, Reward/Badge, Announcement
- Order confirmation: fires on manual order POST, also wired in PayMongo webhook
- Email functions: /lib/email.ts
- profiles.email column added, backfilled from Clerk, auto-saved on new signup

---

## Shipping System
- DB table: shipping_rates (region, weight_from, weight_to, rate)
- Regions: Metro Manila, Luzon, Visayas, Mindanao
- Admin: /admin/shipping — inline edit rates
- API: GET /api/shipping?region=X&weight=Y
- Products have weight_kg field (default 0.5kg)
- Checkout calculates shipping dynamically on region change

---

## Support Ticket System
- DB table: support_tickets
- Member: /members/support, /members/support/tickets
- Admin: /admin/support
- API: /api/support

---

## Promo Codes
- DB table: promo_codes with product_ids uuid[]
- Admin: /admin/codes
- API: /api/codes/validate

---

## Manual Orders
- /admin/orders/create
- Sends order confirmation email automatically
- DB: orders has notes column

---

## Shop
- 7 products: Mga Sasakyan ni Coco + This is COLET
- Products have weight_kg for shipping
- Edit: drag and drop upload to R2, auto WebP
- Homepage: all products shown directly
- Product page: shows "Shipping fee based on region and weight" and "Secure checkout"

---

## Checkout
- Dynamic shipping by region + weight
- Processing fee (2.45% + P15) always included
- PayMongo pending: shows "PAYMENT COMING SOON" banner
- When PayMongo ready: remove banner, re-enable button

---

## Super Admin Pages
/super, /super/roles, /super/exclusive, /super/broadcast
/super/settings, /super/audit, /super/danger, /super/more

---

## Event System
- Early access: sponsor_access_at → member_access_at → everyone
- Tiers: Free (green RSVP) / Paid (orange PAY — PayMongo pending)
- Ticket format: CFS-{USERNAME}-{RANDOM8}
- PHT dates: toISOWithPHT(), toPHTInputString() from lib/date.ts

---

## API Routes
GET    /api/admin/members              — includes email field
GET    /api/admin/stats
GET    /api/admin/audit-log            — super_admin only
GET    /api/admin/members/export       — super_admin only
POST   /api/admin/members/role
POST   /api/admin/broadcast
GET/PATCH /api/admin/site-settings
GET/PATCH /api/admin/sponsor-perks
GET/POST/PATCH/DELETE /api/events/tiers
GET/POST /api/events/tickets
GET/DELETE /api/user/media
GET/POST/PATCH/DELETE /api/exclusive
GET/POST/PATCH/DELETE /api/admin/orders
GET /api/admin/products
POST /api/codes/validate
GET/POST/PATCH /api/support
GET/PATCH /api/shipping
POST /api/admin/email

---

## Role Hierarchy
super_admin > admin > moderator > sponsor > member

### requireAdmin() pattern
if (!["admin", "super_admin"].includes(role ?? "")) return 401;

### Fonts
const R = "var(--font-righteous,'Righteous',sans-serif)";
const B = "var(--font-barlow,'Barlow',sans-serif)";
const S = "var(--font-dm-serif,'DM Serif Display',serif)";

### Colors
BG: #0F1A0B / #1A2614  Border: #2C4820  Text: #F0EAD6
Green: #3CCE2A  Orange: #F07228  Yellow: #F5C82A  Red: #F04060
Purple/Sponsor: #B47FE3  Cyan/Mod: #69C9D0

---

## Pending Features
- Screenshot thumbnail fix (EventFanWall.tsx ~line 27-33)
- Projects public gallery
- PayMongo integration

## Pre-Launch Checklist
- Delete app/api/debug/route.ts
- Switch Clerk to live keys
- Set up Clerk webhook
- Disable maintenance mode on coletfs.com
- Add Vercel DNS to Cloudflare
- Test signup to welcome email flow
- Test PayMongo when ready
- Full mobile testing on real device
- Migrate old R2 files to per-user folder structure