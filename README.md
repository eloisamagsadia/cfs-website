# CFS Media Library

## Files
- `app/admin/media/page.tsx` — Media library UI page
- `app/api/admin/media/route.ts` — GET (list all R2 files), DELETE (single or bulk)
- `app/api/upload/route.ts` — UPDATED upload route with WebP optimization + 1200px resize

## Setup

### 1. Install sharp for image optimization
```bash
npm install sharp
npm install --save-dev @types/sharp
```

### 2. Drop files into your project
Copy each file to the matching path in your Next.js project.

### 3. Add to admin nav
Add this link to your admin sidebar (app/admin/layout.tsx):
```tsx
<Link href="/admin/media">🖼 MEDIA</Link>
```

## Features
- View all R2 files across all folders
- Filter by folder tab (products/, events/, avatars/, etc.)
- Search by filename
- Grid view (thumbnails) and list view
- Click image to open lightbox with full preview
- Copy public URL to clipboard
- Delete single file or bulk delete selected files
- Upload new files with folder selector
- Images auto-converted to WebP + resized to max 1200px on upload
- Shows savings (e.g. "2.1MB → 420KB (80% saved)") after upload
- PDFs shown with document icon, with View link in list view

## Image Optimization (upload route)
- Format: Converts all images to WebP (quality 82)
- Resize: Max 1200×1200px, preserves aspect ratio, never upscales
- Typical savings: 60–80% vs original JPG/PNG
- PDFs are passed through unchanged
