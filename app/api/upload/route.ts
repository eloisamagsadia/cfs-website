import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import sharp from "sharp";
import {
  r2, R2_BUCKET, R2_PUBLIC_URL,
  ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES, ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE, MAX_DOCUMENT_SIZE, MAX_VIDEO_SIZE,
  type R2Folder,
} from "@/lib/r2";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const ALLOWED_FOLDERS: R2Folder[] = [
  "avatars", "products", "events", "reports", "projects", "badges", "gallery", "community",
];

const MAX_DIMENSION = 1200;

async function optimizeImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; contentType: string }> {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) return { buffer, contentType: mimeType };
  const optimized = await sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  return { buffer: optimized, contentType: "image/webp" };
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = formData.get("folder") as R2Folder | null;

  if (!file || !folder) return NextResponse.json({ error: "Missing file or folder" }, { status: 400 });
  if (!ALLOWED_FOLDERS.includes(folder)) return NextResponse.json({ error: "Invalid folder" }, { status: 400 });

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isDocument && !isVideo)
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });

  const maxSize = isDocument ? MAX_DOCUMENT_SIZE : isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize)
    return NextResponse.json({ error: `File too large. Max ${maxSize / 1024 / 1024}MB` }, { status: 400 });

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const { buffer, contentType } = isImage
    ? await optimizeImage(rawBuffer, file.type)
    : { buffer: rawBuffer, contentType: file.type };

  const ext = isImage ? "webp" : (file.name.split(".").pop() ?? "bin");
  const key = `${folder}/${nanoid()}.${ext}`;

  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  const originalKB = Math.round(file.size / 1024);
  const optimizedKB = Math.round(buffer.length / 1024);

  return NextResponse.json({
    url: `${R2_PUBLIC_URL}/${key}`,
    key,
    originalSize: file.size,
    optimizedSize: buffer.length,
    savings: `${originalKB}KB → ${optimizedKB}KB`,
  });
}
