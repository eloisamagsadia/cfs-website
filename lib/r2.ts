import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CF_R2_SECRET_KEY!,
  },
});

export const R2_BUCKET = process.env.CF_R2_BUCKET!;
export const R2_PUBLIC_URL = process.env.CF_R2_PUBLIC_URL!;

// ─── FOLDER CONSTANTS ─────────────────────────────────────────────────────────
export const R2_FOLDERS = {
  AVATARS:   "avatars",
  PRODUCTS:  "products",
  EVENTS:    "events",
  GALLERY:   "gallery",
  COMMUNITY: "community",
  SUPPORT:   "support",
  MESSAGES:  "messages",
  REPORTS:   "reports",
  PROJECTS:  "projects",
  BADGES:    "badges",
} as const;

export type R2Folder = typeof R2_FOLDERS[keyof typeof R2_FOLDERS];

// ─── ALLOWED FILE TYPES ───────────────────────────────────────────────────────
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

// ─── FILE SIZE LIMITS ─────────────────────────────────────────────────────────
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;    //  5MB
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_VIDEO_SIZE = 30 * 1024 * 1024;   // 100MB

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Extract the R2 key from a public URL.
 * e.g. "https://pub-xxx.r2.dev/avatars/abc123.jpg" → "avatars/abc123.jpg"
 */
export function getKeyFromUrl(url: string): string {
  return url.replace(`${R2_PUBLIC_URL}/`, "");
}

/**
 * Delete a file from R2 by its public URL.
 */
export async function deleteFromR2(publicUrl: string): Promise<void> {
  const key = getKeyFromUrl(publicUrl);
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}
