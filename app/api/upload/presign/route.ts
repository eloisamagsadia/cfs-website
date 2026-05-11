import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { r2, R2_BUCKET, R2_PUBLIC_URL, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  // 1. Auth check
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  const { fileType, folder } = await req.json();

  // 3. Validate
  const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
  if (!fileType || !allowedTypes.includes(fileType)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  const allowedFolders = ["gallery", "community"];
  if (!folder || !allowedFolders.includes(folder)) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  // 4. Generate key and presigned URL
  const ext = fileType.split("/")[1] ?? "bin";
  const key = `${folder}/${nanoid()}.${ext}`;

  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: fileType,
    }),
    { expiresIn: 120 } // 2 minutes to start the upload
  );

  return NextResponse.json({
    uploadUrl,
    publicUrl: `${R2_PUBLIC_URL}/${key}`,
  });
}
